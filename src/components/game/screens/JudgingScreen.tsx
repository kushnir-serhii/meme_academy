'use client';

import { useState } from 'react';
import { useGameSocket, useGameStore, selectIsJudge, selectJudge, selectCurrentRound } from '@/lib/game';
import { RoomHeader, PlayerAvatar } from '../common';
import { PhraseCard, MemeCard } from '../cards';
import { useTranslations } from 'next-intl';

export default function JudgingScreen() {
  const t = useTranslations('judging');
  const { selectWinner } = useGameSocket();
  const isJudge = useGameStore(selectIsJudge);
  const judge = useGameStore(selectJudge);
  const round = useGameStore(selectCurrentRound);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleSelectSubmission = (oderId: string) => {
    if (isJudge) {
      setSelectedOrderId(selectedOrderId === oderId ? null : oderId);
    }
  };

  const handlePickWinner = () => {
    if (isJudge && selectedOrderId) {
      selectWinner(selectedOrderId);
    }
  };

  if (!round) return null;

  const submissions = round.revealedSubmissions;

  return (
    <div className="screen">
      <RoomHeader compact />

      <div className="screen-content gap-4 px-4">
        {/* Round Info */}
        <div className="text-center">
          <span className="text-game-text-dim text-sm">
            {t('round', { number: round.roundNumber })}
          </span>
        </div>

        {/* Phrase Card */}
        <PhraseCard phrase={round.phrase} />

        {/* Judge indicator */}
        <div className="flex items-center justify-center gap-2">
          {judge && (
            <>
              <PlayerAvatar player={judge} size="lg" />
              <span className="text-game-text-dim">
                {isJudge ? t('pickWinningMeme') : t('judgePicking', { nickname: judge.nickname })}
              </span>
            </>
          )}
        </div>

        {/* Submissions Grid */}
        <div className="flex-1">
          {isJudge ? (
            <>
              <h3 className="text-game-text-dim mb-4 text-center text-sm">{t('tapToSelect')}</h3>
              <div className="flex w-full flex-wrap justify-center gap-4">
                {/* meme-grid */}
                {submissions.map((submission) => (
                  <MemeCard
                    key={submission.oderId}
                    meme={submission.meme}
                    className="max-w-[45%] lg:max-w-[20%]"
                    selected={selectedOrderId === submission.oderId}
                    onClick={() => handleSelectSubmission(submission.oderId)}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="game-card p-8 text-center">
                <div className="spinner mx-auto mb-4" />
                <h2 className="mb-2 text-xl font-semibold text-white">{t('judgeDeciding')}</h2>
                {/* Nickname */}
                <p className="text-game-text-dim mb-4">
                  {t('judgePickingWinner', { nickname: judge?.nickname ?? '' })}
                </p>

                <p className="text-game-text-dim mb-4 text-xs">{t('submissions')}</p>
                <div className="mx-auto flex w-full flex-wrap justify-center gap-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.oderId}
                      className="aspect-square max-w-[45%] overflow-hidden rounded lg:max-w-[20%]"
                    >
                      <img
                        src={submission.meme.imageUrl}
                        alt={t('submittedMemeAlt')}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isJudge && (
        <div className="screen-footer">
          <button
            onClick={handlePickWinner}
            disabled={!selectedOrderId}
            className="game-btn game-btn-primary animate-glow w-full"
          >
            {selectedOrderId ? t('pickThisWinner') : t('selectMeme')}
          </button>
        </div>
      )}
    </div>
  );
}
