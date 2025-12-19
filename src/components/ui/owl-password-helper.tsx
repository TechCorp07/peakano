'use client';

import { useEffect, useState } from 'react';

type OwlState = 'idle' | 'mismatch' | 'match';

interface OwlPasswordHelperProps {
  password: string;
  confirmPassword: string;
  /** Whether the owl should be visible (default: true) */
  show?: boolean;
}

/**
 * Owl Password Helper Component
 * A friendly owl mascot that provides visual feedback on password confirmation
 *
 * States:
 * - idle: Neutral, shown before typing or when confirm field is empty
 * - mismatch: Warning state when passwords don't match
 * - match: Success state when passwords match
 */
export function OwlPasswordHelper({ password, confirmPassword, show = true }: OwlPasswordHelperProps) {
  const [state, setState] = useState<OwlState>('idle');
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility with a slight delay for smooth animation
  useEffect(() => {
    if (show) {
      // Small delay before showing to allow for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  useEffect(() => {
    if (!confirmPassword || confirmPassword.length === 0) {
      setState('idle');
      return;
    }

    if (password === confirmPassword) {
      setState('match');
      // Trigger happy animation
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    } else {
      setState('mismatch');
    }
  }, [password, confirmPassword]);

  // Don't render if not shown
  if (!show) {
    return null;
  }

  const getMessage = () => {
    switch (state) {
      case 'idle':
        return "Let's make sure they match.";
      case 'mismatch':
        return "Passwords don't match yet.";
      case 'match':
        return 'Passwords match!';
    }
  };

  const getBubbleClasses = () => {
    const base = 'relative px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 shadow-sm';
    switch (state) {
      case 'idle':
        return `${base} bg-slate-100 text-slate-600`;
      case 'mismatch':
        return `${base} bg-amber-100 text-amber-700`;
      case 'match':
        return `${base} bg-emerald-100 text-emerald-700`;
    }
  };

  const getOwlBodyColor = () => {
    switch (state) {
      case 'idle':
        return '#94a3b8'; // slate-400
      case 'mismatch':
        return '#f59e0b'; // amber-500
      case 'match':
        return '#10b981'; // emerald-500
    }
  };

  const getOwlRotation = () => {
    if (state === 'mismatch') return 'rotate-[-8deg]';
    if (state === 'match' && isAnimating) return 'rotate-[4deg]';
    return 'rotate-0';
  };

  return (
    <div
      className={`flex items-start gap-2 mt-3 transition-all duration-300 motion-reduce:transition-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      {/* Owl Mascot */}
      <div
        className={`flex-shrink-0 transition-transform duration-200 motion-reduce:transition-none motion-reduce:transform-none ${getOwlRotation()} ${isAnimating ? 'animate-bounce' : ''}`}
        style={{ animationDuration: '0.5s', animationIterationCount: 2 }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-all duration-200"
          aria-hidden="true"
        >
          {/* Owl Body */}
          <ellipse cx="20" cy="24" rx="14" ry="12" fill={getOwlBodyColor()} className="transition-colors duration-200" />

          {/* Owl Head */}
          <circle cx="20" cy="14" r="10" fill={getOwlBodyColor()} className="transition-colors duration-200" />

          {/* Ears/Tufts */}
          <path d="M10 8 L12 4 L14 9" fill={getOwlBodyColor()} className="transition-colors duration-200" />
          <path d="M26 9 L28 4 L30 8" fill={getOwlBodyColor()} className="transition-colors duration-200" />

          {/* Left Eye White */}
          <circle cx="15" cy="14" r="5" fill="white" />
          {/* Right Eye White */}
          <circle cx="25" cy="14" r="5" fill="white" />

          {/* Left Pupil */}
          <circle
            cx={state === 'mismatch' ? '14' : '15'}
            cy="14"
            r="2.5"
            fill="#1e293b"
            className="transition-all duration-200"
          />
          {/* Right Pupil */}
          <circle
            cx={state === 'mismatch' ? '24' : '25'}
            cy="14"
            r="2.5"
            fill="#1e293b"
            className="transition-all duration-200"
          />

          {/* Eyebrows - change based on state */}
          {state === 'mismatch' && (
            <>
              <path d="M11 9 L18 11" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M29 9 L22 11" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}
          {state === 'match' && (
            <>
              <path d="M11 11 L18 9" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M29 11 L22 9" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {/* Beak */}
          <path
            d="M17 18 L20 22 L23 18"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="0.5"
          />

          {/* Wings */}
          <ellipse
            cx="8"
            cy="24"
            rx="3"
            ry="6"
            fill={getOwlBodyColor()}
            className={`transition-all duration-200 origin-center ${state === 'match' && isAnimating ? 'animate-pulse' : ''}`}
            style={{ opacity: 0.8 }}
          />
          <ellipse
            cx="32"
            cy="24"
            rx="3"
            ry="6"
            fill={getOwlBodyColor()}
            className={`transition-all duration-200 origin-center ${state === 'match' && isAnimating ? 'animate-pulse' : ''}`}
            style={{ opacity: 0.8 }}
          />

          {/* Feet */}
          <path d="M15 34 L13 38 M15 34 L15 38 M15 34 L17 38" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M25 34 L23 38 M25 34 L25 38 M25 34 L27 38" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />

          {/* Belly pattern */}
          <ellipse cx="20" cy="28" rx="6" ry="5" fill="white" opacity="0.3" />
        </svg>
      </div>

      {/* Speech Bubble */}
      <div className={getBubbleClasses()}>
        {/* Bubble pointer */}
        <div
          className={`absolute left-[-6px] top-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent transition-colors duration-200 ${
            state === 'idle' ? 'border-r-[6px] border-r-slate-100' :
            state === 'mismatch' ? 'border-r-[6px] border-r-amber-100' :
            'border-r-[6px] border-r-emerald-100'
          }`}
        />
        <span
          aria-live="polite"
          role="status"
          className="flex items-center gap-1.5"
        >
          {state === 'match' && (
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {state === 'mismatch' && (
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {getMessage()}
        </span>
      </div>
    </div>
  );
}
