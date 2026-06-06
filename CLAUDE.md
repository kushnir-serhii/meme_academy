# Meme Academy - Project Context

## Overview
A multiplayer meme party game built with Next.js (client) and Socket.io (server). Players join rooms, get dealt meme cards, and compete to match memes to funny phrases. The judge picks the funniest combination each round.

## Tech Stack
- **Client**: Next.js 14+ (App Router), TypeScript, Tailwind CSS v4, Zustand (state)
- **Server**: Node.js, Express, Socket.io (separate repository)
- **Styling**: Custom neon green game theme in `src/app/styles/game.css`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (game)/room/[code]/ # Main game room page
│   ├── join/               # Join room page
│   └── styles/             # CSS files (game.css, theme.css, globals.css)
├── components/game/
│   ├── screens/            # Phase-based screens (Lobby, PhraseSelection, Picking, Judging, Result)
│   ├── cards/              # PhraseCard, MemeCard, MemeHand
│   └── common/             # RoomHeader, PlayerAvatar
├── lib/game/
│   ├── types.ts            # Shared types (GamePhase, Player, RoundState, etc.)
│   ├── store.ts            # Zustand store + selectors
│   ├── socket.ts           # Socket.io client hook (useGameSocket)
│   ├── constants.ts        # Game config, helpers
│   └── content/            # Meme and phrase data pools
```

**Note**: Server code is in a separate repository. See `SERVER_CONTEXT.md` for server documentation.

## Game Flow & Phases

```
lobby → phrase_selection → picking → judging → result → phrase_selection → ...
```

| Phase | Description |
|-------|-------------|
| `lobby` | Players join, host can start when 3+ players |
| `phrase_selection` | Judge picks from 3 phrase options (3-slide carousel: center card + 7% peek on sides) |
| `picking` | Non-judge players select a meme from their hand |
| `judging` | Judge sees all submitted memes, picks winner |
| `result` | Shows winner, scoreboard. **Winner** clicks "Next Round" |

**Important**:
- **First judge is always the host**
- Winner becomes the next judge and sees the phrase selection screen
- `picking → judging` transition is automatic (server-side) when all non-judges submit

## Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ nickname, locale?, avatarId?, bgColor? }` | Create new room |
| `join_room` | `{ roomCode, nickname, locale?, avatarId?, bgColor? }` | Join existing room |
| `reconnect_room` | `{ playerId, roomCode, locale? }` | Reconnect after disconnect |
| `change_locale` | `{ locale }` | Update player's locale mid-game |
| `start_game` | - | Host starts game |
| `select_phrase` | `{ phraseId }` | Judge selects phrase for round |
| `submit_meme` | `{ memeId }` | Player submits meme |
| `select_winner` | `{ oderId }` | Judge picks winning meme (`oderId` format: `"order-0"`, `"order-1"`, ...) |
| `next_round` | - | Winner triggers next round |
| `finish_game` | - | Host ends the game |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `room_created` | `{ roomCode, playerId }` | Room creation success |
| `room_joined` | `{ playerId }` | Join/reconnect success (sent to joining socket only) |
| `room_state` | `{ state: GameState }` | Full game state sync (broadcast after every state change) |
| `hand_dealt` | `{ hand: MemeCard[] }` | Player's meme cards (individual, not broadcast) |
| `player_joined` | `{ player }` | New player joined (broadcast) |
| `player_left` | `{ playerId }` | Player disconnected (broadcast) |
| `player_reconnected` | `{ playerId }` | Player reconnected (broadcast) |
| `phrase_selected` | `{ phrase }` | Judge selected phrase (broadcast) |
| `player_submitted` | `{ playerId }` | A player submitted meme (broadcast) |
| `winner_selected` | `{ winnerId, oderId }` | Judge picked winner (broadcast) |
| `new_round` | `{ round }` | New round started (broadcast) |
| `game_finished` | - | Host ended game — all clients redirect to `/finished` |
| `locale_changed` | `{ locale }` | Locale update confirmed (sent to requesting socket only) |
| `error` | `{ message }` | Translated error message (sent to requesting socket only) |

## Key Types

```typescript
type GamePhase = 'lobby' | 'phrase_selection' | 'picking' | 'judging' | 'result';

interface Player {
  id: PlayerId;
  nickname: string;
  avatarColor: string;     // Hex color — client's bgColor, or random if not provided
  avatarId: number | null; // Avatar image index (1–8), or null for initial-letter avatar
  score: number;
  isConnected: boolean;
  isHost: boolean;
  locale: 'en' | 'uk' | 'pl';
}

interface RoundState {
  roundNumber: number;
  judgeId: PlayerId;
  phraseOptions: Phrase[];      // 3 options for judge to choose
  phrase: Phrase | null;        // Selected phrase (null during phrase_selection)
  submittedPlayerIds: PlayerId[];
  revealedSubmissions: Submission[];
  winnerId: PlayerId | null;
  winningMemeId: string | null;
}

interface GameState {
  roomCode: RoomCode;
  phase: GamePhase;
  players: Player[];
  hostId: PlayerId;
  currentRound: RoundState | null;
}
```

## Server Architecture

Server code is in a **separate repository**. See `SERVER_CONTEXT.md` for full server documentation.

Key server responsibilities:
- Room management (create, join, reconnect, disconnect)
- Game state management and phase transitions
- Validation (is judge? is winner? correct phase?)
- Hand dealing and replenishment

## Styling Notes

- Uses Tailwind v4 with `@theme` in `theme.css` for custom colors
- Game theme colors: `--color-game-*` (neon green: `#39FF14`)
- Use `text-game-text-dim` for muted text (`#9ca3af`)
- Button classes: `game-btn game-btn-primary`, `game-btn-secondary`, `game-btn-ghost`
- Card classes: `game-card`, `phrase-card`, `meme-card`

## Environment Variables

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001  # Server URL
PORT=3001                                      # Server port
```

## Important Patterns

1. **State sync**: Server always emits `room_state` after state changes
2. **Phase transitions**: Server controls all phase changes
3. **Validation**: Server validates all actions (is judge? is winner? correct phase?)
4. **Reconnection**: Players can reconnect via sessionStorage `playerId` + `roomCode`
5. **Selectors**: Use Zustand selectors (`selectIsJudge`, `selectIsWinner`, etc.) for derived state
