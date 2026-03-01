import { useEffect, useState } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room } from '../types/multiplayer';

interface RoundEndProps {
  roomId: string;
  playerId: string;
}

const RoundEnd = ({ roomId, playerId }: RoundEndProps) => {
  const [room, setRoom] = useState<Room | null>(null);
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

  const isHost = room?.hostId === playerId;

  // 다음 라운드로
  const nextRound = async () => {
    if (!room || !isHost) return;

    const nextRoundNumber = room.currentRound + 1;

    if (nextRoundNumber > room.maxRounds) {
      // 게임 종료
      await update(ref(realtimeDb, `rooms/${roomId}`), {
        phase: 'gameOver',
        updatedAt: Date.now(),
      });
    } else {
      // 다음 라운드 시작
      await update(ref(realtimeDb, `rooms/${roomId}`), {
        phase: 'teamInput',
        currentRound: nextRoundNumber,
        updatedAt: Date.now(),
      });

      // 새 라운드 초기화
      await set(ref(realtimeDb, `rooms/${roomId}/rounds/${nextRoundNumber - 1}`), {
        roundNumber: nextRoundNumber,
        teams: [],
        teamInputs: [],
        answers: [],
      });
    }
  };

  if (loading) {
    return <div className="round-end loading">로딩 중...</div>;
  }

  if (!room) {
    return <div className="round-end error">방을 찾을 수 없습니다.</div>;
  }

  const currentRoundIndex = room.currentRound - 1;
  const round = room.rounds?.[currentRoundIndex];
  const participants = Object.values(room.participants);

  // 플레이어만 점수 순으로 정렬
  const players = participants
    .filter(p => p.role === 'player')
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const winner = round?.correctAnswer;
  const hasWinner = !!winner;

  return (
    <div className="round-end">
      <div className="round-header">
        <h2>라운드 {room.currentRound} 종료!</h2>
      </div>

      {/* 라운드 결과 */}
      <div className="round-result">
        {hasWinner ? (
          <div className="winner-announcement">
            <h3>🎉 승자</h3>
            <div className="winner-card">
              <span className="winner-name">{winner.playerName}</span>
              <span className="winner-answer">정답: {winner.answer}</span>
            </div>
            {winner.wikiUrl && (
              <a
                href={winner.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wiki-link"
              >
                📖 위키백과에서 확인
              </a>
            )}
          </div>
        ) : (
          <div className="no-winner">
            <h3>😢 정답자 없음</h3>
            <p>아무도 정답을 맞추지 못했습니다</p>
          </div>
        )}
      </div>

      {/* 현재 순위 */}
      <div className="leaderboard">
        <h3>현재 순위</h3>
        <div className="leaderboard-list">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`leaderboard-item ${player.id === playerId ? 'me' : ''} ${index === 0 ? 'first' : ''}`}
            >
              <span className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `${index + 1}위`}
              </span>
              <span className="player-name">
                {player.name}
                {player.id === playerId && <span className="you-badge">(나)</span>}
              </span>
              <span className="score">{player.score || 0}점</span>
            </div>
          ))}
        </div>
      </div>

      {/* 라운드 정보 */}
      <div className="round-info">
        <p>
          {room.currentRound < room.maxRounds
            ? `다음 라운드: ${room.currentRound + 1}/${room.maxRounds}`
            : '마지막 라운드 완료!'}
        </p>
      </div>

      {/* 다음 라운드 버튼 (방장만) */}
      {isHost && (
        <button onClick={nextRound} className="next-round-button">
          {room.currentRound < room.maxRounds ? '다음 라운드 시작' : '최종 결과 보기'}
        </button>
      )}

      {!isHost && (
        <div className="waiting-message">
          <p>방장이 다음 라운드를 시작할 때까지 기다려주세요...</p>
        </div>
      )}
    </div>
  );
};

export default RoundEnd;
