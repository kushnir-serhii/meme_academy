'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useGameStore } from '@/lib/game';
import { PlayerAvatar } from '@/components/game/common';
import { useTranslations } from 'next-intl';

export default function FinishedPage() {
  const t = useTranslations('finished');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { finalGameState, playerId, reset } = useGameStore();

  const handleGoHome = useCallback(() => {
    sessionStorage.removeItem('playerId');
    sessionStorage.removeItem('roomCode');
    reset();
    router.push('/');
  }, [reset, router]);

  useEffect(() => {
    if (!finalGameState) {
      router.push('/');
    }
  }, [finalGameState, router]);

  if (!finalGameState) return null;

  const sortedPlayers = [...finalGameState.players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="screen">
      <div className="screen-content gap-4 overflow-y-auto px-4">
        {/* Header */}
        <div className="animate-scale-in pt-4 text-center">
          <h1 className="neon-text mb-1 text-3xl font-bold sm:text-4xl">{t('gameOver')}</h1>
        </div>

        {/* Winner highlight */}
        {winner && (
          <div className="game-card animate-scale-in p-4 text-center">
            <p className="text-game-text-dim mb-3 text-xs font-semibold uppercase tracking-widest">
              {t('winner')}
            </p>
            <div className="flex flex-col items-center gap-2">
              <PlayerAvatar player={winner} size="lg" />
              <span className="neon-text text-xl font-bold">{winner.nickname}</span>
              <span className="text-game-text-dim text-sm">{winner.score} pts</span>
            </div>
          </div>
        )}

        {/* Final scoreboard */}
        <div className="game-card animate-slide-up p-4" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-game-text-dim mb-3 text-sm font-semibold">{t('scoreboard')}</h2>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-lg p-2 ${
                  index === 0 ? 'bg-game-neon/10 border-game-neon/30 border' : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-game-text-dim flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <PlayerAvatar player={player} size="sm" />
                  <span className={player.id === playerId ? 'font-medium' : ''}>
                    {player.nickname}
                    {player.id === playerId && (
                      <span className="text-game-text-dim ml-1 text-xs">({tCommon('you')})</span>
                    )}
                  </span>
                </div>
                <span className={`font-bold ${index === 0 ? 'neon-text' : ''}`}>
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation — same for everyone */}
      <div className="p-4">
        <button onClick={handleGoHome} className="game-btn game-btn-primary w-full">
          {t('backToHome')}
        </button>
      </div>
    </div>
  );
}
