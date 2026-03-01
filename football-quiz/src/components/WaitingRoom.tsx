import { useEffect, useState } from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room } from '../types/multiplayer';

interface WaitingRoomProps {
  roomId: string;
  playerId: string;
}

const WaitingRoom = ({ roomId, playerId }: WaitingRoomProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [startCountdown, setStartCountdown] = useState<number | null>(null);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as Room;
        setRoom(roomData);
        setLoading(false);

        // 게임 시작 타이머가 있으면 카운트다운 표시
        if (roomData.gameStartTimer) {
          const remaining = Math.max(0, 10 - Math.floor((Date.now() - roomData.gameStartTimer) / 1000));
          setStartCountdown(remaining);
        } else {
          setStartCountdown(null);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 카운트다운 타이머
  useEffect(() => {
    if (startCountdown === null || startCountdown <= 0) return;

    const timer = setTimeout(() => {
      setStartCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [startCountdown]);

  // 10초 후 자동 게임 시작
  useEffect(() => {
    if (!room || !room.gameStartTimer || room.hostId !== playerId) return;

    const elapsed = Date.now() - room.gameStartTimer;
    const remaining = 10000 - elapsed;

    if (remaining <= 0) {
      startGame();
      return;
    }

    const timer = setTimeout(() => {
      startGame();
    }, remaining);

    return () => clearTimeout(timer);
  }, [room?.gameStartTimer, playerId, roomId]);

  const isHost = room?.hostId === playerId;
  const participants = room ? Object.values(room.participants) : [];
  const players = participants.filter(p => p.role === 'player');
  const spectators = participants.filter(p => p.role === 'spectator');
  const allPlayersReady = players.length >= 2 && players.every(p => p.isReady || p.isHost);

  // 플레이어/관객 자리 변경
  const changeRole = async (newRole: 'player' | 'spectator') => {
    if (!room) return;

    // 자리가 가득 찼는지 확인
    if (newRole === 'player') {
      const currentPlayers = participants.filter(p => p.role === 'player').length;
      if (currentPlayers >= room.settings.maxPlayers) {
        alert('플레이어 자리가 가득 찼습니다');
        return;
      }
    } else {
      const currentSpectators = participants.filter(p => p.role === 'spectator').length;
      if (currentSpectators >= room.settings.maxSpectators) {
        alert('관객 자리가 가득 찼습니다');
        return;
      }
    }

    await update(ref(realtimeDb, `rooms/${roomId}/participants/${playerId}`), {
      role: newRole,
      isReady: false,  // 역할 변경 시 준비 상태 해제
    });
  };

  // 준비 완료 토글
  const toggleReady = async () => {
    if (!room || isHost) return;

    const currentPlayer = room.participants[playerId];
    await update(ref(realtimeDb, `rooms/${roomId}/participants/${playerId}`), {
      isReady: !currentPlayer.isReady,
    });
  };

  // 게임 시작 (방장만)
  const initiateGameStart = async () => {
    if (!allPlayersReady || !isHost || startCountdown !== null) return;

    try {
      // 10초 타이머 시작
      await update(ref(realtimeDb, `rooms/${roomId}`), {
        gameStartTimer: Date.now(),
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('게임 시작 타이머 에러:', err);
    }
  };

  // 실제 게임 시작
  const startGame = async () => {
    if (!room) return;

    try {
      await update(ref(realtimeDb, `rooms/${roomId}`), {
        phase: 'teamInput',
        currentRound: 1,
        gameStartTimer: null,
        updatedAt: Date.now(),
      });

      // 첫 번째 라운드 초기화
      await set(ref(realtimeDb, `rooms/${roomId}/rounds/0`), {
        roundNumber: 1,
        teams: [],
        teamInputs: [],
        answers: [],
      });
    } catch (err) {
      console.error('게임 시작 에러:', err);
    }
  };

  // 방 코드 복사
  const copyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.code);
      alert('방 코드가 복사되었습니다!');
    }
  };

  if (loading) {
    return <div className="waiting-room loading">로딩 중...</div>;
  }

  if (!room) {
    return <div className="waiting-room error">방을 찾을 수 없습니다.</div>;
  }

  const currentPlayer = room.participants[playerId];
  const isPlayer = currentPlayer?.role === 'player';

  return (
    <div className="waiting-room">
      <div className="room-header">
        <h2>대기실</h2>
        <div className="room-code-display" onClick={copyRoomCode}>
          <span className="label">방 코드</span>
          <span className="code">{room.code}</span>
          <span className="copy-hint">📋 복사하기</span>
        </div>
      </div>

      {startCountdown !== null && (
        <div className="start-countdown">
          <h3>🎮 게임 시작까지 {startCountdown}초</h3>
        </div>
      )}

      {/* 플레이어 자리 */}
      <div className="players-section">
        <h3>플레이어 ({players.length}/{room.settings.maxPlayers})</h3>
        <div className="seats-grid">
          {players.map((player) => (
            <div key={player.id} className={`seat-card ${player.id === playerId ? 'me' : ''}`}>
              <span className="player-name">
                {player.name}
                {player.isHost && <span className="host-badge">👑</span>}
              </span>
              <span className={`ready-status ${player.isReady || player.isHost ? 'ready' : 'not-ready'}`}>
                {player.isHost ? '방장' : player.isReady ? '✅ 준비' : '⏳ 대기'}
              </span>
            </div>
          ))}
          {/* 빈 자리 */}
          {Array.from({ length: room.settings.maxPlayers - players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="seat-card empty">
              <span className="empty-text">빈 자리</span>
            </div>
          ))}
        </div>
      </div>

      {/* 관객 자리 */}
      <div className="spectators-section">
        <h3>관객 ({spectators.length}/{room.settings.maxSpectators})</h3>
        <div className="spectators-list">
          {spectators.map((spectator) => (
            <div key={spectator.id} className={`spectator-item ${spectator.id === playerId ? 'me' : ''}`}>
              <span className="spectator-name">👀 {spectator.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 역할 변경 버튼 */}
      <div className="role-controls">
        {isPlayer ? (
          <button onClick={() => changeRole('spectator')} className="role-button">
            관객으로 이동
          </button>
        ) : (
          <button onClick={() => changeRole('player')} className="role-button">
            플레이어로 이동
          </button>
        )}
      </div>

      {/* 게임 규칙 */}
      <div className="game-info">
        <h3>게임 규칙</h3>
        <ul>
          <li>플레이어는 최대 {room.settings.maxPlayers}명, 관객은 최대 {room.settings.maxSpectators}명</li>
          <li>각 라운드마다 {room.settings.teamInputTime}초 안에 팀 이름을 입력합니다</li>
          <li>모든 팀 이름이 공개되면, 그 팀들을 거쳐간 선수를 맞춥니다</li>
          <li>선착순으로 정답을 맞춘 사람이 1점을 획득합니다</li>
          <li>총 {room.maxRounds}라운드를 진행합니다</li>
        </ul>
      </div>

      {/* 준비/시작 버튼 */}
      {isPlayer && !isHost && (
        <button
          onClick={toggleReady}
          className={`ready-button ${currentPlayer.isReady ? 'ready' : ''}`}
        >
          {currentPlayer.isReady ? '준비 취소' : '준비 완료'}
        </button>
      )}

      {isHost && (
        <button
          onClick={initiateGameStart}
          disabled={!allPlayersReady || startCountdown !== null}
          className="start-game-button"
        >
          {!allPlayersReady
            ? '모든 플레이어가 준비해야 합니다'
            : startCountdown !== null
            ? `${startCountdown}초 후 시작...`
            : '게임 시작'}
        </button>
      )}

      {!isPlayer && (
        <div className="spectator-message">
          <p>관객으로 게임을 관람합니다</p>
        </div>
      )}

      {players.length < 2 && (
        <div className="invitation-section">
          <p className="invite-text">
            최소 2명의 플레이어가 필요합니다. 친구들에게 방 코드 <strong>{room.code}</strong>를 공유하세요!
          </p>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
