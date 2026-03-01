import type { Quiz } from '../types/quiz';

export const quizzes: Quiz[] = [
  {
    id: '1',
    teams: ['Arsenal', 'Barcelona', 'New York Red Bulls'],
    answer: 'Thierry Henry',
    difficulty: 'easy',
    hints: ['프랑스 출신', '스트라이커', '아스날 레전드']
  },
  {
    id: '2',
    teams: ['Sporting CP', 'Manchester United', 'Real Madrid', 'Juventus'],
    answer: 'Cristiano Ronaldo',
    difficulty: 'easy',
    hints: ['포르투갈 출신', '발롱도르 5회', '등번호 7번']
  },
  {
    id: '3',
    teams: ['Ajax', 'Juventus', 'Inter Milan', 'Barcelona', 'AC Milan', 'PSG'],
    answer: 'Zlatan Ibrahimovic',
    difficulty: 'medium',
    hints: ['스웨덴 출신', '190cm 이상의 장신', '화려한 발재간']
  },
  {
    id: '4',
    teams: ['Chelsea', 'Real Madrid', 'Chelsea'],
    answer: 'Eden Hazard',
    difficulty: 'easy',
    hints: ['벨기에 출신', '윙어', '등번호 10번']
  },
  {
    id: '5',
    teams: ['Santos', 'Barcelona', 'PSG'],
    answer: 'Neymar',
    difficulty: 'easy',
    hints: ['브라질 출신', '세계 최고액 이적료', '등번호 10번']
  },
  {
    id: '6',
    teams: ['Boca Juniors', 'Barcelona', 'Napoli'],
    answer: 'Diego Maradona',
    difficulty: 'medium',
    hints: ['아르헨티나 출신', '1986 월드컵 우승', '신의 손 골']
  },
  {
    id: '7',
    teams: ['Tottenham', 'Ajax', 'Real Madrid'],
    answer: 'Rafael van der Vaart',
    difficulty: 'hard',
    hints: ['네덜란드 출신', '공격형 미드필더', '2000년대 활약']
  },
  {
    id: '8',
    teams: ['Liverpool', 'Real Madrid', 'Bayern Munich'],
    answer: 'Xabi Alonso',
    difficulty: 'medium',
    hints: ['스페인 출신', '수비형 미드필더', '월드컵 우승']
  },
  {
    id: '9',
    teams: ['Manchester United', 'Real Madrid', 'AC Milan'],
    answer: 'David Beckham',
    difficulty: 'easy',
    hints: ['잉글랜드 출신', '오른발 프리킥', '등번호 7번']
  },
  {
    id: '10',
    teams: ['Palmeiras', 'Corinthians', 'Barcelona', 'AC Milan'],
    answer: 'Rivaldo',
    difficulty: 'hard',
    hints: ['브라질 출신', '발롱도르 1회', '왼발잡이']
  }
];

// 난이도별로 퀴즈를 가져오는 헬퍼 함수
export const getQuizzesByDifficulty = (difficulty: Quiz['difficulty']): Quiz[] => {
  return quizzes.filter(quiz => quiz.difficulty === difficulty);
};

// 랜덤하게 퀴즈를 섞는 헬퍼 함수
export const shuffleQuizzes = (quizArray: Quiz[]): Quiz[] => {
  const shuffled = [...quizArray];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
