"use client";

import { useEffect, useState } from "react";
import { RISK_LABEL } from "@/lib/scoring/risk";
import type { RiskLevel } from "@/lib/types";

const RADIUS = 80;
const ARC_LENGTH = Math.PI * RADIUS;

const RISK_STROKE: Record<RiskLevel, string> = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
};

export function ScoreGauge({
  score,
  riskLevel,
}: {
  score: number;
  riskLevel: RiskLevel;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedScore(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const offset = ARC_LENGTH * (1 - animatedScore / 100);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-60">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={RISK_STROKE[riskLevel]}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 400ms cubic-bezier(0.2, 0, 0, 1)" }}
        />
      </svg>
      <div className="-mt-10 flex flex-col items-center">
        <span className="text-score-xl font-bold tabular-nums">{score}</span>
        <span className="text-body-sm text-muted-foreground">out of 100</span>
      </div>
      <p
        className="mt-2 text-body font-semibold"
        style={{ color: RISK_STROKE[riskLevel] }}
      >
        {RISK_LABEL[riskLevel]}
      </p>
    </div>
  );
}
