'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';

/**
 * Unified SpotFree Notification Toast (Dark Green Popup)
 * Features:
 * - Single authoritative popup across all roles and actions
 * - Dark green brand styling (#006c49) with emerald accent border
 * - Action icon + message text
 * - Interactive close button (X)
 * - Automatic dismissal after timeout
 * - Clean teardown on screen transitions
 * - Compact, floating above page content with slide-in animation
 * - Constrained within the 430px app frame
 */
export const Toast: React.FC = () => {
  const { toast, dismissToast } = useSpotFree();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [visible, setVisible] = useState(false);

  // Animate in when toast appears
  useEffect(() => {
    if (toast) {
      // Trigger animation on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [toast]);

  // Auto-dismiss after 3.5 seconds
  useEffect(() => {
    if (!toast) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      dismissToast();
      timerRef.current = null;
    }, 3500);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast, dismissToast]);

  // Note: The navigate() function in SpotFreeContext already calls dismissToast()
  // when switching screens, so we don't need a separate cleanup effect here.
  // A useEffect on currentView would incorrectly dismiss toasts that are
  // intentionally set alongside a view change (e.g., login welcome toast).

  if (!toast) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: visible ? '16px' : '-60px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '92%',
        maxWidth: '360px',
        pointerEvents: 'auto',
        transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          background: '#006c49',
          color: '#fff',
          padding: '10px 14px',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 108, 73, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: 1.4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', flexShrink: 0, color: '#6ee7b7' }}
          >
            {toast.icon || 'check_circle'}
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {toast.msg}
          </span>
        </div>
        <button
          type="button"
          onClick={dismissToast}
          style={{
            color: 'rgba(255,255,255,0.75)',
            flexShrink: 0,
            padding: '4px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(6, 78, 59, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
            e.currentTarget.style.background = 'transparent';
          }}
          aria-label="Close notification"
          title="Dismiss"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
        </button>
      </div>
    </div>
  );
};

/**
 * Deprecated LiveBanner component.
 * Retained as a null-rendering stub for backward compatibility.
 * All dynamic notifications are now routed through the unified Toast popup.
 */
export const LiveBanner: React.FC = () => null;
