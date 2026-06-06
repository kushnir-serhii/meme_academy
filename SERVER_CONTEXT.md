# Meme Academy Server - Context for Separate Repository

Copy this to `CLAUDE.md` in your server repository.

---

# Meme Academy Server

## Overview
Socket.io game server for the Meme Academy multiplayer party game. Handles room management, game state, and real-time communication.

## Tech Stack
- Node.js, Express, Socket.io, TypeScript

## Project Structure

```
src/
├── server/index.ts     # Express + Socket.io setup, event handlers
├── game.ts             # GameRoomManager class (all game logic)
├── types.ts            # Shared types + toPublicState()
├── constants.ts        # generateRoomCode, generatePlayerId, getRandomAvatarColor, GAME_CONFIG
├── i18n/index.ts       # getErrorMessage(), normalizeLocale()
└── content/
    ├── memes.ts        # MEME_POOL + getRandomMemes()
    └── phrases/
        ├── en.ts       # English phrase pool
        ├── uk.ts       # Ukrainian phrase pool
        ├── pl.ts       # Polish phrase pool
        └── index.ts    # getRandomPhrases(count, usedIds, locale)
```

## Game Flow & Phases

```
lobby → phrase_selection → picking → judging → result → phrase_selection → ...
```

| Phase | Who acts | Next phase trigger |
|-------|----------|-------------------|
| `lobby` | Host clicks start | `start_game` event → **host** becomes first judge |
| `phrase_selection` | Judge picks phrase (3-slide carousel UI) | `select_phrase` event |
| `picking` | All non-judges submit | All players submitted → auto-transition |
| `judging` | Judge picks winner | `select_winner` event |
| `result` | Winner clicks "Next Round" | `next_round` event → winner becomes next judge |

**Critical**:
- **First judge is always the host** (not random)
- Winner becomes the next judge (not the current judge)
- Phase transition `picking → judging` is automatic when all non-judges have submitted

## Socket Events

### Client → Server
```typescript
socket.on('create_room', ({ nickname, locale, avatarId, bgColor }) => ...)
socket.on('join_room', ({ roomCode, nickname, locale, avatarId, bgColor }) => ...)
socket.on('reconnect_room', ({ playerId, roomCode, locale }) => ...)
socket.on('change_locale', ({ locale }) => ...)
socket.on('start_game', () => ...)
socket.on('select_phrase', ({ phraseId }) => ...)
socket.on('submit_meme', ({ memeId }) => ...)
socket.on('select_winner', ({ oderId }) => ...)   // oderId format: "order-0", "order-1", ...
socket.on('next_round', () => ...)
socket.on('finish_game', () => ...)   // Host only
```

### Server → Client
```typescript
socket.emit('room_created', { roomCode, playerId })
socket.emit('room_joined', { playerId })          // Also sent on reconnect to the reconnecting socket
socket.emit('room_state', { state: RoomPublicState })
socket.emit('hand_dealt', { hand: MemeCard[] })
socket.emit('player_joined', { player: Player })
socket.emit('player_left', { playerId })
socket.emit('player_reconnected', { playerId })   // Broadcast to room after reconnect
socket.emit('phrase_selected', { phrase })
socket.emit('player_submitted', { playerId })
socket.emit('winner_selected', { winnerId, oderId })
socket.emit('new_round', { round })
socket.emit('game_finished')                      // Broadcast to all — triggers /finished redirect
socket.emit('locale_changed', { locale })         // Sent only to the requesting socket
socket.emit('error', { message })
```

## Types

```typescript
type Locale = 'en' | 'uk' | 'pl';
type GamePhase = 'lobby' | 'phrase_selection' | 'picking' | 'judging' | 'result';
type PlayerId = string;  // UUID
type RoomCode = string;  // 6 char alphanumeric

interface Player {
  id: PlayerId;
  nickname: string;
  avatarColor: string;   // Hex color — client's bgColor, or random if not provided
  avatarId: number | null;
  score: number;
  isConnected: boolean;
  isHost: boolean;
  locale: Locale;
}

interface ServerPlayer extends Player {
  socketId: string;
  hand: MemeCard[];
}

interface MemeCard {
  id: string;
  imageUrl: string;
}

interface Phrase {
  id: string;
  text: string;
}

interface Submission {
  oderId: string;   // "order-0", "order-1", ... (shuffled index, fixed once at judging start)
  memeId: string;
  meme: MemeCard;
}

// Public round state sent to clients
interface RoomPublicState {
  roomCode: RoomCode;
  phase: GamePhase;
  players: Player[];
  hostId: PlayerId;
  currentRound: {
    roundNumber: number;
    judgeId: PlayerId;
    phraseOptions: Phrase[];          // 3 options — visible during phrase_selection
    phrase: Phrase | null;            // null until judge selects
    submittedPlayerIds: PlayerId[];
    revealedSubmissions: Submission[]; // Only populated during judging/result
    winnerId: PlayerId | null;
    winningMemeId: string | null;
  } | null;
}

interface ServerRoundState {
  roundNumber: number;
  judgeId: PlayerId;
  phraseOptions: Phrase[];
  phrase: Phrase | null;
  submissions: Map<PlayerId, { memeId: string; meme: MemeCard }>;
  shuffledSubmissionOrder: PlayerId[];  // Shuffled once when entering judging phase — never re-shuffle
  winnerId: PlayerId | null;
  winningMemeId: string | null;
}

interface ServerRoom {
  code: RoomCode;
  phase: GamePhase;
  players: Map<PlayerId, ServerPlayer>;
  hostId: PlayerId;
  currentRound: ServerRoundState | null;
  usedPhraseIds: string[];
  usedMemeIds: string[];
  createdAt: number;
}
```

## GameRoomManager Methods

```typescript
class GameRoomManager {
  // Room lifecycle
  createRoom(socket, nickname, locale?, avatarId?, bgColor?): void
  joinRoom(socket, roomCode, nickname, locale?, avatarId?, bgColor?): void
  reconnect(socket, playerId, roomCode, locale?): void
  handleDisconnect(socket): void

  // Locale
  changeLocale(socket, locale): void

  // Game actions (all validate caller + phase)
  startGame(socket): void               // Host only, phase: lobby
  selectPhrase(socket, phraseId): void  // Judge only, phase: phrase_selection
  submitMeme(socket, memeId): void      // Non-judge only, phase: picking
  selectWinner(socket, oderId): void    // Judge only, phase: judging
  nextRound(socket): void               // Winner only, phase: result
  finishGame(socket): void              // Host only, any phase

  // HTTP
  getRoomInfo(roomCode): { exists, playerCount?, phase?, canJoin? }

  // Internal helpers
  private dealHands(room): void         // Give each player 10 memes (no duplicates across players)
  private replenishHands(room): void    // Give 1 new meme to each player who submitted
  private createRound(room, judgeId): ServerRoundState
  private getPlayerLocale(socket): Locale
}
```

## Key Logic Details

### Room Creation
- Generate 6-char room code, UUID player ID
- First player is host
- `avatarColor` = client's `bgColor` if provided, else `getRandomAvatarColor()`
- `avatarId` stored as-is (null if not provided)

### Join Room — Avatar Uniqueness Check
- Nickname uniqueness: case-insensitive
- Avatar combo check: if both `avatarId` and `bgColor` are provided, rejects if another player has the same combination

### Start Game
- Host only, min 3 players
- Deal hands (10 memes each, no duplicates across hands)
- **First judge = host** (not random)
- Create round with 3 phrase options in judge's locale
- Phase → `phrase_selection`

### Phrase Selection
- Judge picks from `phraseOptions` (validated against the 3 options)
- `phrase` set, marked as used in `usedPhraseIds`
- Phase → `picking`
- Emits `phrase_selected` then `room_state`

### Meme Submission
- Judge cannot submit
- Validates meme is in player's hand; removes it on submission
- When all non-judges submit:
  - Shuffle submission order **once** → store in `shuffledSubmissionOrder`
  - Phase → `judging`
  - Emits `room_state`

### Winner Selection
- `oderId` = `"order-X"` where X is index into `shuffledSubmissionOrder`
- Looks up winner via stored shuffle order (never re-shuffles)
- Awards 1 point to winner
- Phase → `result`
- Emits `winner_selected` then `room_state`

### Next Round
- Only winner can trigger
- Winner becomes next judge
- Replenish hands (1 card to each player who submitted)
- Phrases for new round use judge's locale
- Phase → `phrase_selection`
- Emits `room_state`, `new_round`, then individual `hand_dealt`

### Finish Game
- Host only, any phase
- Emits `game_finished` to all in room
- Cleans up `socketToPlayer` entries and deletes the room

### Disconnect Handling
- Sets `player.isConnected = false`
- If in **lobby**: removes player after grace period (`GAME_CONFIG.reconnectGracePeriodMs`)
  - Reassigns host if host left
  - Deletes room if empty
- If in **game**: player stays in room, can reconnect

### Reconnection
- Restores socket mapping, sets `isConnected = true`
- Updates locale if provided
- Emits `room_joined` + `room_state` to reconnecting socket
- Re-sends `hand_dealt` if player has cards
- Broadcasts `player_reconnected` to room

## CRITICAL: Submission Shuffle Order

`shuffledSubmissionOrder` is set **once** when entering `judging` phase. `toPublicState()` uses this stored order — it never re-shuffles. This ensures `oderId: "order-0"` always maps to the same player across all `room_state` broadcasts until the round ends.

## toPublicState()

Converts `ServerRoom` → `RoomPublicState` (client-safe):
- Strips `socketId` and `hand` from players
- Includes `phraseOptions` always (needed during `phrase_selection`)
- `revealedSubmissions` only populated during `judging` / `result` phases
- Uses stored `shuffledSubmissionOrder` for consistent submission ordering

## CORS Config
```typescript
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'https://meme-academy.vercel.app'],
    methods: ['GET', 'POST'],
  },
});
```

## Environment
```env
PORT=3001
```

## Complete Error Code Reference

| Error Code | When Used |
|------------|-----------|
| `ROOM_NOT_FOUND` | Room code doesn't exist |
| `ROOM_FULL` | Room has 10 players |
| `GAME_IN_PROGRESS` | Trying to join after game started |
| `INVALID_NICKNAME` | Nickname < 2 or > 20 chars |
| `NICKNAME_TAKEN` | Nickname already in use in room (case-insensitive) |
| `AVATAR_COMBO_TAKEN` | Same avatarId + bgColor combo already used in room |
| `NOT_HOST` | Non-host tries to start/finish game |
| `NOT_ENOUGH_PLAYERS` | Host tries to start with < 3 players |
| `NOT_JUDGE` | Non-judge tries to select phrase/winner |
| `NOT_WINNER` | Non-winner tries to start next round |
| `JUDGE_CANNOT_SUBMIT` | Judge tries to submit a meme |
| `PLAYER_NOT_FOUND` | Player ID not found in room during reconnect |
| `INVALID_PHRASE` | phraseId not in current phraseOptions |
| `INVALID_MEME` | Meme not in player's hand |
| `ALREADY_SUBMITTED` | Player already submitted this round |
| `INVALID_SELECTION` | Invalid oderId in select_winner |
| `CONNECTION_ERROR` | Generic connection issue |
| `RECONNECT_FAILED` | Player/room not found on reconnect |

## i18n

- Supported locales: `en`, `uk`, `pl` (default: `en`)
- Locale is sent by client on `create_room`, `join_room`, `reconnect_room`
- Each player stores their own locale
- Phrase options for a round use the **judge's locale**
- Error messages are translated to the receiving player's locale
- `change_locale` event updates a player's locale mid-game
