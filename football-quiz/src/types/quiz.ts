// 퀴즈 문제 타입
export interface Quiz {
  id: string;
  teams: string[];  // 팀 목록 (예: ["Arsenal", "Barcelona", "Juventus"])
  answer: string;   // 정답 선수 이름
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[]; // 선택적 힌트 (예: 포지션, 국적 등)
}

// 사용자 점수 타입
export interface Score {
  id?: string;
  playerName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timestamp: number;
}

// 게임 상태 타입
export interface GameState {
  currentQuizIndex: number;
  score: number;
  correctAnswers: number;
  isGameOver: boolean;
}
