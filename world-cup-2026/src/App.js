import React, { useState, useEffect } from 'react';
import './App.css';

export default function WorldCup2026Sweepstake() {
  const [tab, setTab] = useState('standings');
  const [matches, setMatches] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [allPredictions, setAllPredictions] = useState([]);
  const [showPredictionForm, setShowPredictionForm] = useState(null);
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [shareLink, setShareLink] = useState('');
  
  // Google Apps Script URL for predictions
  const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjbxhbOqHVm8il5AnQ7txGBxnz8YkowQ8_2C-zaLeF3KV4oWnXT1pr0cPPoqojPE1a/exec";
  
  // World Cup 2026 API - Free, no key required
  const WC_API_URL = "https://worldcup26.ir/api";

  // Professional color palette
  const colors = {
    primary: '#0052CC',      // Bold Blue
    success: '#2E7D32',      // Average Green
    danger: '#E53935',       // Torch Red
    warning: '#FFC107',      // Golden Yellow
    background: '#F8F9FA',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    text: '#212121',
    textSecondary: '#757575',
    primaryLight: '#E8EFFE',
    successLight: '#E8F5E9',
    dangerLight: '#FFEBEE',
    warningLight: '#FFF8E1'
  };

  // Hard-coded teams and colleagues
  const hardcodedTeams = [
    { id: 1, team: 'Argentina', colleague: 'John Smith', flag: '🇦🇷', group: 'A' },
    { id: 2, team: 'Brazil', colleague: 'Sarah Johnson', flag: '🇧🇷', group: 'D' },
    { id: 3, team: 'France', colleague: 'Michael Chen', flag: '🇫🇷', group: 'C' },
    { id: 4, team: 'England', colleague: 'Emma Wilson', flag: '🇬🇧', group: 'B' },
    { id: 5, team: 'Germany', colleague: 'David Martinez', flag: '🇩🇪', group: 'D' },
    { id: 6, team: 'Spain', colleague: 'Lisa Anderson', flag: '🇪🇸', group: 'D' },
  ];

  // Load from localStorage
  useEffect(() => {
    const savedMatches = JSON.parse(localStorage.getItem('wc2026_matches') || '[]');
    const savedPredictions = JSON.parse(localStorage.getItem('wc2026_predictions') || '{}');
    const savedPlayerName = localStorage.getItem('playerName') || '';

    setMatches(savedMatches);
    setPredictions(savedPredictions);
    setPlayerName(savedPlayerName);
    
    // Fetch latest matches from World Cup API
    fetchWorldCupMatches();
  }, []);

  // Fetch World Cup matches from API
  const fetchWorldCupMatches = async () => {
    try {
      const response = await fetch(`${WC_API_URL}/matches`);
      const data = await response.json();
      
      if (data && Array.isArray(data)) {
        // Map API data to our format
        const formattedMatches = data.map((match, idx) => ({
          id: match.id || idx,
          team1: match.home_team || 'TBD',
          team2: match.away_team || 'TBD',
          date: match.kickoff_utc || new Date().toISOString(),
          group: match.group_name || 'Group',
          score1: match.home_team_score !== null ? match.home_team_score : undefined,
          score2: match.away_team_score !== null ? match.away_team_score : undefined,
          status: match.status || 'scheduled'
        }));
        
        setMatches(formattedMatches);
        localStorage.setItem('wc2026_matches', JSON.stringify(formattedMatches));
      }
    } catch (error) {
      console.error('Error fetching World Cup matches:', error);
      // Use existing matches if API fails
    }
  };

  // Refresh matches every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchWorldCupMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('playerName', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('wc2026_matches', JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem('wc2026_predictions', JSON.stringify(predictions));
  }, [predictions]);

  // Generate shareable link
  useEffect(() => {
    if (hardcodedTeams.length > 0) {
      const encodedData = btoa(JSON.stringify({ teams: hardcodedTeams, matches, predictions }));
      const link = `${window.location.href}#data=${encodedData}`;
      setShareLink(link);
    }
  }, [matches]);

  // Check if match has started
  const hasMatchStarted = (matchDate) => {
    return new Date(matchDate) <= new Date();
  };

  // Submit prediction to Google Sheets
  const submitPredictionToSheets = async (matchId, prediction) => {
    if (!playerName.trim()) {
      alert('Please enter your name in Setup tab first!');
      return;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    // Check if match has started
    if (hasMatchStarted(match.date)) {
      alert('❌ This match has already started! Predictions are locked.');
      return;
    }

    try {
      const data = {
        playerName: playerName,
        match: `${match.team1} vs ${match.team2}`,
        team1: match.team1,
        team2: match.team2,
        prediction: prediction === 'team1' ? match.team1 : prediction === 'team2' ? match.team2 : 'Draw',
        timestamp: new Date().toISOString()
      };

      // Send to Google Sheets
      const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(data)
      });

      // Update local predictions
      setPredictions({ ...predictions, [matchId]: prediction });

      // Add to all predictions list
      setAllPredictions([...allPredictions, {
        playerName: playerName,
        matchId: matchId,
        match: `${match.team1} vs ${match.team2}`,
        prediction: prediction,
        timestamp: new Date(),
        correct: null
      }]);

      alert(`✅ Prediction locked for ${playerName}!`);
    } catch (error) {
      console.error('Error submitting prediction:', error);
      alert('⚠️ Error sending prediction.');
    }
  };

  const updateMatchScore = (matchId, score1, score2) => {
    const updatedMatches = matches.map(m =>
      m.id === matchId ? { ...m, score1: parseInt(score1) || 0, score2: parseInt(score2) || 0 } : m
    );
    setMatches(updatedMatches);
  };

  const getTeamStats = (teamName) => {
    let wins = 0, draws = 0, losses = 0;
    matches.forEach(match => {
      if ((match.team1 === teamName || match.team2 === teamName) && match.score1 !== undefined) {
        if (match.score1 === match.score2) {
          draws++;
        } else if ((match.team1 === teamName && match.score1 > match.score2) || (match.team2 === teamName && match.score2 > match.score1)) {
          wins++;
        } else {
          losses++;
        }
      }
    });
    return { wins, draws, losses };
  };

  const upcomingMatches = matches.filter(m => new Date(m.date) > new Date());
  const completedMatches = matches.filter(m => new Date(m.date) <= new Date(Date.now() - 2 * 60 * 60 * 1000));

  const containerStyle = {
    minHeight: '100vh',
    background: colors.background,
    fontFamily: "'Segoe UI', 'Roboto', '-apple-system', 'BlinkMacSystemFont', sans-serif",
    color: colors.text
  };

  const headerStyle = {
    background: colors.primary,
    color: 'white',
    padding: '2rem',
    textAlign: 'center',
    boxShadow: `0 2px 8px rgba(0, 82, 204, 0.15)`
  };

  const navStyle = {
    display: 'flex',
    gap: '0.5rem',
    padding: '1rem',
    background: colors.surface,
    borderBottom: `2px solid ${colors.border}`,
    justifyContent: 'center',
    flexWrap: 'wrap'
  };

  const tabButtonStyle = (isActive) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: isActive ? colors.primary : 'transparent',
    color: isActive ? 'white' : colors.textSecondary,
    cursor: 'pointer',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'all 0.2s ease',
    borderBottom: isActive ? `3px solid ${colors.primary}` : 'none'
  });

  const contentStyle = {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '2rem',
  };

  const cardStyle = {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    marginBottom: '1rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
  };

  const buttonStyle = (variant = 'primary') => {
    const variants = {
      primary: { background: colors.primary, color: 'white' },
      success: { background: colors.success, color: 'white' },
      danger: { background: colors.danger, color: 'white' },
      warning: { background: colors.warning, color: colors.text }
    };
    
    return {
      padding: '0.75rem 1.5rem',
      border: 'none',
      background: variants[variant].background,
      color: variants[variant].color,
      borderRadius: '6px',
      cursor: 'pointer',
      fontWeight: 600,
      fontSize: '14px',
      transition: 'all 0.2s ease',
    };
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ margin: '0 0 0.5rem', fontSize: '2.5rem', fontWeight: 700 }}>⚽ World Cup 2026</h1>
        <p style={{ margin: 0, fontSize: '1rem', opacity: 0.95 }}>Workplace Sweepstake Leaderboard</p>
      </div>

      <div style={navStyle}>
        {['standings', 'matches', 'teams', 'predictions', 'setup'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={tabButtonStyle(tab === t)}
          >
            {t === 'standings' && '🏆 Standings'}
            {t === 'matches' && '⚽ Matches'}
            {t === 'teams' && '👥 Teams'}
            {t === 'predictions' && '🎯 Predict'}
            {t === 'setup' && '⚙️ Setup'}
          </button>
        ))}
      </div>

      <div style={contentStyle}>
        {/* STANDINGS - PRIMARY */}
        {tab === 'standings' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>🏆 Team Standings</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '13px', fontWeight: 500 }}>TOTAL TEAMS</p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '2.5rem', fontWeight: 700, color: colors.primary }}>{hardcodedTeams.length}</p>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '13px', fontWeight: 500 }}>TOTAL MATCHES</p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '2.5rem', fontWeight: 700, color: colors.success }}>{matches.length}</p>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ margin: 0, color: colors.textSecondary, fontSize: '13px', fontWeight: 500 }}>COMPLETED</p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '2.5rem', fontWeight: 700, color: colors.warning }}>{completedMatches.length}</p>
              </div>
            </div>

            <h3 style={{ margin: '1.5rem 0 1rem', color: colors.primary, fontWeight: 700, fontSize: '1.2rem' }}>📊 Team Rankings</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              {hardcodedTeams.map((team, idx) => {
                const stats = getTeamStats(team.team);
                const totalPoints = stats.wins * 3 + stats.draws * 1;
                return (
                  <div key={team.id} style={{ ...cardStyle, background: idx === 0 ? colors.primaryLight : 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          background: colors.primary, 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 700,
                          fontSize: '16px',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>{team.flag}</span>
                            <div>
                              <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '15px', color: colors.primary }}>{team.team}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>Rep: {team.colleague}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto', gap: '1.5rem', textAlign: 'center' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: colors.success, fontSize: '18px' }}>{stats.wins}</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '10px', color: colors.textSecondary, fontWeight: 600 }}>W</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: colors.warning, fontSize: '18px' }}>{stats.draws}</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '10px', color: colors.textSecondary, fontWeight: 600 }}>D</p>
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: colors.danger, fontSize: '18px' }}>{stats.losses}</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '10px', color: colors.textSecondary, fontWeight: 600 }}>L</p>
                        </div>
                        <div style={{ background: colors.primaryLight, padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                          <p style={{ margin: 0, fontWeight: 700, color: colors.primary, fontSize: '18px' }}>{totalPoints}</p>
                          <p style={{ margin: '0.25rem 0 0', fontSize: '10px', color: colors.textSecondary, fontWeight: 600 }}>PTS</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MATCHES */}
        {tab === 'matches' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>⚽ Matches & Results</h2>
              <button 
                onClick={fetchWorldCupMatches}
                style={{ ...buttonStyle('primary'), whiteSpace: 'nowrap' }}
              >
                🔄 Refresh Data
              </button>
            </div>

            <div style={{ ...cardStyle, background: colors.successLight, border: `2px solid ${colors.success}`, marginBottom: '2rem' }}>
              <p style={{ margin: 0, color: colors.success, fontWeight: 600, fontSize: '13px' }}>✅ Live Data from FIFA World Cup API</p>
              <p style={{ margin: '0.5rem 0 0', color: colors.textSecondary, fontSize: '12px' }}>Auto-updates every 60 seconds • Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
            
            {matches.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem', background: colors.warningLight, border: `2px dashed ${colors.warning}` }}>
                <p style={{ margin: 0, color: colors.text, fontWeight: 600, fontSize: '16px' }}>Loading match data...</p>
                <p style={{ margin: '0.5rem 0 0', color: colors.textSecondary, fontSize: '14px' }}>Fetching latest matches from FIFA World Cup API</p>
              </div>
            ) : (
              <>
                {upcomingMatches.length > 0 && (
                  <>
                    <h3 style={{ margin: '0 0 1rem', color: colors.primary, fontWeight: 600, fontSize: '1.1rem' }}>⏳ Upcoming Matches ({upcomingMatches.length})</h3>
                    <div style={{ display: 'grid', gap: '12px', marginBottom: '2rem' }}>
                      {upcomingMatches.map(match => (
                        <div key={match.id} style={{ ...cardStyle }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, background: colors.primaryLight, padding: '0.25rem 0.75rem', borderRadius: '20px' }}>Group {match.group}</span>
                              </div>
                              <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '16px' }}>{match.team1} vs {match.team2}</p>
                              <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>
                                📅 {new Date(match.date).toLocaleDateString()} at {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <button 
                              onClick={() => setTab('predictions')} 
                              style={{ ...buttonStyle('primary'), whiteSpace: 'nowrap' }}
                            >
                              🎯 Predict
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {completedMatches.length > 0 && (
                  <>
                    <h3 style={{ margin: '0 0 1rem', color: colors.success, fontWeight: 600, fontSize: '1.1rem' }}>✅ Final Results ({completedMatches.length})</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {completedMatches.map(match => (
                        <div key={match.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: `4px solid ${colors.success}` }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: colors.textSecondary, background: colors.successLight, padding: '0.25rem 0.75rem', borderRadius: '20px' }}>Group {match.group}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <span style={{ fontWeight: 600 }}>{match.team1}</span>
                              <span style={{ fontSize: '1.3rem', fontWeight: 700, color: colors.success }}>{match.score1 ?? '-'} - {match.score2 ?? '-'}</span>
                              <span style={{ fontWeight: 600 }}>{match.team2}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input 
                              type="number" 
                              value={match.score1 ?? ''} 
                              onChange={(e) => updateMatchScore(match.id, e.target.value, match.score2)} 
                              style={{ ...inputStyle, width: '50px', textAlign: 'center' }} 
                            />
                            <span style={{ fontWeight: 600 }}>-</span>
                            <input 
                              type="number" 
                              value={match.score2 ?? ''} 
                              onChange={(e) => updateMatchScore(match.id, match.score1, e.target.value)} 
                              style={{ ...inputStyle, width: '50px', textAlign: 'center' }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* TEAMS */}
        {tab === 'teams' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>👥 Team Pool</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {hardcodedTeams.map(team => {
                const stats = getTeamStats(team.team);
                return (
                  <div key={team.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      <span style={{ fontSize: '2.5rem' }}>{team.flag}</span>
                      <div>
                        <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '16px', color: colors.primary }}>{team.team}</p>
                        <p style={{ margin: 0, fontSize: '13px', color: colors.textSecondary }}>Rep: {team.colleague}</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '1.5rem', textAlign: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: colors.success, fontSize: '18px' }}>{stats.wins}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>WINS</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: colors.warning, fontSize: '18px' }}>{stats.draws}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>DRAWS</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: colors.danger, fontSize: '18px' }}>{stats.losses}</p>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '11px', color: colors.textSecondary, fontWeight: 600 }}>LOSSES</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PREDICTIONS - SECONDARY */}
        {tab === 'predictions' && (
          <div>
            <div style={{ background: colors.primaryLight, border: `2px solid ${colors.primary}`, borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: 0, color: colors.primary, fontWeight: 600, fontSize: '13px' }}>💡 Quick Predictions</p>
              <p style={{ margin: '0.5rem 0 0', color: colors.textSecondary, fontSize: '13px' }}>Make your match predictions below. Predictions lock when a match starts!</p>
            </div>

            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>🎯 Make Your Predictions</h2>
            {matches.length === 0 ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem', background: colors.warningLight, border: `2px dashed ${colors.warning}` }}>
                <p style={{ margin: 0, color: colors.text, fontWeight: 600, fontSize: '16px' }}>No matches available</p>
                <p style={{ margin: '0.5rem 0 0', color: colors.textSecondary, fontSize: '14px' }}>Check back soon for upcoming matches!</p>
              </div>
            ) : (
              <>
                {upcomingMatches.filter(m => !predictions[m.id]).length > 0 && (
                  <>
                    <h3 style={{ margin: '0 0 1rem', color: colors.primary, fontWeight: 600, fontSize: '1.1rem' }}>⏳ Available for Prediction</h3>
                    <div style={{ display: 'grid', gap: '12px', marginBottom: '2rem' }}>
                      {upcomingMatches.filter(m => !predictions[m.id]).map(match => (
                        <div key={match.id} style={{ ...cardStyle }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                              <p style={{ margin: '0 0 0.5rem', fontWeight: 700, fontSize: '16px' }}>{match.team1} vs {match.team2}</p>
                              <p style={{ margin: 0, fontSize: '12px', color: colors.textSecondary }}>
                                📅 {new Date(match.date).toLocaleDateString()} at {new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setShowPredictionForm(showPredictionForm === match.id ? null : match.id)} 
                            style={{ ...buttonStyle('primary'), width: '100%' }}
                          >
                            {showPredictionForm === match.id ? '❌ Close' : '🎯 Make Prediction'}
                          </button>

                          {showPredictionForm === match.id && (
                            <div style={{ background: colors.primaryLight, padding: '1rem', borderRadius: '6px', marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                              <button 
                                onClick={() => submitPredictionToSheets(match.id, 'team1')} 
                                style={{
                                  ...buttonStyle(predictions[match.id] === 'team1' ? 'success' : 'primary'),
                                  padding: '0.75rem',
                                  fontSize: '13px',
                                  opacity: predictions[match.id] === 'team1' ? 1 : 0.7
                                }}
                              >
                                {match.team1}
                              </button>
                              <button 
                                onClick={() => submitPredictionToSheets(match.id, 'draw')} 
                                style={{
                                  ...buttonStyle(predictions[match.id] === 'draw' ? 'warning' : 'primary'),
                                  padding: '0.75rem',
                                  fontSize: '13px',
                                  opacity: predictions[match.id] === 'draw' ? 1 : 0.7
                                }}
                              >
                                Draw
                              </button>
                              <button 
                                onClick={() => submitPredictionToSheets(match.id, 'team2')} 
                                style={{
                                  ...buttonStyle(predictions[match.id] === 'team2' ? 'success' : 'primary'),
                                  padding: '0.75rem',
                                  fontSize: '13px',
                                  opacity: predictions[match.id] === 'team2' ? 1 : 0.7
                                }}
                              >
                                {match.team2}
                              </button>
                            </div>
                          )}
                          {predictions[match.id] && <p style={{ margin: '0.75rem 0 0', fontSize: '13px', color: colors.success, fontWeight: 600 }}>✅ Prediction locked!</p>}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {matches.filter(m => new Date(m.date) <= new Date() && predictions[m.id]).length > 0 && (
                  <>
                    <h3 style={{ margin: '0 0 1rem', color: colors.danger, fontWeight: 600, fontSize: '1.1rem' }}>🔴 Match Started - Locked</h3>
                    <div style={{ display: 'grid', gap: '12px' }}>
                      {matches.filter(m => new Date(m.date) <= new Date() && predictions[m.id]).map(match => (
                        <div key={match.id} style={{ ...cardStyle, borderLeft: `4px solid ${colors.danger}` }}>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '12px', color: colors.danger, fontWeight: 600 }}>🔴 PREDICTION LOCKED</p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontWeight: 600 }}>{match.team1}</span>
                            <span style={{ color: colors.danger, fontWeight: 600 }}>vs</span>
                            <span style={{ fontWeight: 600 }}>{match.team2}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* SETUP */}
        {tab === 'setup' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.8rem', fontWeight: 700 }}>⚙️ Setup</h2>

            <div style={{ ...cardStyle, background: colors.primaryLight, border: `2px solid ${colors.primary}`, marginBottom: '2rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, color: colors.primary, fontSize: '14px' }}>👤 Your Prediction Username</p>
              <input 
                type="text" 
                value={playerName} 
                onChange={(e) => setPlayerName(e.target.value)} 
                placeholder="Enter your name"
                style={{ ...inputStyle }}
              />
              <p style={{ margin: '0.75rem 0 0', fontSize: '12px', color: colors.textSecondary }}>This name will appear when you make predictions.</p>
            </div>

            <div style={{ ...cardStyle, background: colors.successLight, border: `2px solid ${colors.success}`, marginBottom: '2rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, color: colors.success, fontSize: '14px' }}>✅ Teams & Colleagues (Fixed)</p>
              <div style={{ display: 'grid', gap: '8px' }}>
                {hardcodedTeams.map((team, idx) => (
                  <div key={idx} style={{ background: 'white', padding: '0.75rem', borderRadius: '6px', border: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>{team.flag}</span>
                      <span style={{ fontWeight: 600 }}>{team.team}</span>
                    </div>
                    <span style={{ fontSize: '13px', color: colors.textSecondary }}>{team.colleague}</span>
                  </div>
                ))}
              </div>
              <p style={{ margin: '1rem 0 0', fontSize: '12px', color: colors.success }}>📌 Teams are managed by administrators.</p>
            </div>

            <div style={{ ...cardStyle, background: colors.warningLight, border: `2px solid ${colors.warning}` }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, color: colors.text, fontSize: '14px' }}>📊 System Status & Data Sources</p>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <p style={{ margin: 0, fontSize: '13px', color: colors.text }}>✅ Leaderboard: Live & Updated</p>
                <p style={{ margin: 0, fontSize: '13px', color: colors.text }}>✅ Match Updates: <strong>FIFA World Cup API</strong> (Real-time)</p>
                <p style={{ margin: 0, fontSize: '13px', color: colors.text }}>✅ Predictions: Active</p>
                <p style={{ margin: 0, fontSize: '13px', color: colors.text }}>✅ Auto-lock: When match starts</p>
                <p style={{ margin: '0.75rem 0 0', fontSize: '12px', color: colors.textSecondary, fontStyle: 'italic' }}>🔄 Match data auto-refreshes every 60 seconds</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
