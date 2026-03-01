import { useEffect, useState } from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room, Player } from '../types/multiplayer';

interface WaitingRoomProps {
  roomId: string;
  playerId: string;
}

const WaitingRoom = ({ roomId, playerId }: WaitingRoomProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${roomId}`);

    // 실시간으로 방 상태 구독
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as Room;
        setRoom(roomData);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  const isHost = room?.hostId === playerId;
  const players = room ? Object.values(room.players) : [];
  const canStart = players.length >= 2; // 최소 2명

  // 게임 시작
  const startGame = async () => {
    if (!canStart || !isHost) return;

    try {
      await update(ref(realtimeDb, `rooms/${roomId}`), {
        phase: 'teamInput',
        currentRound: 1,
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

      <div className="players-section">
        <h3>참가자 ({players.length}/3)</h3>
        <div className="players-list">
          {players.map((player) => (
            <div key={player.id} className="player-item">
              <span className="player-name">
                {player.name}
                {player.isHost && <span className="host-badge">👑 방장</span>}
                {player.id === playerId && <span className="you-badge">(나)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="game-info">
        <h3>게임 규칙</h3>
        <ul>
          <li>각 라운드마다 팀 이름을 1개씩 입력합니다</li>
          <li>모든 팀 이름이 공개되면, 그 팀들을 거쳐간 선수를 맞춥니다</li>
          <li>먼저 정답을 맞춘 사람이 1점을 획득합니다</li>
          <li>총 {room.maxRounds}라운드를 진행합니다</li>
        </ul>
      </div>

      {isHost ? (
        <button
          onClick={startGame}
          disabled={!canStart}
          className="start-game-button"
        >
          {canStart ? '게임 시작' : '최소 2명 필요'}
        </button>
      ) : (
        <div className="waiting-message">
          방장이 게임을 시작할 때까지 기다려주세요...
        </div>
      )}

      {players.length < 2 && (
        <div className="invitation-section">
          <p className="invite-text">
            친구들에게 방 코드 <strong>{room.code}</strong>를 공유하세요!
          </p>
        </div>
      )}
    </div>
  );
};

export default WaitingRoom;
