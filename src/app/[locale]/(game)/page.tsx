'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

export default function GameHomePage() {
  const t = useTranslations('home');

  return (
    <div className="screen">
      <div className="screen-content items-center justify-center gap-8 px-4">
        {/* Language Switcher */}
        {/* <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div> */}

        {/* Logo */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold neon-text mb-2">
            {t('title1')}
          </h1>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            {t('title2')}
          </h1>
          <p className="text-game-text-dim text-lg">
            {t('subtitle')}
          </p>
        </div>

        {/* Main Actions */}
        <div className="flex flex-col gap-4 w-full max-w-sm animate-slide-up">
          <Link href="/create" className="game-btn game-btn-primary w-full">
            {t('createGame')}
          </Link>
          <Link href="/join" className="game-btn game-btn-secondary w-full">
            {t('joinGame')}
          </Link>
        </div>

        {/* How to Play */}
        <div className="game-card p-6 w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold mb-4 neon-text-sm">{t('howToPlay')}</h2>
          <ol className="space-y-3 text-sm text-game-text-dim">
            <li className="flex gap-3">
              <span className="neon-text font-bold">1.</span>
              <span>{t('step1')}</span>
            </li>
            <li className="flex gap-3">
              <span className="neon-text font-bold">2.</span>
              <span>{t('step2')}</span>
            </li>
            <li className="flex gap-3">
              <span className="neon-text font-bold">3.</span>
              <span>{t('step3')}</span>
            </li>
            <li className="flex gap-3">
              <span className="neon-text font-bold">4.</span>
              <span>{t('step4')}</span>
            </li>
          </ol>
        </div>

        {/* Footer */}
        <p className="text-game-text-dim text-xs">
          {t('playersNeeded')}
        </p>
      </div>
    </div>
  );
}
