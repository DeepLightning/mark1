import { useEffect, useState } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room } from '../types/multiplayer';

interface TeamRevealProps {
  roomId: string;
  playerId: string;
}

const TeamReveal = ({ roomId, playerId }: TeamRevealProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [countdown, setCountdown] = useState(2);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as Room;
        setRoom(roomData);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 2초 카운트다운 후 답변 단계로
  useEffect(() => {
    if (!room || room.phase !== 'teamReveal' || room.hostId !== playerId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 방장만 다음 단계로 전환
          moveToAnsweringPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);

    async function moveToAnsweringPhase() {
      try {
        await update(ref(realtimeDb, `rooms/${roomId}`), {
          phase: 'answering',
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error('단계 전환 에러:', err);
      }
    }
  }, [room, playerId, roomId]);

  if (loading) {
    return <div className="team-reveal loading">로딩 중...</div>;
  }

  if (!room) {
    return <div className="team-reveal error">방을 찾을 수 없습니다.</div>;
  }

  const currentRoundIndex = room.currentRound - 1;
  const round = room.rounds?.[currentRoundIndex];
  const teams = round?.teams || [];
  const participants = Object.values(room.participants);
  const teamInputs = round?.teamInputs || [];

  // 제출하지 않은 플레이어 찾기
  const players = participants.filter(p => p.role === 'player');
  const submittedPlayerIds = teamInputs.map(input => input.playerId);
  const missingPlayers = players.filter(p => !submittedPlayerIds.includes(p.id));

  return (
    <div className="team-reveal">
      <div className="reveal-header">
        <h2>라운드 {room.currentRound}</h2>
        <div className="countdown">
          {countdown}초 후 시작...
        </div>
      </div>

      <div className="reveal-content">
        <h3>제출된 팀들</h3>
        {teams.length > 0 ? (
          <div className="teams-list">
            {teams.map((team, index) => (
              <div key={index} className="team-card">
                <div className="team-number">팀 {index + 1}</div>
                <div className="team-name">{team}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-teams">
            <p>⚠️ 제출된 팀이 없습니다</p>
          </div>
        )}
      </div>

      {missingPlayers.length > 0 && (
        <div className="penalty-notice">
          <h4>⚠️ 페널티 발생</h4>
          <p>다음 플레이어들이 시간 내에 팀을 제출하지 않아 -1점을 받았습니다:</p>
          <ul>
            {missingPlayers.map(player => (
              <li key={player.id}>{player.name}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="instruction">
        <p className="main-instruction">
          이 모든 팀을 거쳐간 선수를 맞춰보세요!
        </p>
        <p className="sub-instruction">
          선착순으로 정답을 맞춘 사람이 1점을 획득합니다
        </p>
      </div>
    </div>
  );
};

export default TeamReveal;
