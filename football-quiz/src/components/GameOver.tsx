import { useState } from 'react';
import { Score } from '../types/quiz';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface GameOverProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
}

const GameOver = ({
  score,
  correctAnswers,
  totalQuestions,
  onPlayAgain,
  onViewLeaderboard
}: GameOverProps) => {
  const [playerName, setPlayerName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  const saveScore = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const scoreData: Omit<Score, 'id'> = {
        playerName: playerName.trim(),
        score,
        correctAnswers,
        totalQuestions,
        timestamp: Date.now()
      };

      await addDoc(collection(db, 'scores'), scoreData);
      setSaved(true);
    } catch (err) {
      console.error('점수 저장 에러:', err);
      setError('점수를 저장할 수 없습니다. Firebase 설정을 확인해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !saved) {
      saveScore();
    }
  };

  return (
    <div className="game-over">
      <h1>🎮 게임 종료!</h1>

      <div className="final-score">
        <div className="score-item">
          <div className="score-label">최종 점수</div>
          <div className="score-value">{score}점</div>
        </div>
        <div className="score-item">
          <div className="score-label">정답률</div>
          <div className="score-value">
            {correctAnswers}/{totalQuestions} ({percentage}%)
          </div>
        </div>
      </div>

      <div className="performance-message">
        {percentage >= 90 && '🌟 완벽합니다! 축구 박사시네요!'}
        {percentage >= 70 && percentage < 90 && '👏 훌륭해요! 축구를 정말 잘 아시는군요!'}
        {percentage >= 50 && percentage < 70 && '👍 좋아요! 조금만 더 노력하면 완벽합니다!'}
        {percentage < 50 && '💪 다시 도전해보세요! 연습하면 더 잘할 수 있어요!'}
      </div>

      {!saved ? (
        <div className="save-score">
          <h3>리더보드에 등록하기</h3>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="이름을 입력하세요"
            className="name-input"
            maxLength={20}
          />
          {error && <div className="error-message">{error}</div>}
          <button
            onClick={saveScore}
            disabled={isSaving}
            className="save-button"
          >
            {isSaving ? '저장 중...' : '점수 저장'}
          </button>
        </div>
      ) : (
        <div className="saved-message">
          ✅ 점수가 저장되었습니다!
        </div>
      )}

      <div className="button-group">
        <button onClick={onPlayAgain} className="play-again-button">
          다시 하기
        </button>
        <button onClick={onViewLeaderboard} className="leaderboard-button">
          리더보드 보기
        </button>
      </div>
    </div>
  );
};

export default GameOver;
