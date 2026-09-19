import React from 'react';
import { RoomStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: RoomStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const norm = (status || '').toUpperCase();

  if (norm === 'VACANT' || norm === 'FREE') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#ecfdf5] text-[#065f46] border border-[#a7f3d0] ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
        <span className="tracking-wide">VACANT</span>
      </span>
    );
  }

  if (norm === 'OCCUPIED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
        <span className="tracking-wide">OCCUPIED</span>
      </span>
    );
  }

  if (norm === 'RESERVED') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#fffbeb] text-[#92400e] border border-[#fde68a] ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
        <span className="tracking-wide">RESERVED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#f8fafc] text-[#334155] border border-[#e2e8f0] ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#64748b]" />
      <span className="tracking-wide">NO INFO</span>
    </span>
  );
};
