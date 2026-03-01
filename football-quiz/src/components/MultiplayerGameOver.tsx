import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room } from '../types/multiplayer';

interface MultiplayerGameOverProps {
  roomId: string;
  playerId: string;
  onBackToLobby: () => void;
}

const MultiplayerGameOver = ({ roomId, playerId, onBackToLobby }: MultiplayerGameOverProps) => {
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

  if (loading) {
    return <div className="game-over loading">로딩 중...</div>;
  }

  if (!room) {
    return <div className="game-over error">방을 찾을 수 없습니다.</div>;
  }

  const participants = Object.values(room.participants);
  const players = participants
    .filter(p => p.role === 'player')
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const winner = players[0];
  const isWinner = winner?.id === playerId;
  const myPlayer = participants.find(p => p.id === playerId);

  return (
    <div className="game-over multiplayer">
      <h1>🎮 게임 종료!</h1>

      {/* 우승자 발표 */}
      <div className="winner-announcement">
        <h2>🏆 우승자</h2>
        <div className="winner-card large">
          <span className="winner-name">{winner.name}</span>
          <span className="winner-score">{winner.score || 0}점</span>
        </div>
        {isWinner && (
          <div className="congratulations">
            <p>🎉 축하합니다! 당신이 우승했습니다!</p>
          </div>
        )}
      </div>

      {/* 최종 순위 */}
      <div className="final-leaderboard">
        <h3>최종 순위</h3>
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

      {/* 게임 통계 */}
      <div className="game-stats">
        <h3>게임 통계</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">총 라운드</span>
            <span className="stat-value">{room.maxRounds}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">참가 플레이어</span>
            <span className="stat-value">{players.length}명</span>
          </div>
          {myPlayer && (
            <>
              <div className="stat-item">
                <span className="stat-label">내 점수</span>
                <span className="stat-value">{myPlayer.score || 0}점</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">내 순위</span>
                <span className="stat-value">
                  {players.findIndex(p => p.id === playerId) + 1}위
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 라운드별 결과 */}
      <div className="rounds-summary">
        <h3>라운드별 결과</h3>
        <div className="rounds-list">
          {room.rounds.map((round, index) => (
            <div key={index} className="round-summary-item">
              <span className="round-number">라운드 {round.roundNumber}</span>
              <span className="round-winner">
                {round.correctAnswer
                  ? `${round.correctAnswer.playerName} - ${round.correctAnswer.answer}`
                  : '정답자 없음'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 버튼 */}
      <div className="button-group">
        <button onClick={onBackToLobby} className="back-to-lobby-button">
          로비로 돌아가기
        </button>
      </div>

      <div className="thank-you">
        <p>게임에 참여해주셔서 감사합니다! ⚽</p>
      </div>
    </div>
  );
};

export default MultiplayerGameOver;
