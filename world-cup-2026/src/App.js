import React, { useState, useEffect } from 'react';
import './App.css';

export default function WorldCup2026Predictions() {
  const [tab, setTab] = useState('leaderboard');
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [allPredictions, setAllPredictions] = useState([]);
  const [groupFilter, setGroupFilter] = useState('all');
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showPredictionForm, setShowPredictionForm] = useState(null);
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [lastSync, setLastSync] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newTeamForm, setNewTeamForm] = useState({ team: '', colleague: '', flag: '', group: '' });
  const [shareLink, setShareLink] = useState('');
  const [dataMode, setDataMode] = useState('manual');
  
  // Replace with your actual Google Apps Script URL
  const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxjbxhbOqHVm8il5AnQ7txGBxnz8YkowQ8_2C-zaLeF3KV4oWnXT1pr0cPPoqojPE1a/exec";

  const wcTeams = [
    { name: 'Argentina', flag: '🇦🇷', group: 'A' },
    { name: 'Canada', flag: '🇨🇦', group: 'A' },
    { name: 'Japan', flag: '🇯🇵', group: 'A' },
    { name: 'Morocco', flag: '🇲🇦', group: 'A' },
    { name: 'Denmark', flag: '🇩🇰', group: 'B' },
    { name: 'Ecuador', flag: '🇪🇨', group: 'B' },
    { name: 'England', flag: '🇬🇧', group: 'B' },
    { name: 'Slovenia', flag: '🇸🇮', group: 'B' },
    { name: 'Netherlands', flag: '🇳🇱', group: 'C' },
    { name: 'Senegal', flag: '🇸🇳', group: 'C' },
    { name: 'France', flag: '🇫🇷', group: 'C' },
    { name: 'New Zealand', flag: '🇳🇿', group: 'C' },
    { name: 'Brazil', flag: '🇧🇷', group: 'D' },
    { name: 'Germany', flag: '🇩🇪', group: 'D' },
    { name: 'Spain', flag: '🇪🇸', group: 'D' },
    { name: 'Costa Rica', flag: '🇨🇷', group: 'D' },
    { name: 'Belgium', flag: '🇧🇪', group: 'E' },
    { name: 'Slovakia', flag: '🇸🇰', group: 'E' },
    { name: 'Romania', flag: '🇷🇴', group: 'E' },
    { name: 'Serbia', flag: '🇷🇸', group: 'E' },
    { name: 'Italy', flag: '🇮🇹', group: 'F' },
    { name: 'Switzerland', flag: '🇨🇭', group: 'F' },
    { name: 'Kazakhstan', flag: '🇰🇿', group: 'F' },
    { name: 'Bulgaria', flag: '🇧🇬', group: 'F' },
    { name: 'Mexico', flag: '🇲🇽', group: 'G' },
    { name: 'Portugal', flag: '🇵🇹', group: 'G' },
    { name: 'Poland', flag: '🇵🇱', group: 'G' },
    { name: 'Uruguay', flag: '🇺🇾', group: 'G' },
    { name: 'Australia', flag: '🇦🇺', group: 'H' },
    { name: 'USA', flag: '🇺🇸', group: 'H' },
    { name: 'Wales', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', group: 'H' },
    { name: 'Turkey', flag: '🇹🇷', group: 'H' },
  ];

  // Load from localStorage
  useEffect(() => {
    const savedMatches = JSON.parse(localStorage.getItem('wc2026_matches') || '[]');
    const savedTeams = JSON.parse(localStorage.getItem('wc2026_teams') || '[]');
    const savedPredictions = JSON.parse(localStorage.getItem('wc2026_predictions') || '{}');
    const savedPlayerName = localStorage.getItem('playerName') || '';

    setMatches(savedMatches);
    setTeams(savedTeams);
    setPredictions(savedPredictions);
    setPlayerName(savedPlayerName);
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
    if (teams.length > 0) {
      const encodedData = btoa(JSON.stringify({ teams, matches, predictions }));
      const link = `${window.location.href}#data=${encodedData}`;
      setShareLink(link);
    }
  }, [teams, matches]);

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

      // Add to all predictions list for leaderboard
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

  const syncLiveData = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.api-football.com/v3/fixtures?league=1&season=2026&limit=100');
      if (response.ok) {
        const data = await response.json();
        if (data.response && data.response.length > 0) {
          const newMatches = data.response.map(fixture => ({
            id: fixture.fixture.id,
            team1: fixture.teams.home.name,
            team2: fixture.teams.away.name,
            score1: fixture.goals.home,
            score2: fixture.goals.away,
            date: fixture.fixture.date,
            status: fixture.fixture.status.short === 'FT' ? 'completed' : 'upcoming',
            group: fixture.league.round ? fixture.league.round.split(' ')[0] : 'unknown'
          }));
          setMatches(newMatches);
          setDataMode('live');
          setLastSync(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.log('Live sync unavailable');
    }
    setLoading(false);
  };

  const addTeam = () => {
    if (newTeamForm.team && newTeamForm.colleague) {
      const teamData = wcTeams.find(t => t.name === newTeamForm.team);
      setTeams([...teams, {
        ...newTeamForm,
        flag: teamData?.flag || newTeamForm.flag,
        group: teamData?.group || '',
        id: Date.now()
      }]);
      setNewTeamForm({ team: '', colleague: '', flag: '', group: '' });
      setShowAddTeam(false);
    }
  };

  const updateMatchScore = (id, score1, score2) => {
    setMatches(matches.map(m =>
      m.id === id
        ? { ...m, score1: score1 !== '' ? parseInt(score1) : null, score2: score2 !== '' ? parseInt(score2) : null, status: score1 !== '' && score2 !== '' ? 'completed' : 'upcoming' }
        : m
    ));
  };

  const getTeamStats = (teamName) => {
    let wins = 0, losses = 0, draws = 0, points = 0;
    matches.forEach(match => {
      if (match.status === 'completed' && match.score1 !== null && match.score2 !== null) {
        if (match.team1 === teamName) {
          if (match.score1 > match.score2) { wins++; points += 3; }
          else if (match.score1 < match.score2) { losses++; }
          else { draws++; points += 1; }
        } else if (match.team2 === teamName) {
          if (match.score2 > match.score1) { wins++; points += 3; }
          else if (match.score2 < match.score1) { losses++; }
          else { draws++; points += 1; }
        }
      }
    });
    return { wins, losses, draws, points, totalMatches: wins + losses + draws };
  };

  // Calculate prediction accuracy
  const getPredictionStats = (playerName) => {
    const playerPreds = allPredictions.filter(p => p.playerName === playerName);

    let correct = 0;
    let total = playerPreds.length;

    playerPreds.forEach(pred => {
      const match = matches.find(m => m.id === pred.matchId);
      if (match && match.status === 'completed' && match.score1 !== null && match.score2 !== null) {
        const actualWinner = match.score1 > match.score2 ? 'team1' : match.score1 < match.score2 ? 'team2' : 'draw';
        if (actualWinner === pred.prediction) {
          correct++;
        }
      }
    });

    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    return { correct, total, accuracy };
  };

  // Build prediction leaderboard
  const predictionLeaderboard = [...new Set(allPredictions.map(p => p.playerName))]
    .map(name => ({
      playerName: name,
      ...getPredictionStats(name)
    }))
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return b.correct - a.correct;
    });

  const leaderboard = teams
    .map(team => ({ ...team, ...getTeamStats(team.team) }))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });

  const filteredMatches = groupFilter === 'all'
    ? matches
    : matches.filter(m => m.group === groupFilter);

  const sortedMatches = [...filteredMatches].sort((a, b) => new Date(a.date) - new Date(b.date));
  const upcomingMatches = sortedMatches.filter(m => m.status !== 'completed' && !hasMatchStarted(m.date));
  const liveMatches = sortedMatches.filter(m => hasMatchStarted(m.date) && m.status !== 'completed');
  const completedMatches = sortedMatches.filter(m => m.status === 'completed');
  const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  return (
    <div style={{ fontFamily: 'system-ui', color: '#333', minHeight: '100vh', background: 'linear-gradient(135deg, rgba(34,139,34,0.05) 0%, rgba(255,165,0,0.05) 100%)' }}>
      <div style={{ background: 'linear-gradient(135deg, #22a34a 0%, #228b22 50%, #1a6a1a 100%)', color: 'white', padding: '1.5rem', textAlign: 'center', borderBottom: '4px solid #ffa500' }}>
        <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.8rem', fontWeight: 500 }}>⚽ World Cup 2026</h1>
        <p style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.85rem', opacity: 0.9 }}>Live Sweepstake + Predictions</p>
        {playerName && <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8 }}>👤 {playerName}</p>}
      </div>

      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e0e0e0', background: '#f5f5f5', padding: '0 1rem', flexWrap: 'wrap', overflowX: 'auto' }}>
        {[
          { id: 'leaderboard', label: '🏆 Standings' },
          { id: 'predictions', label: '🎯 Predictions' },
          { id: 'matches', label: '⚽ Matches' },
          { id: 'teams', label: '👥 Teams' },
          { id: 'setup', label: '⚙️ Setup' }
        ].map(nav => (
          <button key={nav.id} onClick={() => setTab(nav.id)} style={{ padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, borderBottom: tab === nav.id ? '3px solid #ffa500' : 'none', color: tab === nav.id ? '#22a34a' : '#666', whiteSpace: 'nowrap' }}>
            {nav.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* TEAM LEADERBOARD */}
        {tab === 'leaderboard' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>🏆 Team Standings</h2>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                <p style={{ fontSize: '2rem' }}>👥</p>
                <p>Go to Setup to add teams</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {leaderboard.map((entry, idx) => (
                  <div key={entry.id} style={{ background: 'white', border: idx === 0 ? '2px solid #ffa500' : '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto auto', gap: '0.75rem', alignItems: 'center', fontSize: '14px' }}>
                    <div style={{ textAlign: 'center', fontWeight: 600, color: idx === 0 ? '#ffa500' : '#22a34a' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.8rem' }}>{entry.flag}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{entry.team}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{entry.colleague}</p>
                      </div>
                    </div>
                    <div style={{ background: '#22a34a', color: 'white', padding: '0.6rem 0.8rem', borderRadius: '6px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: '0.7rem' }}>Pts</p>
                      <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{entry.points}</p>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '0.4rem 0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#22a34a' }}>{entry.wins}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>W</p>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '0.4rem 0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#ffa500' }}>{entry.draws}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>D</p>
                    </div>
                    <div style={{ background: '#f5f5f5', padding: '0.4rem 0.6rem', borderRadius: '6px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontWeight: 600, color: '#d32f2f' }}>{entry.losses}</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#999' }}>L</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PREDICTION LEADERBOARD */}
        {tab === 'predictions' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>🎯 Prediction Leaderboard</h2>
            {predictionLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                <p style={{ fontSize: '2rem' }}>🎯</p>
                <p>No predictions yet</p>
              </div>
            ) : (
              <>
                <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#1565c0', fontWeight: 500 }}>
                    📊 Based on {matches.filter(m => m.status === 'completed').length} completed matches
                  </p>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {predictionLeaderboard.map((entry, idx) => (
                    <div key={entry.playerName} style={{ background: 'white', border: idx === 0 ? '2px solid #ffa500' : '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: '1rem', alignItems: 'center', fontSize: '14px' }}>
                      <div style={{ textAlign: 'center', fontWeight: 600, color: idx === 0 ? '#ffa500' : '#22a34a' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{entry.playerName}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{entry.total} predictions</p>
                      </div>
                      <div style={{ background: '#e8f5e9', padding: '0.6rem 0.8rem', borderRadius: '6px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#1b5e20' }}>Accuracy</p>
                        <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: '#22a34a' }}>{entry.accuracy}%</p>
                      </div>
                      <div style={{ background: '#fff3cd', padding: '0.6rem 0.8rem', borderRadius: '6px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#856404' }}>Correct</p>
                        <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: '#ff6f00' }}>{entry.correct}/{entry.total}</p>
                      </div>
                      <div style={{ background: '#f3e5f5', padding: '0.6rem 0.8rem', borderRadius: '6px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#4a148c' }}>Points</p>
                        <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600, color: '#7b1fa2' }}>{entry.correct * 3}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* MATCHES */}
        {tab === 'matches' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>⚽ Matches</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => setGroupFilter('all')} style={{ padding: '0.4rem 0.8rem', background: groupFilter === 'all' ? '#22a34a' : '#f5f5f5', color: groupFilter === 'all' ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                All
              </button>
              {groups.map(g => (
                <button key={g} onClick={() => setGroupFilter(g)} style={{ padding: '0.4rem 0.8rem', background: groupFilter === g ? '#22a34a' : '#f5f5f5', color: groupFilter === g ? 'white' : '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  {g}
                </button>
              ))}
            </div>

            {upcomingMatches.length > 0 && (
              <>
                <h3 style={{ marginBottom: '1rem', color: '#22a34a', fontWeight: 600 }}>⏳ Predictions Open</h3>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '2rem' }}>
                  {upcomingMatches.map(match => (
                    <div key={match.id} style={{ background: 'white', border: '2px solid #4caf50', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: '0 0 0.5rem', fontSize: '11px', color: '#999' }}>
                            {match.group && `Group ${match.group} • `}{new Date(match.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontWeight: 600 }}>{match.team1}</span>
                            <span style={{ color: '#999' }}>vs</span>
                            <span style={{ fontWeight: 600 }}>{match.team2}</span>
                          </div>
                        </div>
                        <button onClick={() => setShowPredictionForm(showPredictionForm === match.id ? null : match.id)} style={{ padding: '0.5rem 1rem', background: '#4caf50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                          {showPredictionForm === match.id ? '❌ Close' : '🎯 Predict'}
                        </button>
                      </div>

                      {showPredictionForm === match.id && (
                        <div style={{ background: '#f1f8e9', padding: '1rem', borderRadius: '6px', marginTop: '1rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            <button onClick={() => submitPredictionToSheets(match.id, 'team1')} style={{ padding: '0.6rem', background: predictions[match.id] === 'team1' ? '#4caf50' : '#fff', color: predictions[match.id] === 'team1' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                              {match.team1}
                            </button>
                            <button onClick={() => submitPredictionToSheets(match.id, 'draw')} style={{ padding: '0.6rem', background: predictions[match.id] === 'draw' ? '#ffa500' : '#fff', color: predictions[match.id] === 'draw' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                              Draw
                            </button>
                            <button onClick={() => submitPredictionToSheets(match.id, 'team2')} style={{ padding: '0.6rem', background: predictions[match.id] === 'team2' ? '#4caf50' : '#fff', color: predictions[match.id] === 'team2' ? 'white' : '#333', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                              {match.team2}
                            </button>
                          </div>
                          {predictions[match.id] && <p style={{ margin: '0.75rem 0 0', fontSize: '11px', color: '#2e7d32', fontWeight: 600 }}>✅ Locked!</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {liveMatches.length > 0 && (
              <>
                <h3 style={{ marginBottom: '1rem', color: '#ff6f00', fontWeight: 600 }}>🔴 LIVE - Locked</h3>
                <div style={{ display: 'grid', gap: '10px', marginBottom: '2rem' }}>
                  {liveMatches.map(match => (
                    <div key={match.id} style={{ background: '#fff3e0', border: '2px solid #ff9800', borderRadius: '8px', padding: '1rem' }}>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '11px', color: '#e65100', fontWeight: 600 }}>🔴 NO NEW PREDICTIONS</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontWeight: 600 }}>{match.team1}</span>
                        <span style={{ color: '#ff9800' }}>vs</span>
                        <span style={{ fontWeight: 600 }}>{match.team2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {completedMatches.length > 0 && (
              <>
                <h3 style={{ marginBottom: '1rem', color: '#228b22', fontWeight: 600 }}>✅ Results</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {completedMatches.map(match => (
                    <div key={match.id} style={{ background: '#f1f8e9', border: '1px solid #c8e6c9', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>{match.team1}</span>
                          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22a34a' }}>{match.score1} - {match.score2}</span>
                          <span style={{ fontWeight: 500 }}>{match.team2}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input type="number" value={match.score1 ?? ''} onChange={(e) => updateMatchScore(match.id, e.target.value, match.score2)} style={{ width: '40px', padding: '5px', border: '1px solid #c8e6c9', borderRadius: '5px', textAlign: 'center', fontSize: '12px' }} />
                        <span>-</span>
                        <input type="number" value={match.score2 ?? ''} onChange={(e) => updateMatchScore(match.id, match.score1, e.target.value)} style={{ width: '40px', padding: '5px', border: '1px solid #c8e6c9', borderRadius: '5px', textAlign: 'center', fontSize: '12px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* TEAMS */}
        {tab === 'teams' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>👥 Team Pool</h2>
            <div style={{ display: 'grid', gap: '10px' }}>
              {teams.map(team => {
                const stats = getTeamStats(team.team);
                return (
                  <div key={team.id} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '2rem' }}>{team.flag}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600 }}>{team.team}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{team.colleague}</p>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', gap: '6px', textAlign: 'center' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#22a34a' }}>{stats.wins}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#999' }}>W</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#ffa500' }}>{stats.draws}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#999' }}>D</p>
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#d32f2f' }}>{stats.losses}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#999' }}>L</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SETUP */}
        {tab === 'setup' && (
          <div>
            <h2 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem' }}>⚙️ Setup</h2>

            <div style={{ background: '#e3f2fd', border: '1px solid #2196f3', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#1565c0', fontSize: '13px' }}>👤 Your Prediction Username</p>
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Enter your name" style={{ width: '100%', padding: '0.6rem', border: '1px solid #2196f3', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <h3 style={{ margin: '1rem 0 1rem', fontSize: '1rem', fontWeight: 500 }}>Add Team</h3>
            {!showAddTeam ? (
              <button onClick={() => setShowAddTeam(true)} style={{ padding: '0.5rem 1rem', background: '#22a34a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', marginBottom: '1.5rem' }}>
                + Add Team
              </button>
            ) : (
              <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #e0e0e0' }}>
                <input type="text" placeholder="Team" value={newTeamForm.team} onChange={(e) => setNewTeamForm({ ...newTeamForm, team: e.target.value })} list="teams-list" style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <datalist id="teams-list">
                  {wcTeams.map(t => <option key={t.name} value={t.name} />)}
                </datalist>
                <input type="text" placeholder="Colleague" value={newTeamForm.colleague} onChange={(e) => setNewTeamForm({ ...newTeamForm, colleague: e.target.value })} style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <button onClick={addTeam} style={{ padding: '8px 16px', background: '#22a34a', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', fontWeight: 500, fontSize: '13px' }}>
                  Save
                </button>
              </div>
            )}

            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: '8px', padding: '1rem', fontSize: '12px' }}>
              <p style={{ margin: 0, fontWeight: 600, color: '#856404' }}>📊 System Status</p>
              <p style={{ margin: '0.3rem 0', color: '#856404' }}>✅ Predictions: Active</p>
              <p style={{ margin: '0.3rem 0', color: '#856404' }}>✅ Auto-lock: When match starts</p>
              <p style={{ margin: '0.3rem 0', color: '#856404' }}>✅ Leaderboard: Real-time</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}