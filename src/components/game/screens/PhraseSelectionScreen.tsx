'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import {
  useGameSocket,
  useGameStore,
  selectIsJudge,
  selectJudge,
  selectCurrentRound,
  selectPhraseOptions,
} from '@/lib/game';
import { RoomHeader, PlayerAvatar } from '../common';
import { useTranslations } from 'next-intl';

export default function PhraseSelectionScreen() {
  const t = useTranslations('phraseSelection');
  const { selectPhrase } = useGameSocket();
  const isJudge = useGameStore(selectIsJudge);
  const judge = useGameStore(selectJudge);
  const round = useGameStore(selectCurrentRound);
  const phraseOptions = useGameStore(selectPhraseOptions);
  const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

  if (!round) return null;

  const handleSelectPhrase = (phraseId: string) => {
    if (isJudge) {
      setSelectedPhraseId(selectedPhraseId === phraseId ? null : phraseId);
    }
  };

  const handleConfirmPhrase = () => {
    if (isJudge && selectedPhraseId) {
      selectPhrase(selectedPhraseId);
    }
  };

  const handleSlideChange = (swiper: SwiperType) => {
    const newIndex = swiper.realIndex % phraseOptions.length;
    if (newIndex !== activeIndex) {
      setSelectedPhraseId(null);
    }
    setActiveIndex(newIndex);
  };

  const handleIndicatorClick = (index: number) => {
    swiperInstance?.slideToLoop(index);
  };

  const duplicatedPhrases = [...phraseOptions, ...phraseOptions];

  return (
    <div className="screen">
      <RoomHeader compact />

      <div className="screen-content gap-6 px-4">
        {/* Round Info */}
        <div className="text-center">
          <span className="text-game-text-dim text-sm">
            {t('round', { number: round.roundNumber })}
          </span>
        </div>

        {/* Judge indicator */}
          {judge && (
        <div className="flex items-center justify-center gap-2">
              <PlayerAvatar player={judge} size="sm" />
              <h2 className="text-2xl text-white mt-1">
                {isJudge ? t('choosePhrase') : t('judgeChoosing', { nickname: judge.nickname })}
              </h2>
        </div>
          )}

        {isJudge ? (
          <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
            <h3 className="text-game-text-dim text-center text-sm">{t('swipeHint')}</h3>

            <div className="border-game-border bg-game-card/30 relative mx-auto w-full overflow-hidden rounded-xl border px-4 py-8 lg:max-w-xl">
              <Swiper
                modules={[EffectCoverflow]}
                effect="coverflow"
                grabCursor
                centeredSlides
                slidesPerView={1.2}
                spaceBetween={-15}
                loop
                coverflowEffect={{
                  rotate: 0,
                  stretch: 0,
                  depth: 0,
                  modifier: 1,
                  scale: 0.85,
                  slideShadows: false,
                }}
                onSwiper={setSwiperInstance}
                onSlideChange={handleSlideChange}
                className="py-6"
                style={{ overflow: 'visible' }}
              >
                {duplicatedPhrases.map((phrase, index) => {
                  const isSelected = selectedPhraseId === phrase.id;
                  return (
                    <SwiperSlide key={`${phrase.id}-${index}`}>
                      <div
                        onClick={() => handleSelectPhrase(phrase.id)}
                        className={`game-card flex min-h-[100px] cursor-pointer flex-col items-center justify-center p-5 text-center transition-all ${
                          isSelected
                            ? 'border-game-neon neon-glow border-2'
                            : 'hover:border-game-neon/50 border-2 border-transparent'
                        }`}
                      >
                        <p className="text-base leading-relaxed font-semibold text-white">
                          {phrase.text}
                        </p>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              <div className="mt-4 flex justify-center gap-2">
                {phraseOptions.map((phrase, index) => (
                  <button
                    key={phrase.id}
                    onClick={() => handleIndicatorClick(index)}
                    className={`h-2.5 w-2.5 rounded-full transition-all ${
                      index === activeIndex
                        ? 'bg-game-neon scale-125'
                        : selectedPhraseId === phrase.id
                          ? 'bg-game-neon/50'
                          : 'bg-game-border'
                    }`}
                    aria-label={t('goToPhrase', { number: index + 1 })}
                  />
                ))}
              </div>
            </div>
              {/* Navigation buttons */}
              <div className="absolute z-50 w-[690px] hidden lg:flex">
                {/* Desktop navigation buttons */}
                <button
                  onClick={() => swiperInstance?.slidePrev()}
                  className="bg-game-card/80 text-game-text-dim hover:bg-game-card absolute top-1/2 left-2 z-10 hidden rounded-full p-2 transition-colors hover:text-white md:block"
                  aria-label={t('previousPhrase')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => swiperInstance?.slideNext()}
                  className="bg-game-card/80 text-game-text-dim hover:bg-game-card absolute top-1/2 right-2 z-10 hidden rounded-full p-2 transition-colors hover:text-white md:block"
                  aria-label={t('nextPhrase')}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="game-card p-8 text-center">
              <div className="spinner mx-auto mb-4" />
              <h2 className="mb-2 text-xl font-semibold text-white">{t('waitingForPhrase')}</h2>
              <p className="text-game-text-dim">
                {t('judgeChoosingPhrase', { nickname: judge?.nickname ?? '' })}
              </p>
            </div>
          </div>
        )}
      </div>

      {isJudge && (
        <div className="screen-footer">
          <button
            onClick={handleConfirmPhrase}
            disabled={!selectedPhraseId}
            className="game-btn game-btn-primary w-full"
          >
            {selectedPhraseId ? t('useThisPhrase') : t('selectPhrase')}
          </button>
        </div>
      )}
    </div>
  );
}
