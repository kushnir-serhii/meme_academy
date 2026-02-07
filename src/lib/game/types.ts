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
  phraseOptions: Phrase[];
  phrase: Phrase | null;
  submittedPlayerIds: PlayerId[];
  revealedSubmissions: Submission[];
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
}

// ============ SOCKET MESSAGE TYPES ============

// Client -> Server
export type ClientMessage =
  | { type: 'create_room'; nickname: string }
  | { type: 'join_room'; roomCode: RoomCode; nickname: string }
  | { type: 'start_game' }
  | { type: 'select_phrase'; phraseId: string }
  | { type: 'submit_meme'; memeId: string }
  | { type: 'select_winner'; oderId: string }
  | { type: 'next_round' }
  | { type: 'reconnect'; playerId: PlayerId; roomCode: RoomCode };

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
  | { type: 'all_submitted'; submissions: Submission[] }
  | { type: 'winner_selected'; winnerId: PlayerId; oderId: string }
  | { type: 'new_round'; round: RoundState }
  | { type: 'error'; message: string };

// ============ GAME SETTINGS ============

export const GAME_SETTINGS = {
  minPlayers: 3,
  maxPlayers: 10,
  memesPerHand: 10,
} as const;
