import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room } from '../types/multiplayer';

import WaitingRoom from './WaitingRoom';
import TeamInput from './TeamInput';
import TeamReveal from './TeamReveal';
import Answering from './Answering';
import RoundEnd from './RoundEnd';
import MultiplayerGameOver from './MultiplayerGameOver';

interface MultiplayerGameProps {
  roomId: string;
  playerId: string;
  onBackToLobby: () => void;
}

const MultiplayerGame = ({ roomId, playerId, onBackToLobby }: MultiplayerGameProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomRef = ref(realtimeDb, `rooms/${roomId}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.val() as Room;
        setRoom(roomData);
        setLoading(false);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  if (loading) {
    return (
      <div className="multiplayer-game loading">
        <p>게임 로딩 중...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="multiplayer-game error">
        <p>방을 찾을 수 없습니다.</p>
        <button onClick={onBackToLobby}>로비로 돌아가기</button>
      </div>
    );
  }

  // Phase에 따라 적절한 컴포넌트 렌더링
  const renderPhase = () => {
    switch (room.phase) {
      case 'waiting':
        return <WaitingRoom roomId={roomId} playerId={playerId} />;

      case 'teamInput':
        return <TeamInput roomId={roomId} playerId={playerId} />;

      case 'teamReveal':
        return <TeamReveal roomId={roomId} playerId={playerId} />;

      case 'answering':
        return <Answering roomId={roomId} playerId={playerId} />;

      case 'roundEnd':
        return <RoundEnd roomId={roomId} playerId={playerId} />;

      case 'gameOver':
        return (
          <MultiplayerGameOver
            roomId={roomId}
            playerId={playerId}
            onBackToLobby={onBackToLobby}
          />
        );

      default:
        return (
          <div className="unknown-phase">
            <p>알 수 없는 게임 단계입니다.</p>
          </div>
        );
    }
  };

  return (
    <div className="multiplayer-game">
      {renderPhase()}
    </div>
  );
};

export default MultiplayerGame;
