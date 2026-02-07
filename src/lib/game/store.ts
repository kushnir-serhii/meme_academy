import { create } from 'zustand';
import { ClientState, GameState, MemeCard, PlayerId } from './types';

interface GameStore extends ClientState {
  // Connection actions
  setConnectionStatus: (status: ClientState['connectionStatus']) => void;
  setPlayerId: (id: PlayerId) => void;
  setRoomCode: (code: string) => void;

  // Game state sync
  syncGameState: (state: GameState) => void;

  // Hand management
  setHand: (hand: MemeCard[]) => void;
  selectMeme: (memeId: string | null) => void;
  setSubmitted: (submitted: boolean) => void;

  // Avatar
  setMyAvatar: (avatarId: number | null, bgColor: string | null) => void;

  // UI
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;

  // Reset
  reset: () => void;
}

function loadAvatarFromSession(): { myAvatarId: number | null; myAvatarBgColor: string | null } {
  if (typeof window === 'undefined') return { myAvatarId: null, myAvatarBgColor: null };
  const avatarId = sessionStorage.getItem('myAvatarId');
  const bgColor = sessionStorage.getItem('myAvatarBgColor');
  return {
    myAvatarId: avatarId ? Number(avatarId) : null,
    myAvatarBgColor: bgColor || null,
  };
}

const initialState: ClientState = {
  playerId: null,
  roomCode: null,
  connectionStatus: 'disconnected',
  gameState: null,
  myHand: [],
  selectedMemeId: null,
  hasSubmitted: false,
  error: null,
  isLoading: false,
  ...loadAvatarFromSession(),
};

export const useGameStore = create<GameStore>()((set) => ({
  ...initialState,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setPlayerId: (playerId) => set({ playerId }),
  setRoomCode: (roomCode) => set({ roomCode }),

  syncGameState: (gameState) => set({ gameState }),

  setHand: (myHand) => set({ myHand }),
  selectMeme: (selectedMemeId) => set({ selectedMemeId }),
  setSubmitted: (hasSubmitted) => set({ hasSubmitted }),

  setMyAvatar: (myAvatarId, myAvatarBgColor) => {
    if (typeof window !== 'undefined') {
      if (myAvatarId !== null) {
        sessionStorage.setItem('myAvatarId', String(myAvatarId));
      } else {
        sessionStorage.removeItem('myAvatarId');
      }
      if (myAvatarBgColor !== null) {
        sessionStorage.setItem('myAvatarBgColor', myAvatarBgColor);
      } else {
        sessionStorage.removeItem('myAvatarBgColor');
      }
    }
    set({ myAvatarId, myAvatarBgColor });
  },

  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  reset: () => set(initialState),
}));

// Selectors
export const selectIsHost = (state: GameStore): boolean => {
  if (!state.playerId || !state.gameState) return false;
  return state.gameState.hostId === state.playerId;
};

export const selectIsJudge = (state: GameStore): boolean => {
  if (!state.playerId || !state.gameState?.currentRound) return false;
  return state.gameState.currentRound.judgeId === state.playerId;
};

export const selectCurrentPhase = (state: GameStore) => {
  return state.gameState?.phase ?? 'lobby';
};

export const selectPlayers = (state: GameStore) => {
  return state.gameState?.players ?? [];
};

export const selectCurrentRound = (state: GameStore) => {
  return state.gameState?.currentRound ?? null;
};

export const selectMyPlayer = (state: GameStore) => {
  if (!state.playerId || !state.gameState) return null;
  return state.gameState.players.find(p => p.id === state.playerId) ?? null;
};

export const selectJudge = (state: GameStore) => {
  if (!state.gameState?.currentRound) return null;
  return state.gameState.players.find(p => p.id === state.gameState?.currentRound?.judgeId) ?? null;
};

export const selectCanStartGame = (state: GameStore): boolean => {
  if (!state.gameState) return false;
  return (
    selectIsHost(state) &&
    state.gameState.phase === 'lobby' &&
    state.gameState.players.length >= 3
  );
};

export const selectPhraseOptions = (state: GameStore) => {
  return state.gameState?.currentRound?.phraseOptions ?? [];
};

export const selectIsWinner = (state: GameStore): boolean => {
  if (!state.playerId || !state.gameState?.currentRound) return false;
  return state.gameState.currentRound.winnerId === state.playerId;
};
