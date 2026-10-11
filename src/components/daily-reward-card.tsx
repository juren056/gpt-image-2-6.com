import {
  CalendarCheck,
  Check,
  Gift,
  History,
  LoaderCircle,
  RefreshCw,
} from 'lucide-react';

import { DialogDescription, DialogTitle } from '@/components/ui/dialog';

import '@/styles/daily-reward-card.css';

export type DailyRewardState = {
  claimedToday: boolean;
  streak: number;
  cycleDay: number;
  nextReward: number;
  cycleTotal: number;
  cycleRewards: number[];
  history: Array<{ date: string; reward: number }>;
};

export type DailyRewardCopy = {
  title: string;
  description: string;
  streak: string;
  cycleTotal: string;
  progress: string;
  days: string[];
  history: string;
  historyEmpty: string;
  creditUnit: string;
  claim: string;
  claimed: string;
  completed: string;
  loading: string;
  error: string;
  retry: string;
  rules: string;
};

export function DailyRewardCard({
  state,
  copy,
  historyDates,
  loading,
  error,
  pending,
  onClaim,
  onRetry,
}: {
  state?: DailyRewardState;
  copy: DailyRewardCopy;
  historyDates: string[];
  loading: boolean;
  error: boolean;
  pending: boolean;
  onClaim: () => void;
  onRetry: () => void;
}) {
  const ready = !loading && !error && !!state;
  return (
    <div className="daily-reward-card" aria-busy={loading || pending}>
      <div className="daily-reward-scroll">
        <header className="daily-reward-header">
          <span className="daily-reward-emblem" aria-hidden="true">
            <CalendarCheck />
          </span>
          <DialogTitle className="daily-reward-title">{copy.title}</DialogTitle>
          <DialogDescription className="daily-reward-description">
            {copy.description}
          </DialogDescription>
          {ready && (
            <>
              <div className="daily-reward-summary">
                <span>{copy.streak}</span>
                <strong>{copy.cycleTotal}</strong>
              </div>
              <div className="daily-reward-progress">
                <h3>{copy.progress}</h3>
                <ol className="daily-reward-week">
                  {state.cycleRewards.map((amount, index) => {
                    const completed = index < state.cycleDay;
                    return (
                      <li
                        key={index}
                        className={completed ? 'is-complete' : ''}
                      >
                        <span
                          className="daily-reward-day"
                          aria-label={`${copy.days[index]}: +${amount} ${copy.creditUnit}`}
                        >
                          {completed ? (
                            <Check aria-hidden="true" />
                          ) : (
                            <strong>+{amount}</strong>
                          )}
                          {completed && (
                            <span className="sr-only">{copy.completed}</span>
                          )}
                        </span>
                        <small>{copy.days[index]}</small>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </>
          )}
        </header>
        {loading ? (
          <div className="daily-reward-status" role="status">
            <LoaderCircle className="daily-reward-spinner" aria-hidden="true" />
            {copy.loading}
          </div>
        ) : error || !state ? (
          <div className="daily-reward-status" role="alert">
            <p>{copy.error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="daily-reward-retry"
            >
              <RefreshCw aria-hidden="true" />
              {copy.retry}
            </button>
          </div>
        ) : (
          <section className="daily-reward-history" aria-label={copy.history}>
            <h3>
              <History aria-hidden="true" />
              {copy.history}
            </h3>
            {state.history.length ? (
              <ul>
                {state.history.slice(0, 5).map((entry, index) => (
                  <li key={entry.date}>
                    <time dateTime={entry.date}>{historyDates[index]}</time>
                    <strong>
                      +{entry.reward} <span>{copy.creditUnit}</span>
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="daily-reward-empty">{copy.historyEmpty}</p>
            )}
          </section>
        )}
        <p className="daily-reward-rules">{copy.rules}</p>
      </div>
      <footer className="daily-reward-footer">
        <button
          type="button"
          className="daily-reward-claim"
          aria-label={
            pending || loading
              ? copy.loading
              : state?.claimedToday
                ? copy.claimed
                : copy.claim
          }
          disabled={!ready || pending || state?.claimedToday}
          onClick={onClaim}
        >
          {pending ? (
            <LoaderCircle className="daily-reward-spinner" aria-hidden="true" />
          ) : state?.claimedToday ? (
            <Check aria-hidden="true" />
          ) : (
            <Gift aria-hidden="true" />
          )}
          <span role="status">
            {pending || loading
              ? copy.loading
              : state?.claimedToday
                ? copy.claimed
                : copy.claim}
          </span>
        </button>
      </footer>
    </div>
  );
}
