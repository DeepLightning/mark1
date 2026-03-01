import { useEffect, useState } from 'react';
import { ref, onValue, update, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room, TeamInput as TeamInputType } from '../types/multiplayer';

interface TeamInputProps {
  roomId: string;
  playerId: string;
}

const TeamInput = ({ roomId, playerId }: TeamInputProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [teamName, setTeamName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as Room;
        setRoom(roomData);
        setLoading(false);

        // 현재 라운드의 팀 입력 확인
        const currentRoundIndex = roomData.currentRound - 1;
        const round = roomData.rounds?.[currentRoundIndex];
        if (round?.teamInputs) {
          const myInput = round.teamInputs.find(
            (input: TeamInputType) => input.playerId === playerId
          );
          if (myInput) {
            setSubmitted(true);
            setTeamName(myInput.teamName);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [roomId, playerId]);

  // 3초 타이머
  useEffect(() => {
    if (!room || room.phase !== 'teamInput') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 시간 종료 시 자동 제출 (방장만)
          if (room.hostId === playerId) {
            handleTimeExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [room, playerId]);

  // 시간 만료 처리
  const handleTimeExpire = async () => {
    if (!room) return;

    try {
      const currentRoundIndex = room.currentRound - 1;
      const round = room.rounds?.[currentRoundIndex];
      const players = Object.values(room.participants).filter(p => p.role === 'player');

      // 제출하지 않은 플레이어들에게 페널티
      const submittedPlayerIds = (round?.teamInputs || []).map((input: TeamInputType) => input.playerId);
      const missingPlayers = players.filter(p => !submittedPlayerIds.includes(p.id));

      for (const player of missingPlayers) {
        // 공백 팀 입력 추가
        const emptyInput: TeamInputType = {
          playerId: player.id,
          teamName: '',
          timestamp: Date.now(),
        };

        await set(
          ref(realtimeDb, `rooms/${roomId}/rounds/${currentRoundIndex}/teamInputs/${submittedPlayerIds.length + missingPlayers.indexOf(player)}`),
          emptyInput
        );

        // -1점 페널티
        await update(ref(realtimeDb, `rooms/${roomId}/participants/${player.id}`), {
          score: (player.score || 0) - 1,
        });
      }

      // 팀 공개 단계로 전환
      moveToRevealPhase();
    } catch (err) {
      console.error('시간 만료 처리 에러:', err);
    }
  };

  // 팀 입력 제출
  const submitTeam = async () => {
    if (!room || !teamName.trim() || submitted) return;

    try {
      const currentRoundIndex = room.currentRound - 1;
      const teamInput: TeamInputType = {
        playerId,
        teamName: teamName.trim(),
        timestamp: Date.now(),
      };

      const round = room.rounds?.[currentRoundIndex] || {
        roundNumber: room.currentRound,
        teams: [],
        teamInputs: [],
        answers: [],
      };

      const updatedInputs = [...(round.teamInputs || []), teamInput];

      await set(
        ref(realtimeDb, `rooms/${roomId}/rounds/${currentRoundIndex}`),
        {
          ...round,
          teamInputs: updatedInputs,
        }
      );

      setSubmitted(true);
    } catch (err) {
      console.error('팀 입력 제출 에러:', err);
    }
  };

  // 팀 공개 단계로 전환
  const moveToRevealPhase = async () => {
    if (!room) return;

    try {
      const currentRoundIndex = room.currentRound - 1;
      const round = room.rounds?.[currentRoundIndex];

      // 제출된 팀 이름들을 teams 배열로 정리 (빈 문자열 제외)
      const teams = (round?.teamInputs || [])
        .map((input: TeamInputType) => input.teamName)
        .filter((name: string) => name.trim() !== '');

      await update(ref(realtimeDb, `rooms/${roomId}`), {
        phase: 'teamReveal',
        updatedAt: Date.now(),
      });

      await update(
        ref(realtimeDb, `rooms/${roomId}/rounds/${currentRoundIndex}`),
        {
          teams,
        }
      );
    } catch (err) {
      console.error('단계 전환 에러:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !submitted) {
      submitTeam();
    }
  };

  if (loading) {
    return <div className="team-input loading">로딩 중...</div>;
  }

  if (!room) {
    return <div className="team-input error">방을 찾을 수 없습니다.</div>;
  }

  const participants = Object.values(room.participants);
  const players = participants.filter(p => p.role === 'player');
  const currentRoundIndex = room.currentRound - 1;
  const round = room.rounds?.[currentRoundIndex];
  const submittedInputs = round?.teamInputs || [];

  return (
    <div className="team-input">
      <div className="round-header">
        <h2>라운드 {room.currentRound}</h2>
        <div className={`timer ${timeLeft <= 1 ? 'warning' : ''}`}>
          ⏱️ {timeLeft}초
        </div>
      </div>

      <div className="instruction">
        <p>축구 팀 이름을 하나 입력하세요!</p>
        <p className="hint">
          예: 맨체스터 유나이티드, 레알 마드리드, 바르셀로나 등
        </p>
        <p className="warning">⚠️ 시간 내에 제출하지 않으면 -1점!</p>
      </div>

      {!submitted ? (
        <div className="input-section">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="팀 이름 입력"
            className="team-name-input"
            maxLength={50}
            autoFocus
          />
          <button
            onClick={submitTeam}
            disabled={!teamName.trim()}
            className="submit-button"
          >
            제출
          </button>
        </div>
      ) : (
        <div className="submitted-section">
          <div className="submitted-team">
            ✅ 제출 완료: <strong>{teamName}</strong>
          </div>
          <p className="waiting-text">다른 참가자들을 기다리는 중...</p>
        </div>
      )}

      <div className="players-status">
        <h3>제출 상태</h3>
        <div className="status-list">
          {players.map((player) => {
            const hasSubmitted = submittedInputs.some(
              (input: TeamInputType) => input.playerId === player.id
            );
            return (
              <div key={player.id} className="player-status">
                <span className="player-name">
                  {player.name}
                  {player.id === playerId && <span className="you-badge">(나)</span>}
                </span>
                <span className={`status ${hasSubmitted ? 'done' : 'pending'}`}>
                  {hasSubmitted ? '✅ 제출 완료' : '⏳ 입력 중...'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TeamInput;
