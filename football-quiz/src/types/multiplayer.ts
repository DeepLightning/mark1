// 플레이어 정보
export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
}

// 게임 단계
export type GamePhase =
  | 'waiting'      // 대기실
  | 'teamInput'    // 팀 입력
  | 'teamReveal'   // 팀 공개
  | 'answering'    // 답변 단계
  | 'verification' // 검증 중
  | 'roundEnd'     // 라운드 종료
  | 'gameOver';    // 게임 종료

// 팀 입력 정보
export interface TeamInput {
  playerId: string;
  teamName: string;
  timestamp: number;
}

// 답변 정보
export interface Answer {
  playerId: string;
  playerName: string;
  answer: string;
  timestamp: number;
  isCorrect?: boolean;
  wikiUrl?: string;
}

// 라운드 정보
export interface Round {
  roundNumber: number;
  teams: string[];            // 취합된 팀 이름들
  teamInputs: TeamInput[];    // 각 플레이어의 팀 입력
  answers: Answer[];          // 제출된 답변들
  correctAnswer?: Answer;     // 정답
  winnerId?: string;          // 라운드 승자
}

// 방 (게임 세션)
export interface Room {
  id: string;
  code: string;               // 6자리 방 코드
  hostId: string;             // 방장 ID
  players: Record<string, Player>; // 플레이어 목록
  phase: GamePhase;           // 현재 게임 단계
  currentRound: number;       // 현재 라운드 번호
  maxRounds: number;          // 총 라운드 수
  rounds: Round[];            // 라운드 기록
  createdAt: number;
  updatedAt: number;
  settings: {
    teamInputTime: number;    // 팀 입력 제한 시간 (초)
    answerTime: number;       // 답변 제한 시간 (초)
  };
}

// Wikidata 선수 정보
export interface PlayerCareer {
  name: string;
  nameKo: string;             // 한글 이름
  teams: string[];            // 소속했던 팀들
  wikiUrl: string;            // 위키백과 링크
}
