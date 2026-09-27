export type UserRole = 'student' | 'faculty' | 'admin' | 'Student' | 'Faculty' | 'Admin';

export type RoomStatus = 'VACANT' | 'OCCUPIED' | 'RESERVED' | 'NO INFORMATION';

export type RoomType = 'CLASSROOM' | 'LABS' | 'SEMINAR HALL' | 'OFFICES';

export type SpaceType = RoomType | 'Classroom' | 'Seminar Room' | 'Meeting Room' | 'Study Room';

export type CampusBuilding = 'CME' | 'CB' | 'ICT';

export type StudentGroup = 'Group 1' | 'Group 2';

export interface RoomTimelineSlot {
  time: string;
  text: string;
  status: 'Ended' | 'Active' | 'Upcoming';
}

export type AuthorityLevel = 'STUDENT' | 'FACULTY' | 'ADMIN' | 'TIMETABLE';

export interface TimetableClassInfo {
  subjectCode: string;
  subjectName: string;
  faculty: string;
  facultyInitials?: string;
  startTime: string;
  endTime: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  group: 'All' | 'Group 1' | 'Group 2';
  type?: string;
  room: string;
}

export interface Room {
  id: string; // e.g., 'CME604', 'CB501', 'ICT403', 'ICT B08', 'CME B07', 'CME-104', 'CB601', 'LIBRARY'
  roomNumber: string;
  building: CampusBuilding;
  floor: number;
  type: RoomType | SpaceType;
  capacity: number;
  status: RoomStatus;
  statusAuthority?: AuthorityLevel;
  updatedBy?: string;
  updatedRole?: AuthorityLevel | string;
  updatedAt?: string;
  reservedStart?: string | null;
  reservedEnd?: string | null;
  availableUntil?: string;
  reservedUntil?: string | null;
  reservationDate?: string | null; // YYYY-MM-DD date for the reservation
  qrId?: string;
  timeText: string;
  amenities: string[];
  timeline: RoomTimelineSlot[];
  isTimetableControlled?: boolean;
  currentClass?: TimetableClassInfo | null;
  upcomingClass?: TimetableClassInfo | null;
}

export interface TimetableEntry {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  startTime: string; // e.g., '10:00 AM'
  endTime: string;   // e.g., '11:00 AM'
  startHour: number; // 24-hr format, e.g. 10.0
  endHour: number;   // 24-hr format, e.g. 11.0
  subjectCode: string;
  subjectName: string;
  room: string;
  group: 'All' | 'Group 1' | 'Group 2';
  faculty: string;
  facultyInitials?: string;
  ta?: string;
  type?: 'Lecture' | 'Lab' | 'Mentoring' | 'Remedial' | 'Library' | 'Break';
}

export interface StatusHistoryItem {
  id: number | string;
  roomNumber?: string;
  previousStatus?: RoomStatus;
  newStatus?: RoomStatus;
  updatedBy?: string;
  updatedRole?: AuthorityLevel | string;
  authorityLevel?: AuthorityLevel;
  room: string;
  from: RoomStatus;
  to: RoomStatus;
  by: string;
  timestamp: string;
  time: string;
  source: 'QR' | 'MANUAL' | 'TIMETABLE' | 'STUDENT' | 'FACULTY OVERRIDE' | 'ADMIN OVERRIDE' | 'BOOKING';
  note?: string;
  startTime?: string;
  endTime?: string;
}

export interface NotificationItem {
  id: number | string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  type?: 'status' | 'reservation' | 'notice' | 'info';
}

export interface UserProfile {
  name: string;
  id: string;
  dept: string;
  roleLabel: string;
  email: string;
  avatar: string;
  role: UserRole;
  rollNumber?: string;
  branch?: string;
  year?: string;
  semester?: string;
  group?: string;
  password?: string;
}

export type User = UserProfile;
export type StatusHistoryEntry = StatusHistoryItem;
export type Notification = NotificationItem;

export interface RoomQrCodeMapping {
  id: string;
  qrValue: string;
  roomNumber: string;
  building: CampusBuilding;
  floor: number;
}

export type ViewScreen =
  | 'login'
  | 'signup'
  | 'student-dashboard'
  | 'room-availability'
  | 'room-details'
  | 'best-room-req'
  | 'recommended-room'
  | 'scan-qr'
  | 'enter-room'
  | 'room-identified'
  | 'update-status'
  | 'status-updated'
  | 'faculty-dashboard'
  | 'admin-dashboard'
  | 'manage-rooms'
  | 'status-history'
  | 'notifications'
  | 'profile'
  | 'my-timetable';
