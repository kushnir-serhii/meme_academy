'use client';

import { useGameStore, selectPlayers, selectMyPlayer } from '@/lib/game';
import { useTranslations } from 'next-intl';
import PlayerAvatar from './PlayerAvatar';

interface RoomHeaderProps {
  compact?: boolean;
}

export default function RoomHeader({ compact = false }: RoomHeaderProps) {
  const t = useTranslations('common');
  const { gameState, connectionStatus } = useGameStore();
  const players = useGameStore(selectPlayers);
  const myPlayer = useGameStore(selectMyPlayer);

  if (!gameState) return null;

  return (
    <div className="screen-header flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection Status */}
        <span
          className={`connection-dot ${
            connectionStatus === 'connected'
              ? 'connection-dot-connected'
              : connectionStatus === 'connecting'
                ? 'connection-dot-connecting'
                : 'connection-dot-disconnected'
          }`}
        />

        {/* Room Code */}
        {!compact && (
          <div>
            <span className="text-game-text-dim text-xs">{t('room')}</span>
            <p className="room-code text-base sm:text-lg">{gameState.roomCode}</p>
          </div>
        )}
        {compact && <span className="room-code text-xs sm:text-sm">{gameState.roomCode}</span>}
      </div>

      {/* Current User Avatar + Player Count */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Current user avatar */}
        {myPlayer && (
          <div className="flex items-center gap-2">
            <PlayerAvatar player={myPlayer} size="sm" />
            <span className="hidden text-xs font-medium sm:inline sm:text-sm">
              {myPlayer.nickname}
            </span>
          </div>
        )}

        {/* Player count */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-game-text-dim hidden text-xs sm:block">{t('players')}</span>
          <p className="text-xs font-semibold sm:text-sm">
            <span className="neon-text">{players.filter((p) => p.isConnected).length}</span>
            {/* <span className="text-game-text-dim">/{players.length}</span> */}
          </p>
        </div>
      </div>
    </div>
  );
}
