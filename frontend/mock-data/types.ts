export type UserRole = 'Student' | 'Faculty' | 'Admin';

export type RoomType = 'CLASSROOM' | 'LABS' | 'SEMINAR HALL' | 'OFFICES';

export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'NO INFORMATION';

export type CampusBuilding = 'CME' | 'CB' | 'ICT';

export type StudentGroup = 'Group 1' | 'Group 2';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rollNumber?: string;
  branch?: string;
  year?: string;
  semester?: string;
  group?: StudentGroup | string;
  dept?: string;
  avatar?: string;
  password?: string;
}

export interface RoomTimelineSlot {
  time: string;
  text: string;
  status: 'Ended' | 'Active' | 'Upcoming';
}

export type AuthorityLevel = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface Room {
  id: string;            // e.g. 'CME604', 'CB501', 'ICT403', 'ICT B08', 'CME B07'
  roomNumber: string;    // e.g. '604', '501', '403', 'B08', 'B07'
  building: CampusBuilding;
  floor: number;         // -1 for Basement, 0 for Ground, 1 for 1st, etc.
  type: RoomType;        // ONLY: 'CLASSROOM' | 'LABS' | 'SEMINAR HALL' | 'OFFICES'
  capacity: number;
  status: RoomStatus;
  statusAuthority?: AuthorityLevel;
  updatedBy?: string;
  updatedRole?: AuthorityLevel | string;
  updatedAt?: string;
  reservedStart?: string | null;
  reservedEnd?: string | null;
  availableUntil: string;
  reservedUntil?: string | null;
  qrId: string;          // e.g. 'QR-CME604', 'QR-CB501', 'QR-ICT403'
  amenities: string[];
  timeText: string;
  timeline: RoomTimelineSlot[];
}

export interface StatusHistoryEntry {
  id: number | string;
  roomNumber: string;
  previousStatus: RoomStatus;
  newStatus: RoomStatus;
  updatedBy: string;
  updatedRole?: AuthorityLevel | string;
  authorityLevel?: AuthorityLevel;
  timestamp: string;
  source: 'QR' | 'MANUAL' | 'TIMETABLE' | 'STUDENT' | 'FACULTY OVERRIDE' | 'ADMIN OVERRIDE' | 'BOOKING';
  note?: string;
  startTime?: string;
  endTime?: string;
  // Compatibility aliases
  room?: string;
  from?: RoomStatus;
  to?: RoomStatus;
  by?: string;
  time?: string;
}

export interface Notification {
  id: number | string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type?: 'status' | 'reservation' | 'notice' | 'info';
}
