import { useState, useEffect } from 'react';
import { Quiz, GameState } from '../types/quiz';
import { quizzes, shuffleQuizzes } from '../data/quizzes';

interface QuizGameProps {
  onGameOver: (score: number, correctAnswers: number, total: number) => void;
}

const QuizGame = ({ onGameOver }: QuizGameProps) => {
  const [gameQuizzes, setGameQuizzes] = useState<Quiz[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    currentQuizIndex: 0,
    score: 0,
    correctAnswers: 0,
    isGameOver: false
  });
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    message: string;
  }>({
    show: false,
    isCorrect: false,
    message: ''
  });
  const [showHint, setShowHint] = useState(false);

  // 게임 시작 시 퀴즈를 섞음
  useEffect(() => {
    const shuffled = shuffleQuizzes(quizzes);
    setGameQuizzes(shuffled);
  }, []);

  const currentQuiz = gameQuizzes[gameState.currentQuizIndex];

  const normalizeString = (str: string): string => {
    return str.toLowerCase().trim().replace(/\s+/g, '');
  };

  const checkAnswer = () => {
    if (!userAnswer.trim()) return;

    const isCorrect = normalizeString(userAnswer) === normalizeString(currentQuiz.answer);

    setFeedback({
      show: true,
      isCorrect,
      message: isCorrect
        ? `정답입니다! 🎉`
        : `틀렸습니다. 정답은 "${currentQuiz.answer}" 입니다.`
    });

    if (isCorrect) {
      setGameState(prev => ({
        ...prev,
        score: prev.score + 10,
        correctAnswers: prev.correctAnswers + 1
      }));
    }

    // 2초 후 다음 문제로 이동
    setTimeout(() => {
      moveToNextQuestion();
    }, 2000);
  };

  const moveToNextQuestion = () => {
    const nextIndex = gameState.currentQuizIndex + 1;

    if (nextIndex >= gameQuizzes.length) {
      // 게임 종료
      setGameState(prev => ({ ...prev, isGameOver: true }));
      onGameOver(gameState.score, gameState.correctAnswers, gameQuizzes.length);
    } else {
      // 다음 문제로
      setGameState(prev => ({
        ...prev,
        currentQuizIndex: nextIndex
      }));
      setUserAnswer('');
      setFeedback({ show: false, isCorrect: false, message: '' });
      setShowHint(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !feedback.show) {
      checkAnswer();
    }
  };

  if (gameQuizzes.length === 0) {
    return <div className="loading">로딩 중...</div>;
  }

  if (gameState.isGameOver) {
    return null; // 게임 오버는 부모 컴포넌트에서 처리
  }

  return (
    <div className="quiz-game">
      <div className="quiz-header">
        <div className="progress">
          문제 {gameState.currentQuizIndex + 1} / {gameQuizzes.length}
        </div>
        <div className="score">점수: {gameState.score}</div>
      </div>

      <div className="quiz-content">
        <h2 className="quiz-question">다음 팀들을 거쳐간 선수는?</h2>

        <div className="teams-list">
          {currentQuiz.teams.map((team, index) => (
            <div key={index} className="team-badge">
              {index > 0 && <span className="arrow">→</span>}
              <span className="team-name">{team}</span>
            </div>
          ))}
        </div>

        <div className="difficulty-badge">
          난이도: {currentQuiz.difficulty === 'easy' ? '쉬움' :
                   currentQuiz.difficulty === 'medium' ? '보통' : '어려움'}
        </div>

        {!feedback.show && (
          <>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="선수 이름을 입력하세요"
              className="answer-input"
              autoFocus
            />

            <div className="button-group">
              <button onClick={checkAnswer} className="submit-button">
                제출
              </button>
              <button
                onClick={() => setShowHint(!showHint)}
                className="hint-button"
              >
                {showHint ? '힌트 숨기기' : '힌트 보기'}
              </button>
            </div>

            {showHint && currentQuiz.hints && (
              <div className="hints">
                <strong>힌트:</strong>
                <ul>
                  {currentQuiz.hints.map((hint, index) => (
                    <li key={index}>{hint}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {feedback.show && (
          <div className={`feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizGame;
