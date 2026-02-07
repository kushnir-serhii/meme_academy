'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { useGameSocket, useGameStore } from '@/lib/game';
import { useTranslations } from 'next-intl';
import { AvatarPicker } from '@/components/game/common';

export const JoinRoom = () => {
  const t = useTranslations('join');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [roomCode, setRoomCode] = useState(initialCode);
  const [nickname, setNickname] = useState('');
  const [avatarId, setAvatarId] = useState<number | null>(null);
  const [bgColor, setBgColor] = useState<string | null>(null);
  const router = useRouter();
  const { connect, joinRoom, connectionStatus } = useGameSocket();
  const { isLoading, error, playerId, gameState } = useGameStore();
  const setError = useGameStore((s) => s.setError);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (playerId && gameState) {
      router.push(`/room/${gameState.roomCode}`);
    }
  }, [playerId, gameState, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid && connectionStatus === 'connected') {
      joinRoom(roomCode.trim(), nickname.trim(), avatarId, bgColor);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setRoomCode(value);
      if (error) setError(null);
    }
  };

  const isCodeValid = roomCode.length === 6;
  const isNicknameValid = nickname.trim().length >= 2 && nickname.trim().length <= 20;
  const isValid = isCodeValid && isNicknameValid;
  const canSubmit = isValid && connectionStatus === 'connected' && !isLoading;

  return (
    <div className="screen">
      {/* Header */}
      <div className="screen-header">
        <Link href="/" className="text-game-text-dim hover:text-game-neon transition-colors">
          &larr; {tCommon('back')}
        </Link>
      </div>

      {/* Content */}
      <div className="screen-content items-center justify-center gap-8 px-4">
        <div className="animate-fade-in text-center">
          <h1 className="text-game-text mb-2 text-3xl font-bold">{t('title')}</h1>
          <p className="text-game-text-dim">{t('subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="animate-slide-up w-full max-w-sm space-y-6">
          <div>
            <label htmlFor="roomCode" className="mb-2 block text-sm font-medium">
              {t('roomCodeLabel')}
            </label>
            <input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={handleCodeChange}
              placeholder={t('roomCodePlaceholder')}
              className="game-input game-input-code"
              maxLength={6}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="nickname" className="mb-2 block text-sm font-medium">
              {t('nicknameLabel')}
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (error) setError(null);
              }}
              placeholder={t('nicknamePlaceholder')}
              className="game-input"
              maxLength={20}
              autoComplete="off"
            />
            <p className="text-game-text-dim mt-2 text-xs">{t('nicknameHint')}</p>
          </div>

          <AvatarPicker
            nickname={nickname}
            selectedAvatarId={avatarId}
            selectedBgColor={bgColor}
            onAvatarChange={(id) => {
              setAvatarId(id);
              if (error) setError(null);
            }}
            onBgColorChange={(color) => {
              setBgColor(color);
              if (error) setError(null);
            }}
          />

          {error && (
            <div className="space-y-1 text-center text-sm">
              <p className="text-game-error">{error}</p>
              {error.toLowerCase().includes('nickname') && (
                <p className="text-game-text-dim text-xs">{t('errorNicknameHint')}</p>
              )}
              {(error.toLowerCase().includes('avatar') ||
                error.toLowerCase().includes('combo')) && (
                <p className="text-game-text-dim text-xs">{t('errorAvatarHint')}</p>
              )}
            </div>
          )}

          {connectionStatus !== 'connected' && (
            <div className="flex items-center justify-center gap-2 text-center text-sm text-yellow-400">
              <span className="connection-dot connection-dot-connecting" />
              {tCommon('connecting')}
            </div>
          )}

          <button type="submit" disabled={!canSubmit} className="game-btn game-btn-primary w-full">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="spinner" style={{ width: '1.25rem', height: '1.25rem' }} />
                {t('joining')}
              </span>
            ) : (
              t('joinRoom')
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
