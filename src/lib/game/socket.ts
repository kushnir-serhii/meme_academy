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
  const store = useGameStore();
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (isConnecting.current) return;

    const s = getSocket();
    if (s.connected) return;

    isConnecting.current = true;
    store.setConnectionStatus('connecting');
    s.connect();
  }, [store]);
  // Need to implement finish game ===============================================================================
  const disconnect = useCallback(() => {
    const s = getSocket();
    s.disconnect();
    store.setConnectionStatus('disconnected');
  }, [store]);

  const createRoom = useCallback(
    (nickname: string, avatarId?: number | null, bgColor?: string | null) => {
      const s = getSocket();
      const locale = getCurrentLocale();
      store.setLoading(true);
      store.setMyAvatar(avatarId ?? null, bgColor ?? null);
      s.emit('create_room', { nickname, locale, avatarId, bgColor });
    },
    [store],
  );

  const joinRoom = useCallback(
    (roomCode: string, nickname: string, avatarId?: number | null, bgColor?: string | null) => {
      const s = getSocket();
      const locale = getCurrentLocale();
      store.setLoading(true);
      store.setMyAvatar(avatarId ?? null, bgColor ?? null);
      s.emit('join_room', { roomCode: roomCode.toUpperCase(), nickname, locale, avatarId, bgColor });
    },
    [store],
  );

  const reconnectToRoom = useCallback(
    (playerId: string, roomCode: string) => {
      const s = getSocket();
      const locale = getCurrentLocale();
      store.setLoading(true);
      s.emit('reconnect_room', { playerId, roomCode, locale });
    },
    [store],
  );

  const startGame = useCallback(() => {
    const s = getSocket();
    s.emit('start_game');
  }, []);

  const selectPhrase = useCallback((phraseId: string) => {
    const s = getSocket();
    s.emit('select_phrase', { phraseId });
  }, []);

  const submitMeme = useCallback(
    (memeId: string) => {
      const s = getSocket();
      s.emit('submit_meme', { memeId });
      store.setSubmitted(true);
    },
    [store],
  );

  const selectWinner = useCallback((oderId: string) => {
    const s = getSocket();
    s.emit('select_winner', { oderId });
  }, []);

  const nextRound = useCallback(() => {
    const s = getSocket();
    s.emit('next_round');
    store.setSubmitted(false);
    store.selectMeme(null);
  }, [store]);

  const changeLocale = useCallback((locale: string) => {
    const s = getSocket();
    s.emit('change_locale', { locale });
  }, []);

  useEffect(() => {
    const s = getSocket();

    const handleConnect = () => {
      isConnecting.current = false;
      store.setConnectionStatus('connected');
      // Reset error ===================================================================================
      // store.setError(null);

      // Try to reconnect to existing room
      const savedPlayerId = sessionStorage.getItem('playerId');
      const savedRoomCode = sessionStorage.getItem('roomCode');
      if (savedPlayerId && savedRoomCode) {
        reconnectToRoom(savedPlayerId, savedRoomCode);
      }
    };

    const handleDisconnect = () => {
      isConnecting.current = false;
      store.setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      isConnecting.current = false;
      store.setConnectionStatus('disconnected');
      store.setError('Failed to connect to server');
      // Reset error =======================================================
      setTimeout(() => store.setError(null), 5000);
    };

    const handleRoomCreated = ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      store.setLoading(false);
      store.setPlayerId(playerId);
      store.setRoomCode(roomCode);
      sessionStorage.setItem('playerId', playerId);
      sessionStorage.setItem('roomCode', roomCode);
    };

    const handleRoomJoined = ({ playerId }: { playerId: string }) => {
      store.setLoading(false);
      store.setPlayerId(playerId);
      sessionStorage.setItem('playerId', playerId);
    };

    const handleRoomState = ({ state }: { state: GameState }) => {
      store.setLoading(false);
      store.syncGameState(state);
      store.setRoomCode(state.roomCode);
      sessionStorage.setItem('roomCode', state.roomCode);
    };

    const handleHandDealt = ({ hand }: { hand: any[] }) => {
      store.setHand(hand);
      store.setSubmitted(false);
      store.selectMeme(null);
    };

    const handlePlayerSubmitted = ({ playerId }: { playerId: string }) => {
      // Update local state to show player has submitted
      const currentState = store.gameState;
      if (currentState?.currentRound) {
        const updatedRound = {
          ...currentState.currentRound,
          submittedPlayerIds: [...currentState.currentRound.submittedPlayerIds, playerId],
        };
        store.syncGameState({
          ...currentState,
          currentRound: updatedRound,
        });
      }
    };

    const handleError = ({ message }: { message: string }) => {
      store.setLoading(false);
      store.setError(message);
      setTimeout(() => store.setError(null), 5000);
    };

    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    s.on('connect_error', handleConnectError);
    s.on('room_created', handleRoomCreated);
    s.on('room_joined', handleRoomJoined);
    s.on('room_state', handleRoomState);
    s.on('hand_dealt', handleHandDealt);
    s.on('player_submitted', handlePlayerSubmitted);
    s.on('player_joined', () => {}); // Handled by room_state
    s.on('player_left', () => {}); // Handled by room_state
    s.on('player_reconnected', () => {}); // Handled by room_state
    s.on('winner_selected', () => {}); // Handled by room_state
    s.on('new_round', () => {}); // Handled by room_state
    s.on('locale_changed', () => {}); // Acknowledged
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
      s.off('error', handleError);
    };
  }, [store, reconnectToRoom]);

  return {
    connect,
    disconnect,
    createRoom,
    joinRoom,
    reconnectToRoom,
    startGame,
    selectPhrase,
    submitMeme,
    selectWinner,
    nextRound,
    changeLocale,
    isConnected: store.connectionStatus === 'connected',
    connectionStatus: store.connectionStatus,
  };
}
