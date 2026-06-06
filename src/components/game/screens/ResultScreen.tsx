'use client';

import { useGameSocket, useGameStore, selectCurrentRound, selectPlayers, selectIsWinner, selectIsHost } from '@/lib/game';
import { RoomHeader, PlayerAvatar } from '../common';
import { PhraseCard } from '../cards';
import { useTranslations } from 'next-intl';

export default function ResultScreen() {
  const t = useTranslations('result');
  const tCommon = useTranslations('common');
  const { nextRound, finishGame } = useGameSocket();
  const { playerId } = useGameStore();
  const round = useGameStore(selectCurrentRound);
  const players = useGameStore(selectPlayers);
  const isWinner = useGameStore(selectIsWinner);
  const isHost = useGameStore(selectIsHost);

  if (!round) return null;

  const winner = players.find(p => p.id === round.winnerId);
  const winningSubmission = round.revealedSubmissions.find(
    s => s.memeId === round.winningMemeId
  );

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="screen pb-6">
      <RoomHeader compact />

      <div className="screen-content gap-4 overflow-y-auto px-4">
        {/* Winner Announcement */}
        <div className="animate-scale-in pt-2 text-center">
          {isWinner ? (
            <>
              <h1 className="neon-text mb-2 text-2xl font-bold sm:text-3xl">{t('youWon')}</h1>
              <p className="text-game-text-dim text-sm">{t('youWillBeJudge')}</p>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-xl font-bold sm:text-2xl">
                <span className="neon-text">{winner?.nickname}</span>
                <span className="text-white">
                  {' '}
                  {t('playerWins', { nickname: '' }).replace('{nickname}', '').trim()}
                </span>
              </h1>
              <p className="text-game-text-dim text-sm">{t('theyWillBeJudge')}</p>
            </>
          )}
        </div>

        {/* Phrase */}
        <PhraseCard phrase={round.phrase} />

        {/* Winning Meme */}
        {winningSubmission && (
          <div className="game-card animate-slide-up p-3 sm:p-4">
            <p className="text-game-text-dim mb-2 text-center text-xs">{t('winningMeme')}</p>
            <div className="neon-border mx-auto aspect-square max-w-[200px] overflow-hidden rounded-lg sm:max-w-xs">
              <img
                src={winningSubmission.meme.imageUrl}
                alt={t('winningMemeAlt')}
                className="h-full w-full object-cover"
              />
            </div>
            {winner && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <PlayerAvatar player={winner} size="sm" />
                <span className="text-sm font-medium">{winner.nickname}</span>
              </div>
            )}
          </div>
        )}

        {/* Scoreboard */}
        <div className="game-card animate-slide-up p-4" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-game-text-dim mb-3 text-sm font-semibold">{t('scoreboard')}</h2>
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between rounded-lg p-2 ${
                  player.id === round.winnerId
                    ? 'bg-game-neon/10 border-game-neon/30 border'
                    : 'bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span
                    className={`text-game-text-dim flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold`}
                  >
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
                <span className={`font-bold ${player.id === round.winnerId ? 'neon-text' : ''}`}>
                  {player.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(isWinner || isHost) && (
        <div className="flex flex-col gap-4 px-4">
          {isWinner && (
            <button onClick={nextRound} className="game-btn game-btn-primary w-full">
              {t('nextRound')}
            </button>
          )}
          {isHost && (
            <button onClick={finishGame} className="game-btn game-btn-secondary w-full">
              {t('finishGame')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
