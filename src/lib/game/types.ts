// ============ ROOM & PLAYER TYPES ============

export type RoomCode = string; // 6 character alphanumeric

export type PlayerId = string; // UUID

export interface Player {
  id: PlayerId;
  nickname: string;
  avatarColor: string;
  avatarId: number | null;
  score: number;
  isConnected: boolean;
  isHost: boolean;
}

// ============ GAME STATE TYPES ============

export type GamePhase = 'lobby' | 'phrase_selection' | 'picking' | 'judging' | 'result';

export interface MemeCard {
  id: string;
  imageUrl: string;
}

export interface Phrase {
  id: string;
  text: string;
}

export interface Submission {
  oderId: string;
  memeId: string;
  meme: MemeCard;
}

export interface RoundState {
  roundNumber: number;
  judgeId: PlayerId;
  phraseOptions: Phrase[];        // 3 options visible during phrase_selection
  phrase: Phrase | null;          // null until judge selects
  submittedPlayerIds: PlayerId[];
  revealedSubmissions: Submission[]; // only populated during judging/result
  winnerId: PlayerId | null;
  winningMemeId: string | null;
}

export interface GameState {
  roomCode: RoomCode;
  phase: GamePhase;
  players: Player[];
  hostId: PlayerId;
  currentRound: RoundState | null;
}

// ============ CLIENT STATE ============

export interface FinalGameState {
  players: Player[];
  judgeId: PlayerId | null;
}

export interface ClientState {
  playerId: PlayerId | null;
  roomCode: RoomCode | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  gameState: GameState | null;
  myHand: MemeCard[];
  selectedMemeId: string | null;
  hasSubmitted: boolean;
  error: string | null;
  isLoading: boolean;
  myAvatarId: number | null;
  myAvatarBgColor: string | null;
  finalGameState: FinalGameState | null;
  shouldNavigateToFinished: boolean;
}

// ============ SOCKET MESSAGE TYPES ============

// Client -> Server
export type ClientMessage =
  | { type: 'create_room'; nickname: string; locale?: string; avatarId?: number | null; bgColor?: string | null }
  | { type: 'join_room'; roomCode: RoomCode; nickname: string; locale?: string; avatarId?: number | null; bgColor?: string | null }
  | { type: 'reconnect_room'; playerId: PlayerId; roomCode: RoomCode; locale?: string }
  | { type: 'change_locale'; locale: string }
  | { type: 'start_game' }
  | { type: 'select_phrase'; phraseId: string }
  | { type: 'submit_meme'; memeId: string }
  | { type: 'select_winner'; oderId: string }
  | { type: 'next_round' }
  | { type: 'finish_game' };

// Server -> Client
export type ServerMessage =
  | { type: 'room_created'; roomCode: RoomCode; playerId: PlayerId }
  | { type: 'room_joined'; playerId: PlayerId }
  | { type: 'room_state'; state: GameState }
  | { type: 'hand_dealt'; hand: MemeCard[] }
  | { type: 'player_joined'; player: Player }
  | { type: 'player_left'; playerId: PlayerId }
  | { type: 'player_reconnected'; playerId: PlayerId }
  | { type: 'phrase_selected'; phrase: Phrase }
  | { type: 'player_submitted'; playerId: PlayerId }
  | { type: 'winner_selected'; winnerId: PlayerId; oderId: string }
  | { type: 'new_round'; round: RoundState }
  | { type: 'game_finished' }
  | { type: 'locale_changed'; locale: string }
  | { type: 'error'; message: string };

// ============ GAME SETTINGS ============

export const GAME_SETTINGS = {
  minPlayers: 3,
  maxPlayers: 10,
  memesPerHand: 10,
} as const;
