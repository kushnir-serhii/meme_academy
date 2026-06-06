'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';
import { GameState } from './types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

// Helper to get current locale from URL path
function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  const pathSegments = window.location.pathname.split('/');
  const locale = pathSegments[1];
  if (['en', 'uk', 'pl'].includes(locale)) {
    return locale;
  }
  return 'en';
}

export function useGameSocket() {
  const connectionStatus = useGameStore((s) => s.connectionStatus);
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (isConnecting.current) return;

    const s = getSocket();
    if (s.connected) {
      useGameStore.getState().setConnectionStatus('connected');
      return;
    }

    isConnecting.current = true;
    useGameStore.getState().setConnectionStatus('connecting');
    s.connect();
  }, []);

  const disconnect = useCallback(() => {
    const s = getSocket();
    s.disconnect();
    useGameStore.getState().setConnectionStatus('disconnected');
  }, []);

  const finishGame = useCallback(() => {
    const s = getSocket();
    s.emit('finish_game');
  }, []);

  const createRoom = useCallback(
    (nickname: string, avatarId?: number | null, bgColor?: string | null) => {
      const s = getSocket();
      const locale = getCurrentLocale();
      useGameStore.getState().setLoading(true);
      useGameStore.getState().setMyAvatar(avatarId ?? null, bgColor ?? null);
      s.emit('create_room', { nickname, locale, avatarId, bgColor });
    },
    [],
  );

  const joinRoom = useCallback(
    (roomCode: string, nickname: string, avatarId?: number | null, bgColor?: string | null) => {
      const s = getSocket();
      const locale = getCurrentLocale();
      useGameStore.getState().setLoading(true);
      useGameStore.getState().setMyAvatar(avatarId ?? null, bgColor ?? null);
      s.emit('join_room', { roomCode: roomCode.toUpperCase(), nickname, locale, avatarId, bgColor });
    },
    [],
  );

  const reconnectToRoom = useCallback((playerId: string, roomCode: string) => {
    const s = getSocket();
    const locale = getCurrentLocale();
    useGameStore.getState().setLoading(true);
    s.emit('reconnect_room', { playerId, roomCode, locale });
  }, []);

  const startGame = useCallback(() => {
    const s = getSocket();
    s.emit('start_game');
  }, []);

  const selectPhrase = useCallback((phraseId: string) => {
    const s = getSocket();
    s.emit('select_phrase', { phraseId });
  }, []);

  const submitMeme = useCallback((memeId: string) => {
    const s = getSocket();
    s.emit('submit_meme', { memeId });
    useGameStore.getState().setSubmitted(true);
  }, []);

  const selectWinner = useCallback((oderId: string) => {
    const s = getSocket();
    s.emit('select_winner', { oderId });
  }, []);

  const nextRound = useCallback(() => {
    const s = getSocket();
    s.emit('next_round');
    useGameStore.getState().setSubmitted(false);
    useGameStore.getState().selectMeme(null);
  }, []);

  const changeLocale = useCallback((locale: string) => {
    const s = getSocket();
    s.emit('change_locale', { locale });
  }, []);

  useEffect(() => {
    const s = getSocket();

    const handleConnect = () => {
      isConnecting.current = false;
      useGameStore.getState().setConnectionStatus('connected');

      const savedPlayerId = sessionStorage.getItem('playerId');
      const savedRoomCode = sessionStorage.getItem('roomCode');
      if (savedPlayerId && savedRoomCode) {
        reconnectToRoom(savedPlayerId, savedRoomCode);
      }
    };

    const handleDisconnect = () => {
      isConnecting.current = false;
      useGameStore.getState().setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      isConnecting.current = false;
      useGameStore.getState().setConnectionStatus('disconnected');
      useGameStore.getState().setError('Failed to connect to server');
      setTimeout(() => useGameStore.getState().setError(null), 5000);
    };

    const handleRoomCreated = ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      useGameStore.getState().setLoading(false);
      useGameStore.getState().setPlayerId(playerId);
      useGameStore.getState().setRoomCode(roomCode);
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('roomCode', roomCode);
    };

    const handleRoomJoined = ({ playerId }: { playerId: string }) => {
      useGameStore.getState().setLoading(false);
      useGameStore.getState().setPlayerId(playerId);
      sessionStorage.setItem('playerId', playerId);
    };

    const handleRoomState = ({ state }: { state: GameState }) => {
      useGameStore.getState().setLoading(false);
      useGameStore.getState().syncGameState(state);
      useGameStore.getState().setRoomCode(state.roomCode);
      sessionStorage.setItem('roomCode', state.roomCode);
    };

    const handleHandDealt = ({ hand }: { hand: any[] }) => {
      useGameStore.getState().setHand(hand);
      useGameStore.getState().setSubmitted(false);
      useGameStore.getState().selectMeme(null);
    };

    const handlePlayerSubmitted = ({ playerId }: { playerId: string }) => {
      const currentState = useGameStore.getState().gameState;
      if (currentState?.currentRound) {
        const updatedRound = {
          ...currentState.currentRound,
          submittedPlayerIds: [...currentState.currentRound.submittedPlayerIds, playerId],
        };
        useGameStore.getState().syncGameState({
          ...currentState,
          currentRound: updatedRound,
        });
      }
    };

    const handleGameFinished = () => {
      const currentState = useGameStore.getState().gameState;
      useGameStore.getState().setFinalGameState({
        players: currentState?.players ?? [],
        judgeId: currentState?.currentRound?.judgeId ?? null,
      });
      useGameStore.getState().setShouldNavigateToFinished(true);
      const s2 = getSocket();
      s2.disconnect();
      useGameStore.getState().setConnectionStatus('disconnected');
    };

    const handleError = ({ message }: { message: string }) => {
      useGameStore.getState().setLoading(false);
      useGameStore.getState().setError(message);
      setTimeout(() => useGameStore.getState().setError(null), 5000);
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    s.on('connect_error', handleConnectError);
    s.on('room_created', handleRoomCreated);
    s.on('room_joined', handleRoomJoined);
    s.on('room_state', handleRoomState);
    s.on('hand_dealt', handleHandDealt);
    s.on('player_submitted', handlePlayerSubmitted);
    s.on('player_joined', () => {});
    s.on('player_left', () => {});
    s.on('player_reconnected', () => {});
    s.on('winner_selected', () => {});
    s.on('new_round', () => {});
    s.on('locale_changed', () => {});
    s.on('game_finished', handleGameFinished);
    s.on('error', handleError);

    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('connect_error', handleConnectError);
      s.off('room_created', handleRoomCreated);
      s.off('room_joined', handleRoomJoined);
      s.off('room_state', handleRoomState);
      s.off('hand_dealt', handleHandDealt);
      s.off('player_submitted', handlePlayerSubmitted);
      s.off('player_joined');
      s.off('player_left');
      s.off('player_reconnected');
      s.off('winner_selected');
      s.off('new_round');
      s.off('locale_changed');
      s.off('game_finished', handleGameFinished);
      s.off('error', handleError);
    };
  }, [reconnectToRoom]);

  return {
    connect,
    disconnect,
    finishGame,
    createRoom,
    joinRoom,
    reconnectToRoom,
    startGame,
    selectPhrase,
    submitMeme,
    selectWinner,
    nextRound,
    changeLocale,
    isConnected: connectionStatus === 'connected',
    connectionStatus,
  };
}
