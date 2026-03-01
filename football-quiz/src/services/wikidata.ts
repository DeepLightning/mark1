/**
 * Wikidata API를 사용하여 선수의 경력을 검증하는 서비스
 * 한국어 이름의 유연성을 고려하여 부분 일치도 허용
 */

interface VerificationResult {
  isCorrect: boolean;
  wikiUrl?: string;
  playerName?: string;
}

/**
 * 선수 이름을 정규화 (공백 제거, 소문자 변환)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '')
    .replace(/[-.·]/g, '');
}

/**
 * 두 이름이 유사한지 확인
 * 한국어 이름의 경우 성 없이 이름만 써도 인정
 */
function isSimilarName(input: string, fullName: string): boolean {
  const normalizedInput = normalizeName(input);
  const normalizedFull = normalizeName(fullName);

  // 완전 일치
  if (normalizedInput === normalizedFull) return true;

  // 부분 일치 (예: "호날두" vs "크리스티아누 호날두")
  if (normalizedFull.includes(normalizedInput) || normalizedInput.includes(normalizedFull)) {
    return true;
  }

  // 성을 제외한 이름 일치 (예: "메시" vs "리오넬 메시")
  const inputParts = input.split(/\s+/);
  const fullParts = fullName.split(/\s+/);

  for (const inputPart of inputParts) {
    for (const fullPart of fullParts) {
      if (normalizeName(inputPart) === normalizeName(fullPart) && inputPart.length >= 2) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 팀 이름을 정규화
 */
function normalizeTeamName(teamName: string): string {
  const name = teamName.toLowerCase().trim();

  // 일반적인 팀 이름 변형 처리
  const replacements: Record<string, string> = {
    'manchester united': 'manchester',
    'manchester city': 'manchester',
    'real madrid': 'real',
    'atletico madrid': 'atletico',
    'barcelona': 'barça',
    'fc barcelona': 'barça',
    'bayern munich': 'bayern',
    'paris saint-germain': 'paris',
    'psg': 'paris',
    'juventus': 'juve',
    'inter milan': 'inter',
    'ac milan': 'milan',
    '맨체스터 유나이티드': 'manchester',
    '맨체스터 시티': 'manchester',
    '맨유': 'manchester',
    '맨시티': 'manchester',
    '레알 마드리드': 'real',
    '레알': 'real',
    '바르셀로나': 'barça',
    '바르사': 'barça',
    '바이에른 뮌헨': 'bayern',
    '바이에른': 'bayern',
    '파리 생제르맹': 'paris',
    '유벤투스': 'juve',
    '유베': 'juve',
    '인테르': 'inter',
  };

  for (const [key, value] of Object.entries(replacements)) {
    if (name.includes(key)) {
      return value;
    }
  }

  // 단어에서 키워드 추출
  const words = name.split(/\s+/);
  if (words.length > 0) {
    return words[0];
  }

  return name;
}

/**
 * 선수가 특정 팀들을 모두 거쳤는지 검증
 * 실제로는 Wikidata API를 호출해야 하지만, 여기서는 Mock 구현
 */
export async function verifyPlayerCareer(
  playerName: string,
  teams: string[]
): Promise<VerificationResult> {
  try {
    // TODO: 실제 Wikidata API 호출 구현
    // 현재는 Mock 데이터로 테스트

    // Mock 선수 데이터
    const mockPlayers: Record<string, string[]> = {
      '크리스티아누 호날두': ['sporting', 'manchester', 'real', 'juve', 'manchester'],
      '호날두': ['sporting', 'manchester', 'real', 'juve'],
      '리오넬 메시': ['barça', 'paris', 'inter'],
      '메시': ['barça', 'paris', 'inter'],
      '즐라탄 이브라히모비치': ['ajax', 'juve', 'inter', 'barça', 'milan', 'paris', 'manchester'],
      '즐라탄': ['ajax', 'juve', 'inter', 'barça', 'milan', 'paris'],
      '티에리 앙리': ['monaco', 'juve', 'arsenal', 'barça'],
      '앙리': ['monaco', 'juve', 'arsenal', 'barça'],
      '페르난도 토레스': ['atletico', 'liverpool', 'chelsea', 'milan'],
      '토레스': ['atletico', 'liverpool', 'chelsea', 'milan'],
      '안드레아 피를로': ['inter', 'milan', 'juve'],
      '피를로': ['inter', 'milan', 'juve'],
    };

    // 입력된 선수 이름과 매칭되는 선수 찾기
    let matchedPlayer: string | null = null;
    let playerTeams: string[] = [];

    for (const [player, clubs] of Object.entries(mockPlayers)) {
      if (isSimilarName(playerName, player)) {
        matchedPlayer = player;
        playerTeams = clubs;
        break;
      }
    }

    if (!matchedPlayer) {
      return {
        isCorrect: false,
      };
    }

    // 모든 팀을 거쳤는지 확인
    const normalizedInputTeams = teams.map(normalizeTeamName);
    const normalizedPlayerTeams = playerTeams.map(normalizeTeamName);

    const allTeamsMatch = normalizedInputTeams.every(inputTeam =>
      normalizedPlayerTeams.some(playerTeam =>
        playerTeam.includes(inputTeam) || inputTeam.includes(playerTeam)
      )
    );

    if (allTeamsMatch) {
      return {
        isCorrect: true,
        wikiUrl: `https://ko.wikipedia.org/wiki/${encodeURIComponent(matchedPlayer)}`,
        playerName: matchedPlayer,
      };
    }

    return {
      isCorrect: false,
    };
  } catch (error) {
    console.error('선수 검증 에러:', error);
    return {
      isCorrect: false,
    };
  }
}

/**
 * Wikidata API를 실제로 호출하여 선수 정보를 가져오는 함수
 * (향후 구현 예정)
 */
// async function fetchPlayerDataFromWikidata(playerName: string): Promise<any> {
//   // TODO: Wikidata SPARQL API 호출
//   // const sparqlQuery = `
//   //   SELECT ?player ?playerLabel ?team ?teamLabel WHERE {
//   //     ?player wdt:P31 wd:Q5.
//   //     ?player rdfs:label "${playerName}"@ko.
//   //     ?player wdt:P54 ?team.
//   //     SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
//   //   }
//   // `;
//
//   return null;
// }
