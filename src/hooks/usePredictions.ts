import { useState, useEffect } from 'react';
import { MATCHES_DATA, Match } from '@/src/data/fimfData';

export interface MatchPrediction {
  matchId: string;
  predictedHome: number;
  predictedAway: number;
  predictedAt: string;
}

export interface PredictionScoreBreakdown {
  matchId: string;
  hasPredicted: boolean;
  predictedHome?: number;
  predictedAway?: number;
  actualHome?: number;
  actualAway?: number;
  isFinished: boolean;
  pointsEarned: number; // 3 for exact score, 1 for correct outcome (W/D/L), 0 otherwise
  outcomeResult: 'exact' | 'correct_outcome' | 'wrong' | 'pending';
}

const STORAGE_KEY = 'fimf_user_predictions';

export function usePredictions() {
  const [predictions, setPredictions] = useState<Record<string, MatchPrediction>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }

    // Default initial playful prediction seeds so user sees comparison immediately
    return {
      'm-j2-1': {
        matchId: 'm-j2-1',
        predictedHome: 2,
        predictedAway: 1,
        predictedAt: '2025-09-20T10:00:00Z',
      },
      'm-j2-2': {
        matchId: 'm-j2-2',
        predictedHome: 1,
        predictedAway: 0,
        predictedAt: '2025-09-20T11:00:00Z',
      },
      'm-j3-1': {
        matchId: 'm-j3-1',
        predictedHome: 2,
        predictedAway: 1,
        predictedAt: '2025-09-24T14:30:00Z',
      },
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(predictions));
    } catch {
      // Ignore
    }
  }, [predictions]);

  const savePrediction = (matchId: string, homeScore: number, awayScore: number) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        matchId,
        predictedHome: Math.max(0, homeScore),
        predictedAway: Math.max(0, awayScore),
        predictedAt: new Date().toISOString(),
      },
    }));
  };

  const removePrediction = (matchId: string) => {
    setPredictions((prev) => {
      const updated = { ...prev };
      delete updated[matchId];
      return updated;
    });
  };

  // Evaluate predictions against actual match results
  const evaluations: PredictionScoreBreakdown[] = MATCHES_DATA.map((match) => {
    const pred = predictions[match.id];
    const isFinished = match.status === 'finished';
    const actualHome = match.scoreHome;
    const actualAway = match.scoreAway;

    if (!pred) {
      return {
        matchId: match.id,
        hasPredicted: false,
        isFinished,
        actualHome,
        actualAway,
        pointsEarned: 0,
        outcomeResult: 'pending',
      };
    }

    if (!isFinished || actualHome === undefined || actualAway === undefined) {
      return {
        matchId: match.id,
        hasPredicted: true,
        predictedHome: pred.predictedHome,
        predictedAway: pred.predictedAway,
        actualHome,
        actualAway,
        isFinished: false,
        pointsEarned: 0,
        outcomeResult: 'pending',
      };
    }

    // Finished match evaluation:
    // Exact score: 3 points
    const isExact = pred.predictedHome === actualHome && pred.predictedAway === actualAway;
    if (isExact) {
      return {
        matchId: match.id,
        hasPredicted: true,
        predictedHome: pred.predictedHome,
        predictedAway: pred.predictedAway,
        actualHome,
        actualAway,
        isFinished: true,
        pointsEarned: 3,
        outcomeResult: 'exact',
      };
    }

    // Correct outcome (1: Home win, 0: Draw, -1: Away win): 1 point
    const predictedOutcome = Math.sign(pred.predictedHome - pred.predictedAway);
    const actualOutcome = Math.sign(actualHome - actualAway);

    if (predictedOutcome === actualOutcome) {
      return {
        matchId: match.id,
        hasPredicted: true,
        predictedHome: pred.predictedHome,
        predictedAway: pred.predictedAway,
        actualHome,
        actualAway,
        isFinished: true,
        pointsEarned: 1,
        outcomeResult: 'correct_outcome',
      };
    }

    return {
      matchId: match.id,
      hasPredicted: true,
      predictedHome: pred.predictedHome,
      predictedAway: pred.predictedAway,
      actualHome,
      actualAway,
      isFinished: true,
      pointsEarned: 0,
      outcomeResult: 'wrong',
    };
  });

  const totalPoints = evaluations.reduce((sum, e) => sum + e.pointsEarned, 0);
  const totalPredicted = Object.keys(predictions).length;
  const finishedEvaluations = evaluations.filter((e) => e.hasPredicted && e.isFinished);
  const exactCount = finishedEvaluations.filter((e) => e.outcomeResult === 'exact').length;
  const correctOutcomeCount = finishedEvaluations.filter(
    (e) => e.outcomeResult === 'correct_outcome'
  ).length;

  const successRate =
    finishedEvaluations.length > 0
      ? Math.round(((exactCount + correctOutcomeCount) / finishedEvaluations.length) * 100)
      : 0;

  return {
    predictions,
    savePrediction,
    removePrediction,
    evaluations,
    totalPoints,
    totalPredicted,
    finishedCount: finishedEvaluations.length,
    exactCount,
    correctOutcomeCount,
    successRate,
  };
}
