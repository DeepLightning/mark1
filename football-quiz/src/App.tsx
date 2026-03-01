import { useState } from 'react';
import QuizGame from './components/QuizGame';
import GameOver from './components/GameOver';
import Leaderboard from './components/Leaderboard';
import './App.css';

type Screen = 'menu' | 'game' | 'gameOver' | 'leaderboard';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('menu');
  const [gameResult, setGameResult] = useState({
    score: 0,
    correctAnswers: 0,
    totalQuestions: 0
  });

  const handleGameOver = (score: number, correctAnswers: number, total: number) => {
    setGameResult({ score, correctAnswers, totalQuestions: total });
    setCurrentScreen('gameOver');
  };

  const handlePlayAgain = () => {
    setCurrentScreen('game');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('menu');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">⚽ 축구 선수 퀴즈</h1>
        <p className="app-subtitle">팀 이력을 보고 선수를 맞춰보세요!</p>
      </header>

      <main className="app-main">
        {currentScreen === 'menu' && (
          <div className="menu">
            <div className="menu-buttons">
              <button
                onClick={() => setCurrentScreen('game')}
                className="menu-button primary"
              >
                🎮 게임 시작
              </button>
              <button
                onClick={() => setCurrentScreen('leaderboard')}
                className="menu-button"
              >
                🏆 리더보드
              </button>
            </div>
            <div className="game-info">
              <h3>게임 방법</h3>
              <ul>
                <li>여러 팀의 이름이 주어집니다</li>
                <li>해당 팀들을 거쳐간 선수의 이름을 맞춰보세요</li>
                <li>정답 하나당 10점을 획득합니다</li>
                <li>막히면 힌트를 사용할 수 있습니다</li>
              </ul>
            </div>
          </div>
        )}

        {currentScreen === 'game' && (
          <QuizGame onGameOver={handleGameOver} />
        )}

        {currentScreen === 'gameOver' && (
          <GameOver
            score={gameResult.score}
            correctAnswers={gameResult.correctAnswers}
            totalQuestions={gameResult.totalQuestions}
            onPlayAgain={handlePlayAgain}
            onViewLeaderboard={() => setCurrentScreen('leaderboard')}
          />
        )}

        {currentScreen === 'leaderboard' && (
          <div className="leaderboard-screen">
            <Leaderboard />
            <button onClick={handleBackToMenu} className="back-button">
              ← 메인으로
            </button>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Made with ❤️ for football fans</p>
      </footer>
    </div>
  );
}

export default App;
