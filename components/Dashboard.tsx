"use client";

import { useSavingsData } from "@/hooks/useSavingsData";
import { useEffect, useMemo } from "react";
import AllocateFunds from "./AllocateFunds";
import NetWorthHero from "./NetWorthHero";
import ProgressRing from "./ProgressRing";
import PotCard from "./PotCard";
import AccountList from "./AccountList";

interface DashboardProps {
  onUpdateBalance: () => void;
  onAccountClick: (accountId: number) => void;
}

export default function Dashboard({
  onUpdateBalance,
  onAccountClick,
}: DashboardProps) {
  const { pots, accounts, isLoading, refresh } = useSavingsData();

  // Trigger recurring transactions processing on mount
  useEffect(() => {
    fetch("/api/recurring/process", { method: "POST" }).catch((err) =>
      console.error("Recurring process failed", err),
    );
  }, []);

  const {
    sortedPots,
    totalSavings,
    savingsForProgress,
    totalGoal,
    overallProgress,
    visiblePots,
    groupedAccounts,
  } = useMemo(() => {
    let totalSavingsCalc = 0;
    let savingsForProgressCalc = 0;
    let totalGoalCalc = 0;

    for (let i = 0; i < pots.length; i++) {
      const pot = pots[i] as any;
      const tb = pot.total_balance || 0;
      totalSavingsCalc += tb;

      if (pot.name !== "Unallocated") {
        savingsForProgressCalc += tb;
        totalGoalCalc += pot.goal_amount || 0;
      }
    }

    const overallProgressCalc =
      totalGoalCalc > 0 ? (savingsForProgressCalc / totalGoalCalc) * 100 : 0;

    const sortedPotsCalc = [...pots].sort((a: any, b: any) => {
      if (a.goal_date && b.goal_date) {
        return a.goal_date.localeCompare(b.goal_date);
      }
      if (a.goal_date) return -1;
      if (b.goal_date) return 1;
      return 0;
    });

    const visiblePotsCalc = sortedPotsCalc.filter(
      (p: any) => p.name !== "Unallocated" || p.total_balance !== 0,
    );

    const groupedAccountsCalc: Record<number, typeof accounts> = {};
    for (let i = 0; i < accounts.length; i++) {
      const a = accounts[i] as any;
      if (!groupedAccountsCalc[a.pot_id]) groupedAccountsCalc[a.pot_id] = [];
      groupedAccountsCalc[a.pot_id].push(a);
    }

    return {
      sortedPots: sortedPotsCalc,
      totalSavings: totalSavingsCalc,
      savingsForProgress: savingsForProgressCalc,
      totalGoal: totalGoalCalc,
      overallProgress: overallProgressCalc,
      visiblePots: visiblePotsCalc,
      groupedAccounts: groupedAccountsCalc,
    };
  }, [pots, accounts]);

  if (isLoading) {
    return (
      <div className="stack">
        <div className="skeleton" style={{ height: "220px" }} />
        <div className="skeleton" style={{ height: "100px" }} />
        <div className="skeleton" style={{ height: "80px" }} />
      </div>
    );
  }

  return (
    <div>
      {/* ─── Net Worth Hero ─── */}
      <NetWorthHero
        totalSavings={totalSavings}
        totalGoal={totalGoal}
        overallProgress={overallProgress}
      />

      {/* ─── Overall Progress Ring Card ─── */}
      {totalGoal > 0 && (
        <div className="credit-card mb-lg" style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-xl)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <ProgressRing
              percentage={Math.min(overallProgress, 100)}
              size={96}
              strokeWidth={7}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "white",
                    lineHeight: 1,
                  }}
                >
                  {Math.min(overallProgress, 100).toFixed(0)}%
                </div>
                <div
                  style={{
                    fontSize: "0.55rem",
                    color: "rgba(255,255,255,0.6)",
                    marginTop: "2px",
                  }}
                >
                  saved
                </div>
              </div>
            </ProgressRing>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  opacity: 0.7,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Savings Progress
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                £
                {savingsForProgress.toLocaleString("en-GB", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <div
                style={{ fontSize: "0.75rem", opacity: 0.6, marginTop: "4px" }}
              >
                £
                {(totalGoal - savingsForProgress > 0
                  ? totalGoal - savingsForProgress
                  : 0
                ).toLocaleString("en-GB")}{" "}
                remaining
              </div>
            </div>
          </div>
          {/* Wave decoration */}
          <div className="wave-decoration">
            <svg viewBox="0 0 400 80" fill="none" preserveAspectRatio="none">
              <path
                d="M0 40 Q50 10 100 35 T200 30 T300 40 T400 25 L400 80 L0 80Z"
                fill="rgba(13,148,136,0.3)"
              />
              <path
                d="M0 50 Q60 25 120 45 T240 35 T360 50 T400 40 L400 80 L0 80Z"
                fill="rgba(13,148,136,0.15)"
              />
            </svg>
          </div>
        </div>
      )}

      {/* ─── Actions Row ─── */}
      <div className="flex gap-md mb-lg">
        <button className="btn btn-primary flex-1" onClick={onUpdateBalance}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 7c0-5.333-8-5.333-8 0" />
            <path d="M10 7v14" />
            <path d="M6 21h12" />
            <path d="M6 13h10" />
          </svg>
          Update Balances
        </button>
        <div style={{ flex: 1 }}>
          <AllocateFunds
            pots={sortedPots}
            accounts={accounts}
            onUpdate={refresh}
          />
        </div>
      </div>

      {/* ─── Savings Pots Breakdown ─── */}
      <div className="section-header">
        <div className="section-title">Savings Pots</div>
        <div className="section-link">
          {visiblePots.length} pot{visiblePots.length !== 1 ? "s" : ""}
        </div>
      </div>

      {visiblePots.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏡</div>
          <div className="empty-state-text">
            No savings pots yet.
            <br />
            Go to Settings to create your first one!
          </div>
        </div>
      ) : (
        <div className="stack mb-xl">
          {visiblePots.map((pot) => {
            const potAccounts = groupedAccounts[pot.id] || [];
            return (
              <PotCard
                key={pot.id}
                pot={pot}
                accounts={potAccounts}
                onAccountClick={onAccountClick}
              />
            );
          })}
        </div>
      )}

      {/* ─── All Accounts Overview ─── */}
      {accounts.length > 0 && (
        <AccountList accounts={accounts} onAccountClick={onAccountClick} />
      )}
    </div>
  );
}
