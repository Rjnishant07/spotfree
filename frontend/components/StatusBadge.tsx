import React from 'react';
import { RoomStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: RoomStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

const STYLES: Record<string, { bg: string; text: string; border: string; dot: string; label: string }> = {
  VACANT: { bg: '#EAF3EA', text: '#2F5D3A', border: '#C9DFC7', dot: '#3E7A4A', label: 'Vacant' },
  FREE: { bg: '#EAF3EA', text: '#2F5D3A', border: '#C9DFC7', dot: '#3E7A4A', label: 'Vacant' },
  OCCUPIED: { bg: '#F6E9E6', text: '#8C3B2A', border: '#E3C4BB', dot: '#B24B34', label: 'Occupied' },
  RESERVED: { bg: '#FAF0DC', text: '#8A5A16', border: '#EAD5A4', dot: '#C1841F', label: 'Reserved' },
};
const DEFAULT_STYLE = { bg: '#EFEDE7', text: '#5C574C', border: '#DAD5C8', dot: '#8A8578', label: 'No information' };

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const s = STYLES[(status || '').toUpperCase()] || DEFAULT_STYLE;
  const sizeCls = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-3.5 py-1 text-xs' : 'px-2.5 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeCls}`}
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.label === 'Vacant' ? 'animate-pulse' : ''}`} style={{ backgroundColor: s.dot }} />
      <span>{s.label}</span>
    </span>
  );
};
