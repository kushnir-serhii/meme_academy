'use client';

import Image from 'next/image';
import { Player } from '@/lib/game/types';
import { avatars } from '@/data/avatarData';

interface PlayerAvatarProps {
  player: Player;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export default function PlayerAvatar({ player, size = 'md', showName = false }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'player-avatar player-avatar-sm',
    md: 'player-avatar',
    lg: 'player-avatar player-avatar-lg',
  };

  const avatar = player.avatarId ? avatars.find((a) => a.id === player.avatarId) : null;

  const initial = player.nickname.charAt(0).toUpperCase();

  const imgSizes = { sm: 28, md: 40, lg: 56 };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} ${!player.isConnected ? 'opacity-50' : ''} overflow-hidden`}
        style={{ backgroundColor: player.avatarColor }}
      >
        {avatar ? (
          <Image
            src={avatar.imgUrl}
            alt={avatar.name}
            width={imgSizes[size]}
            height={imgSizes[size]}
            className="h-full w-full object-cover"
          />
        ) : (
          initial
        )}
      </div>
      {showName && (
        <span className={`font-medium ${!player.isConnected ? 'opacity-50' : ''}`}>
          {player.nickname}
        </span>
      )}
    </div>
  );
}
