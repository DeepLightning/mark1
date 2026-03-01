import { useEffect, useState } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { verifyPlayerCareer } from '../services/wikidata';
import type { Room, Answer } from '../types/multiplayer';

interface AnsweringProps {
  roomId: string;
  playerId: string;
}

const Answering = ({ roomId, playerId }: AnsweringProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as Room;
        setRoom(roomData);
        setLoading(false);

        // 현재 라운드의 답변 확인
        const currentRoundIndex = roomData.currentRound - 1;
        const round = roomData.rounds?.[currentRoundIndex];
        if (round?.answers) {
          const myAnswer = round.answers.find(
            (answer: Answer) => answer.playerId === playerId
          );
          if (myAnswer) {
            setSubmitted(true);
            setPlayerName(myAnswer.answer);
          }

          // 정답이 나왔는지 확인
          if (round.correctAnswer && roomData.hostId === playerId) {
            // 잠시 후 라운드 종료 단계로
            setTimeout(() => moveToRoundEnd(), 3000);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, playerId]);

  // 답변 제출
  const submitAnswer = async () => {
    if (!room || !playerName.trim() || submitted || verifying) return;

    setVerifying(true);

    try {
      const currentRoundIndex = room.currentRound - 1;
      const round = room.rounds?.[currentRoundIndex];
      const teams = round?.teams || [];

      // Wikidata로 검증
      const verificationResult = await verifyPlayerCareer(
        playerName.trim(),
        teams
      );

      const currentPlayer = room.participants[playerId];
      const answer: Answer = {
        playerId,
        playerName: currentPlayer.name,
        answer: playerName.trim(),
        timestamp: Date.now(),
        isCorrect: verificationResult.isCorrect,
        wikiUrl: verificationResult.wikiUrl,
      };

      const updatedAnswers = [...(round?.answers || []), answer];

      await set(
        ref(realtimeDb, `rooms/${roomId}/rounds/${currentRoundIndex}/answers`),
        updatedAnswers
      );

      setSubmitted(true);

      // 정답이면
      if (verificationResult.isCorrect) {
        // 첫 번째 정답인지 확인 (선착순!)
        const previousCorrectAnswer = round?.answers?.find(
          (a: Answer) => a.isCorrect
        );

        if (!previousCorrectAnswer) {
          // 🎉 첫 정답! 점수 부여 및 정답 기록
          await update(
            ref(realtimeDb, `rooms/${roomId}/rounds/${currentRoundIndex}`),
            {
              correctAnswer: answer,
              winnerId: playerId,
            }
          );

          // 점수 추가
          await update(ref(realtimeDb, `rooms/${roomId}/participants/${playerId}`), {
            score: (currentPlayer.score || 0) + 1,
          });

          // 방장이면 잠시 후 라운드 종료 단계로
          if (room.hostId === playerId) {
            setTimeout(() => moveToRoundEnd(), 3000);
          }
        }
      }
    } catch (err) {
      console.error('답변 제출 에러:', err);
      alert('답변 검증 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setVerifying(false);
    }
  };

  // 라운드 종료 단계로
  const moveToRoundEnd = async () => {
    if (!room) return;

    try {
      await update(ref(realtimeDb, `rooms/${roomId}`), {
        phase: 'roundEnd',
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.error('단계 전환 에러:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !submitted && !verifying) {
      submitAnswer();
    }
  };

  if (loading) {
    return <div className="answering loading">로딩 중...</div>;
  }

  if (!room) {
    return <div className="answering error">방을 찾을 수 없습니다.</div>;
  }

  const currentRoundIndex = room.currentRound - 1;
  const round = room.rounds?.[currentRoundIndex];
  const teams = round?.teams || [];
  const answers = round?.answers || [];
  const correctAnswer = round?.correctAnswer;
  const currentPlayer = room.participants[playerId];
  const isPlayer = currentPlayer?.role === 'player';

  return (
    <div className="answering">
      <div className="answer-header">
        <h2>라운드 {room.currentRound}</h2>
      </div>

      <div className="teams-display">
        <h3>팀 목록</h3>
        <div className="teams-row">
          {teams.map((team, index) => (
            <span key={index} className="team-badge">
              {team}
            </span>
          ))}
        </div>
      </div>

      <div className="question">
        <p>이 모든 팀을 거쳐간 선수는?</p>
        {correctAnswer && (
          <p className="first-correct-notice">
            🏆 선착순으로 정답을 맞춘 사람만 점수를 획득합니다!
          </p>
        )}
      </div>

      {isPlayer && !submitted ? (
        <div className="answer-input-section">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="선수 이름 입력 (예: 호날두, 메시)"
            className="player-name-input"
            maxLength={50}
            autoFocus
            disabled={verifying}
          />
          <button
            onClick={submitAnswer}
            disabled={!playerName.trim() || verifying}
            className="submit-answer-button"
          >
            {verifying ? '검증 중...' : '제출'}
          </button>
        </div>
      ) : isPlayer && submitted ? (
        <div className="submitted-answer-section">
          <div className={`submitted-answer ${correctAnswer?.playerId === playerId ? 'correct' : ''}`}>
            제출한 답변: <strong>{playerName}</strong>
          </div>
        </div>
      ) : (
        <div className="spectator-watching">
          <p>👀 관객 모드: 플레이어들의 답변을 지켜보세요</p>
        </div>
      )}

      {correctAnswer && (
        <div className="correct-answer-display">
          <h3>🎉 정답!</h3>
          <p>
            <strong>{correctAnswer.playerName}</strong>님이 선착순으로 정답을 맞췄습니다!
          </p>
          <div className="answer-details">
            <p className="player-answer">선수: {correctAnswer.answer}</p>
            {correctAnswer.wikiUrl && (
              <a
                href={correctAnswer.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wiki-link"
              >
                📖 위키백과에서 확인
              </a>
            )}
          </div>
        </div>
      )}

      <div className="answers-list">
        <h3>제출된 답변 ({answers.length})</h3>
        <div className="answers">
          {answers.map((answer: Answer, index) => (
            <div
              key={index}
              className={`answer-item ${answer.isCorrect ? 'correct' : 'incorrect'}`}
            >
              <span className="answer-player">{answer.playerName}</span>
              <span className="answer-text">{answer.answer}</span>
              <span className="answer-status">
                {answer.isCorrect ? '✅' : '❌'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Answering;
