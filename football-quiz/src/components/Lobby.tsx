import { useState } from 'react';
import { ref, set, get } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import type { Room, Player } from '../types/multiplayer';

interface LobbyProps {
  onJoinRoom: (roomId: string, playerId: string) => void;
}

const Lobby = ({ onJoinRoom }: LobbyProps) => {
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 랜덤 방 코드 생성 (6자리)
  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 문자 제외
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // 방 생성
  const createRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const code = generateRoomCode();
      const roomId = `room_${Date.now()}`;
      const playerId = `player_${Date.now()}`;

      const player: Player = {
        id: playerId,
        name: playerName.trim(),
        score: 0,
        isHost: true,
        isReady: false,
        role: 'player',  // 방장은 기본적으로 플레이어
      };

      const newRoom: Room = {
        id: roomId,
        code,
        hostId: playerId,
        participants: { [playerId]: player },
        phase: 'waiting',
        currentRound: 0,
        maxRounds: 3,
        rounds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: {
          teamInputTime: 3,  // 3초로 변경
          maxPlayers: 3,
          maxSpectators: 10,
        },
      };

      // Firebase에 방 저장
      await set(ref(realtimeDb, `rooms/${roomId}`), newRoom);

      // 방 참여
      onJoinRoom(roomId, playerId);
    } catch (err) {
      console.error('방 생성 에러:', err);
      setError('방을 생성할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 방 참여
  const joinRoom = async () => {
    if (!playerName.trim()) {
      setError('이름을 입력해주세요');
      return;
    }

    if (!roomCode.trim()) {
      setError('방 코드를 입력해주세요');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 방 코드로 방 찾기
      const roomsRef = ref(realtimeDb, 'rooms');
      const snapshot = await get(roomsRef);

      if (!snapshot.exists()) {
        setError('방을 찾을 수 없습니다');
        return;
      }

      const rooms = snapshot.val();
      let targetRoom: Room | null = null;
      let targetRoomId = '';

      // 방 코드로 검색
      for (const [roomId, room] of Object.entries(rooms)) {
        const r = room as Room;
        if (r.code === roomCode.toUpperCase()) {
          targetRoom = r;
          targetRoomId = roomId;
          break;
        }
      }

      if (!targetRoom) {
        setError('방 코드가 올바르지 않습니다');
        return;
      }

      // 이미 게임이 시작되었는지 확인
      if (targetRoom.phase !== 'waiting') {
        setError('이미 게임이 시작되었습니다');
        return;
      }

      // 방이 가득 찼는지 확인 (플레이어 + 관객)
      const participantCount = Object.keys(targetRoom.participants).length;
      const maxTotal = targetRoom.settings.maxPlayers + targetRoom.settings.maxSpectators;
      if (participantCount >= maxTotal) {
        setError('방이 가득 찼습니다');
        return;
      }

      const playerId = `player_${Date.now()}`;
      const newPlayer: Player = {
        id: playerId,
        name: playerName.trim(),
        score: 0,
        isHost: false,
        isReady: false,
        role: 'spectator',  // 기본적으로 관객으로 입장
      };

      // 참여자 추가
      await set(
        ref(realtimeDb, `rooms/${targetRoomId}/participants/${playerId}`),
        newPlayer
      );

      await set(
        ref(realtimeDb, `rooms/${targetRoomId}/updatedAt`),
        Date.now()
      );

      // 방 참여
      onJoinRoom(targetRoomId, playerId);
    } catch (err) {
      console.error('방 참여 에러:', err);
      setError('방에 참여할 수 없습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, action: () => void) => {
    if (e.key === 'Enter' && !loading) {
      action();
    }
  };

  return (
    <div className="lobby">
      <h2>⚽ 멀티플레이어 퀴즈</h2>
      <p className="subtitle">2-3명이서 함께 플레이하세요!</p>

      <div className="player-name-section">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyPress={(e) => handleKeyPress(e, createRoom)}
          placeholder="이름 입력"
          className="name-input"
          maxLength={10}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="lobby-actions">
        <div className="create-room-section">
          <h3>새 게임 만들기</h3>
          <button
            onClick={createRoom}
            disabled={loading}
            className="create-room-button"
          >
            {loading ? '생성 중...' : '방 만들기'}
          </button>
        </div>

        <div className="divider">또는</div>

        <div className="join-room-section">
          <h3>친구 방 참여</h3>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            onKeyPress={(e) => handleKeyPress(e, joinRoom)}
            placeholder="방 코드 입력 (6자리)"
            className="room-code-input"
            maxLength={6}
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="join-room-button"
          >
            {loading ? '참여 중...' : '참여하기'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
