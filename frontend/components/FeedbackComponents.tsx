'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';

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
 * - Constrained within the 430px app frame on mobile view
 */
export const Toast: React.FC = () => {
  const { toast, dismissToast } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isMobile = effectiveView === 'mobile';
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
        top: visible ? (isMobile ? '12px' : '16px') : '-80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: isMobile ? 'min(calc(100vw - 32px), 398px)' : 'min(92vw, 520px)',
        maxWidth: isMobile ? 'calc(100% - 32px)' : '520px',
        boxSizing: 'border-box',
        pointerEvents: 'auto',
        transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        style={{
          background: '#006c49',
          color: '#fff',
          padding: '10px 12px 10px 14px',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 108, 73, 0.25)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '10px',
          border: '1px solid rgba(52, 211, 153, 0.35)',
          fontSize: '12px',
          fontWeight: 600,
          lineHeight: 1.45,
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: '18px', flexShrink: 0, color: '#6ee7b7', marginTop: '1px' }}
          >
            {toast.icon || 'check_circle'}
          </span>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#fff',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              whiteSpace: 'normal',
              minWidth: 0,
              flex: 1,
            }}
          >
            {toast.msg}
          </span>
        </div>
        <button
          type="button"
          onClick={dismissToast}
          aria-label="Close notification"
          style={{
            color: 'rgba(255,255,255,0.75)',
            flexShrink: 0,
            padding: '2px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s, background 0.15s',
            marginTop: '1px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            close
          </span>
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
