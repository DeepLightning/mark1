import { useEffect, useState } from 'react';
import { Score } from '../types/quiz';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const Leaderboard = () => {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const scoresRef = collection(db, 'scores');
      const q = query(scoresRef, orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);

      const leaderboardData: Score[] = [];
      querySnapshot.forEach((doc) => {
        leaderboardData.push({ id: doc.id, ...doc.data() } as Score);
      });

      setScores(leaderboardData);
    } catch (err) {
      console.error('리더보드 조회 에러:', err);
      setError('리더보드를 불러올 수 없습니다. Firebase 설정을 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="leaderboard">
        <h2>🏆 리더보드</h2>
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h2>🏆 리더보드</h2>
        <div className="error">{error}</div>
        <p className="hint-text">
          Firebase 설정이 필요합니다. .env 파일을 확인하고 Firebase 프로젝트를 설정해주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h2>🏆 리더보드</h2>
      {scores.length === 0 ? (
        <p className="empty-message">아직 기록이 없습니다. 첫 번째 플레이어가 되어보세요!</p>
      ) : (
        <div className="leaderboard-list">
          {scores.map((score, index) => (
            <div key={score.id} className="leaderboard-item">
              <div className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `${index + 1}위`}
              </div>
              <div className="player-info">
                <div className="player-name">{score.playerName}</div>
                <div className="player-stats">
                  {score.correctAnswers}/{score.totalQuestions} 정답 · {formatDate(score.timestamp)}
                </div>
              </div>
              <div className="player-score">{score.score}점</div>
            </div>
          ))}
        </div>
      )}
      <button onClick={fetchLeaderboard} className="refresh-button">
        🔄 새로고침
      </button>
    </div>
  );
};

export default Leaderboard;
