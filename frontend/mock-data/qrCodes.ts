import { CampusBuilding } from './types';

export interface RoomQrCodeMapping {
  id: string;
  qrValue: string;
  qrId: string;
  roomNumber: string;
  building: CampusBuilding;
  floor: number;
}

/**
 * Centralized mapping of the 5 official SpotFree room QR codes.
 * Single source of truth for QR room identification.
 */
export const SPOTFREE_QR_CODES: RoomQrCodeMapping[] = [
  {
    id: 'CME604',
    qrValue: 'SPOTFREE:ROOM:CME604',
    qrId: 'QR-CME604',
    roomNumber: '604',
    building: 'CME',
    floor: 6,
  },
  {
    id: 'CME605',
    qrValue: 'SPOTFREE:ROOM:CME605',
    qrId: 'QR-CME605',
    roomNumber: '605',
    building: 'CME',
    floor: 6,
  },
  {
    id: 'CB501',
    qrValue: 'SPOTFREE:ROOM:CB501',
    qrId: 'QR-CB501',
    roomNumber: '501',
    building: 'CB',
    floor: 5,
  },
  {
    id: 'ICT403',
    qrValue: 'SPOTFREE:ROOM:ICT403',
    qrId: 'QR-ICT403',
    roomNumber: '403',
    building: 'ICT',
    floor: 4,
  },
  {
    id: 'ICT B08',
    qrValue: 'SPOTFREE:ROOM:ICT-B08',
    qrId: 'QR-ICT-B08',
    roomNumber: 'B08',
    building: 'ICT',
    floor: -1,
  },
];

/**
 * Resolves a scanned or uploaded QR value to its registered room mapping.
 * Matches QR codes: QR-CME604, QR-CME605, QR-CB501, QR-ICT403, QR-ICT-B08,
 * as well as SPOTFREE:ROOM:... and bare room IDs.
 */
export function lookupRoomByQr(qrValue: string): RoomQrCodeMapping | null {
  if (!qrValue) return null;
  const trimmed = qrValue.trim();

  // 1. Direct match on qrValue, qrId, or id (case-insensitive)
  const directMatch = SPOTFREE_QR_CODES.find(
    (q) =>
      q.qrValue.toUpperCase() === trimmed.toUpperCase() ||
      q.qrId.toUpperCase() === trimmed.toUpperCase() ||
      q.id.toUpperCase() === trimmed.toUpperCase()
  );
  if (directMatch) return directMatch;

  // 2. Resilient alphanumeric match (stripping all punctuation/spaces)
  const cleaned = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const fallback = SPOTFREE_QR_CODES.find((q) => {
    const qClean = q.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const qrIdClean = q.qrId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const valClean = q.qrValue.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const roomNoClean = q.roomNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const bldgRoomClean = `${q.building}${q.roomNumber}`.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    return (
      cleaned === qClean ||
      cleaned === qrIdClean ||
      cleaned === valClean ||
      cleaned === roomNoClean ||
      cleaned === bldgRoomClean ||
      cleaned.endsWith(qClean) ||
      valClean.endsWith(cleaned)
    );
  });

  return fallback || null;
}

/**
 * Looks up a room from manual entry against the registered QR rooms and room codes.
 * Accepts room formats such as CME604, CME-604, 604, CB501, ICT-B08, ICT B08, B08.
 */
export function lookupRoomByNumber(input: string): RoomQrCodeMapping | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase().replace(/[^a-zA-Z0-9]/g, '');

  return (
    SPOTFREE_QR_CODES.find((q) => {
      const idClean = q.id.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      const qrIdClean = q.qrId.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      const roomNoClean = q.roomNumber.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      const fullCodeClean = `${q.building}${q.roomNumber}`.toUpperCase().replace(/[^a-zA-Z0-9]/g, '');
      return (
        normalized === idClean ||
        normalized === qrIdClean ||
        normalized === roomNoClean ||
        normalized === fullCodeClean
      );
    }) || null
  );
}
