'use client';
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useGameSocket, useGameStore, selectCurrentPhase } from '@/lib/game';
import LobbyScreen from '@/components/game/screens/LobbyScreen';
import PhraseSelectionScreen from '@/components/game/screens/PhraseSelectionScreen';
import PickingScreen from '@/components/game/screens/PickingScreen';
import JudgingScreen from '@/components/game/screens/JudgingScreen';
import ResultScreen from '@/components/game/screens/ResultScreen';
import { useTranslations } from 'next-intl';

export default function RoomPage() {
  const t = useTranslations('common');
  const params = useParams();
  const router = useRouter();
  const roomCode = params.code as string;

  const { connect, connectionStatus } = useGameSocket();
  const { gameState, playerId, error, shouldNavigateToFinished, setShouldNavigateToFinished } = useGameStore();
  const phase = useGameStore(selectCurrentPhase);

  useEffect(() => {
    connect();
  }, [connect]);

  useEffect(() => {
    if (shouldNavigateToFinished) {
      setShouldNavigateToFinished(false);
      router.push('/finished');
    }
  }, [shouldNavigateToFinished, setShouldNavigateToFinished, router]);

  useEffect(() => {
    // If no game state and not loading, redirect to join
    if (connectionStatus === 'connected' && !gameState && !playerId) {
      const savedRoomCode = sessionStorage.getItem('roomCode');
      const savedPlayerId = sessionStorage.getItem('playerId');

      if (!savedRoomCode || savedRoomCode !== roomCode.toUpperCase() || !savedPlayerId) {
        router.push(`/join?code=${roomCode}`);
      }
    }
  }, [connectionStatus, gameState, playerId, roomCode, router]);

  // Show loading while connecting
  if (connectionStatus !== 'connected' || !gameState) {
    return (
      <div className="screen">
        <div className="screen-content items-center justify-center">
          <div className="spinner" />
          <p className="text-game-text-dim mt-4">
            {connectionStatus === 'connecting' ? t('connecting') : t('loading')}
          </p>
          {error && <p className="text-game-error mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Render appropriate screen based on game phase
  switch (phase) {
    case 'lobby':
      return <LobbyScreen />;
    case 'phrase_selection':
      return <PhraseSelectionScreen />;
    case 'picking':
      return <PickingScreen />;
    case 'judging':
      return <JudgingScreen />;
    case 'result':
      return <ResultScreen />;
    default:
      return <LobbyScreen />;
  }
}
