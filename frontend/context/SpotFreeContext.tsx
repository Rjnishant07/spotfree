'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  UserRole,
  AuthorityLevel,
  RoomStatus,
  RoomType,
  SpaceType,
  CampusBuilding,
  StudentGroup,
  Room,
  TimetableEntry,
  StatusHistoryItem,
  NotificationItem,
  UserProfile,
  User,
  ViewScreen,
} from '@/lib/types';
import {
  INITIAL_ROOMS,
  HIT_TIMETABLE,
  INITIAL_PROFILES,
  INITIAL_HISTORY,
  INITIAL_NOTIFICATIONS,
} from '@/lib/mockData';
import { findMockUserByEmail, MOCK_USERS } from '@/mock-data/users';

interface BestRoomCriteria {
  purpose: string;
  peopleCount: number;
  preferredBuilding: string;
  date: string;
  startTime: string;
  duration: string;
  amenities: string[];
}

interface SpotFreeContextType {
  // Navigation & Role
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  loginUser: (email: string, role?: UserRole, name?: string) => void;
  registerUser: (newUser: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
    rollNumber?: string;
    branch?: string;
    year?: string;
    semester?: string;
    group?: string;
  }) => { success: boolean; error?: string; user?: User };
  logoutUser: () => void;
  currentView: ViewScreen;
  navigate: (view: ViewScreen, pushHistory?: boolean) => void;
  goBack: () => void;
  currentUser: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  changeUserPassword: (currentPassword: string, newPassword: string) => { success: boolean; error?: string };

  // Authority Checking
  canUserOverrideRoom: (roomAuthority?: AuthorityLevel) => { allowed: boolean; reason?: string; isOverride: boolean };

  // Rooms Data (Single Source of Truth)
  rooms: Room[];
  selectedRoomId: string;
  setSelectedRoomId: (id: string) => void;
  selectedRoom: Room | undefined;
  updateRoomStatus: (
    roomId: string,
    newStatus: RoomStatus,
    note?: string,
    source?: 'QR' | 'MANUAL' | 'TIMETABLE' | 'STUDENT' | 'FACULTY OVERRIDE' | 'ADMIN OVERRIDE' | 'BOOKING',
    reservedUntil?: string | null,
    startTime?: string | null,
    endTime?: string | null
  ) => { success: boolean; error?: string };
  bookVacantRoom: (
    roomId: string,
    date: string,
    startTime: string,
    duration: string
  ) => boolean;
  adminOverrideStatus: (
    roomId: string,
    newStatus: RoomStatus,
    reservedUntil?: string | null,
    note?: string,
    startTime?: string,
    endTime?: string
  ) => void;
  addRoom: (newRoom: {
    id: string;
    building: CampusBuilding;
    floor: number;
    type: SpaceType;
    capacity: number;
  }) => void;
  editRoom: (
    roomId: string,
    updates: { capacity?: number; type?: SpaceType; status?: RoomStatus }
  ) => void;

  // Filters
  activeFilterBuilding: string;
  setActiveFilterBuilding: (bldg: string) => void;
  activeFilterStatus: string;
  setActiveFilterStatus: (status: string) => void;
  activeFilterType: string;
  setActiveFilterType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Timetable & Group State
  timetable: TimetableEntry[];
  selectedGroup: StudentGroup;
  setSelectedGroup: (group: StudentGroup) => void;
  simulatedDay: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  setSimulatedDay: (day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri') => void;
  simulatedHour: number; // e.g. 10.5 for 10:30 AM
  simulatedTimeLabel: string;
  setSimulatedTime: (hour: number, label: string) => void;
  isTimetableSyncing: boolean;
  simulateTimetableUpload: () => void;

  // Best Room Suggestion
  bestRoomCriteria: BestRoomCriteria;
  setBestRoomCriteria: React.Dispatch<React.SetStateAction<BestRoomCriteria>>;
  recommendedRoom: Room | undefined;
  calculateRecommendedRoom: (criteria: BestRoomCriteria) => Room | undefined;

  // Status History & Audit
  history: StatusHistoryItem[];
  historyFilterBuilding: string;
  setHistoryFilterBuilding: (bldg: string) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: number | string) => void;

  // Feedback UI
  toast: { msg: string; icon?: string } | null;
  showToast: (msg: string, icon?: string) => void;
  dismissToast: () => void;
  liveBanner: string | null;
  dismissLiveBanner: () => void;

  // Stats Calculator
  getBuildingStats: (bldg: string) => {
    total: number;
    vacant: number;
    occupied: number;
    reserved: number;
    noInfo: number;
  };
}

/**
 * Normalizes user role string to hierarchy AuthorityLevel:
 * ADMIN > FACULTY > STUDENT
 */
export function normalizeRoleToAuthority(role?: string): AuthorityLevel {
  const r = (role || '').toUpperCase();
  if (r.includes('ADMIN')) return 'ADMIN';
  if (r.includes('FACULTY') || r.includes('TEACHER')) return 'FACULTY';
  return 'STUDENT';
}

/**
 * Checks whether a user with given role can override/update a room with target authority.
 * Room permission hierarchy:
 * - Student booking/status → can be changed by Faculty or Admin (or Student if Student-controlled).
 * - Faculty booking/status → can be changed ONLY by Admin.
 * - Admin booking/status → can be changed ONLY by Admin.
 */
export function canUserOverrideRoom(
  userRole: UserRole | string | undefined,
  roomAuthority?: AuthorityLevel
): { allowed: boolean; reason?: string; isOverride: boolean } {
  const userAuth = normalizeRoleToAuthority(userRole);
  const targetAuth: AuthorityLevel = roomAuthority || 'STUDENT';

  // ADMIN can override/change any room status or booking
  if (userAuth === 'ADMIN') {
    return {
      allowed: true,
      isOverride: targetAuth !== 'ADMIN',
    };
  }

  // Admin booking/status → can be changed ONLY by Admin
  if (targetAuth === 'ADMIN') {
    return {
      allowed: false,
      reason: 'This room status is controlled by Admin (can only be changed by Admin).',
      isOverride: false,
    };
  }

  // Faculty booking/status → can be changed ONLY by Admin
  if (targetAuth === 'FACULTY') {
    return {
      allowed: false,
      reason: 'This room status is controlled by Faculty (can only be changed by Admin).',
      isOverride: false,
    };
  }

  // Student booking/status → can be changed by Faculty or Admin (or Student if Student-controlled)
  if (targetAuth === 'STUDENT') {
    if (userAuth === 'FACULTY') {
      return {
        allowed: true,
        isOverride: true,
      };
    }
    if (userAuth === 'STUDENT') {
      return {
        allowed: true,
        isOverride: false,
      };
    }
  }

  return {
    allowed: false,
    reason: 'Permission denied.',
    isOverride: false,
  };
}

/**
 * Synchronizes history entries with rooms list without deduplicating or erasing past events.
 * Preserves complete chronological history of overrides and updates.
 */
export function syncHistoryWithRooms(
  roomsList: Room[],
  rawHistory: StatusHistoryItem[]
): StatusHistoryItem[] {
  const roomMap = new Map<string, Room>();
  roomsList.forEach((r) => {
    const cleanId = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    roomMap.set(cleanId, r);
    if (r.roomNumber) {
      roomMap.set(r.roomNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(), r);
    }
  });

  // Preserve all history items with normalized fields
  const synced: StatusHistoryItem[] = (rawHistory || []).map((item) => {
    const cleanRoomKey = item.room ? item.room.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : '';
    const matchedRoom = roomMap.get(cleanRoomKey) ||
      (item.roomNumber ? roomMap.get(item.roomNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()) : undefined);

    let authLevel: AuthorityLevel;
    if (item.updatedRole) {
      authLevel = normalizeRoleToAuthority(item.updatedRole);
    } else if (item.authorityLevel) {
      authLevel = normalizeRoleToAuthority(item.authorityLevel);
    } else if (item.source === 'ADMIN OVERRIDE') {
      authLevel = 'ADMIN';
    } else if (item.source === 'FACULTY OVERRIDE') {
      authLevel = 'FACULTY';
    } else if (item.source === 'STUDENT') {
      authLevel = 'STUDENT';
    } else if (matchedRoom?.statusAuthority) {
      authLevel = normalizeRoleToAuthority(matchedRoom.statusAuthority);
    } else if (matchedRoom?.updatedRole) {
      authLevel = normalizeRoleToAuthority(matchedRoom.updatedRole);
    } else if (item.updatedBy || item.by) {
      const byStr = (item.updatedBy || item.by || '').toUpperCase();
      if (byStr.includes('ADMIN') || byStr.includes('FACILITY') || byStr.includes('OPS')) authLevel = 'ADMIN';
      else if (byStr.includes('FACULTY') || byStr.includes('PROF') || byStr.includes('TEACHER') || byStr.includes('DR.')) authLevel = 'FACULTY';
      else authLevel = 'STUDENT';
    } else {
      authLevel = 'STUDENT';
    }

    return {
      ...item,
      room: item.room || matchedRoom?.id || item.roomNumber || '',
      roomNumber: item.roomNumber || matchedRoom?.roomNumber || item.room || '',
      authorityLevel: authLevel,
      updatedRole: authLevel,
    };
  });

  // Ensure every room in roomsList has at least one baseline entry if history was completely empty for that room
  const historyRoomKeys = new Set(synced.map(h => (h.room || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()));
  for (const r of roomsList) {
    const cleanRoomKey = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!historyRoomKeys.has(cleanRoomKey)) {
      historyRoomKeys.add(cleanRoomKey);
      synced.push({
        id: Date.now() + synced.length,
        roomNumber: r.roomNumber || r.id,
        room: r.id,
        previousStatus: r.status === 'VACANT' ? 'OCCUPIED' : 'VACANT',
        newStatus: r.status,
        from: r.status === 'VACANT' ? 'OCCUPIED' : 'VACANT',
        to: r.status,
        updatedBy: r.updatedBy || 'Campus Space Ops',
        by: r.updatedBy || 'Campus Space Ops',
        updatedRole: r.updatedRole || r.statusAuthority || 'STUDENT',
        authorityLevel: r.statusAuthority || 'STUDENT',
        timestamp: r.updatedAt || '09:00 AM',
        time: r.updatedAt || '09:00 AM',
        source: (r.statusAuthority === 'ADMIN' ? 'ADMIN OVERRIDE' : 'MANUAL') as any,
        note: `Current status verification for ${r.id}`,
      });
    }
  }

  return synced;
}

const SpotFreeContext = createContext<SpotFreeContextType | undefined>(undefined);

export function SpotFreeProvider({ children }: { children: React.ReactNode }) {
  // Navigation & Role
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_PROFILES.student);
  const currentRole: UserRole = currentUser.role;
  const [currentView, setCurrentView] = useState<ViewScreen>('login');
  const [navHistory, setNavHistory] = useState<ViewScreen[]>([]);

  // Centralized Room State
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('CB501');

  // Filters
  const [activeFilterBuilding, setActiveFilterBuilding] = useState<string>('All');
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>('All');
  const [activeFilterType, setActiveFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Timetable State (Strictly untouched)
  const [timetable] = useState<TimetableEntry[]>(HIT_TIMETABLE);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroup>('Group 1');
  const [simulatedDay, setSimulatedDay] = useState<'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri'>('Mon');
  const [simulatedHour, setSimulatedHour] = useState<number>(10.5); // 10:30 AM active
  const [simulatedTimeLabel, setSimulatedTimeLabel] = useState<string>('10:30 AM');
  const [isTimetableSyncing, setIsTimetableSyncing] = useState<boolean>(false);

  // Best Room Recommendation
  const [bestRoomCriteria, setBestRoomCriteria] = useState<BestRoomCriteria>({
    purpose: 'Group Study',
    peopleCount: 6,
    preferredBuilding: 'CME',
    date: 'Today, Oct 24',
    startTime: '11:30 AM',
    duration: '1 Hour',
    amenities: ['Air Conditioning', 'Whiteboard'],
  });
  const [recommendedRoomId, setRecommendedRoomId] = useState<string>('CB501');

  // History & Notifications
  const [history, setHistory] = useState<StatusHistoryItem[]>(INITIAL_HISTORY);
  const [historyFilterBuilding, setHistoryFilterBuilding] = useState<string>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Toasts and Banners
  const [toast, setToast] = useState<{ msg: string; icon?: string } | null>(null);
  const [liveBanner, setLiveBanner] = useState<string | null>(null);

  // Hydration from localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let effectiveRooms = INITIAL_ROOMS;
      const savedRooms = localStorage.getItem('spotfree_rooms');
      if (savedRooms) {
        const parsed = JSON.parse(savedRooms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const parsedMap = new Map<string, any>();
          parsed.forEach((pr: any) => {
            if (pr && pr.id) {
              parsedMap.set(pr.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase(), pr);
            }
          });

          // Retain INITIAL_ROOMS with the 5 demonstration rooms at the top
          effectiveRooms = INITIAL_ROOMS.map((ir) => {
            const cleanId = ir.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const pr = parsedMap.get(cleanId);
            if (!pr) return ir;
            return {
              ...ir,
              ...pr,
              id: ir.id,
              roomNumber: ir.roomNumber,
              building: ir.building,
              floor: ir.floor,
              type: pr.type || ir.type,
              capacity: pr.capacity || ir.capacity,
              status: pr.status || ir.status,
              qrId: ir.qrId,
              statusAuthority: pr.statusAuthority || ir.statusAuthority || 'STUDENT',
              updatedRole: pr.updatedRole || ir.updatedRole || 'STUDENT',
              updatedBy: pr.updatedBy || ir.updatedBy || 'Campus Member',
              updatedAt: pr.updatedAt || ir.updatedAt || '09:00 AM',
              reservedStart: pr.reservedStart !== undefined ? pr.reservedStart : (ir.reservedStart || null),
              reservedEnd: pr.reservedEnd !== undefined ? pr.reservedEnd : (ir.reservedEnd || null),
            };
          });
          setRooms(effectiveRooms);
        }
      }

      let effectiveHistory = INITIAL_HISTORY;
      const savedHistory = localStorage.getItem('spotfree_history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          effectiveHistory = parsed;
        }
      }

      // Reconcile and synchronize history with rooms as single source of truth
      const synchronizedHistory = syncHistoryWithRooms(effectiveRooms, effectiveHistory);
      setHistory(synchronizedHistory);

      const savedUser = localStorage.getItem('spotfree_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.email) {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.warn('Error hydrating SpotFree data:', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync state changes to localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem('spotfree_rooms', JSON.stringify(rooms));
    } catch (e) {}
  }, [rooms, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem('spotfree_history', JSON.stringify(history));
    } catch (e) {}
  }, [history, isHydrated]);

  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;
    try {
      localStorage.setItem('spotfree_current_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser, isHydrated]);

  // Toast timeout reference for reliable single-timer management
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToast(null);
  }, []);

  // Single unified dark green Toast popup handler
  const showToast = useCallback((msg: string, icon: string = 'check_circle') => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({ msg, icon });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      toastTimeoutRef.current = null;
    }, 3500);
  }, []);

  // Navigation handlers with strict role-based access
  const navigate = useCallback((view: ViewScreen, pushHistory: boolean = true) => {
    // Role protection guards:
    const roleNormalized = (currentUser?.role || currentRole || 'student').toLowerCase();
    if ((view === 'admin-dashboard' || view === 'manage-rooms') && roleNormalized !== 'admin') {
      showToast('Restricted: Admin access only', 'lock');
      const fallbackView: ViewScreen = roleNormalized === 'faculty' ? 'faculty-dashboard' : 'student-dashboard';
      setCurrentView(fallbackView);
      return;
    }

    if (pushHistory) {
      setNavHistory(prev => [...prev, currentView]);
    }
    setLiveBanner(null);
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentRole, currentUser?.role, currentView, showToast]);

  const goBack = useCallback(() => {
    setNavHistory(prev => {
      const roleNormalized = (currentUser?.role || currentRole || 'student').toLowerCase();
      setLiveBanner(null);
      if (prev.length > 0) {
        const nextHistory = [...prev];
        const last = nextHistory.pop()!;
        if ((last === 'admin-dashboard' || last === 'manage-rooms') && roleNormalized !== 'admin') {
          setCurrentView(roleNormalized === 'faculty' ? 'faculty-dashboard' : 'student-dashboard');
          return nextHistory;
        }
        setCurrentView(last);
        return nextHistory;
      }
      // Default fallbacks based on role
      if (roleNormalized === 'faculty') setCurrentView('faculty-dashboard');
      else if (roleNormalized === 'admin') setCurrentView('admin-dashboard');
      else setCurrentView('student-dashboard');
      return [];
    });
  }, [currentRole, currentUser?.role]);

  const setRole = useCallback((role: UserRole) => {
    const roleKey = role.toLowerCase();
    const base = INITIAL_PROFILES[roleKey] || INITIAL_PROFILES.student;
    setCurrentUser(base);
    setNavHistory([]);
  }, []);

  const loginUser = useCallback((email: string, role?: UserRole, name?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let savedUsers: UserProfile[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('spotfree_registered_users');
        if (raw) savedUsers = JSON.parse(raw);
      } catch (e) {
        // ignore
      }
    }

    // 1. Check if user is in registered mock users
    const matchedRegistered = savedUsers.find(u => u.email.toLowerCase() === cleanEmail);
    let profile: UserProfile;

    if (matchedRegistered) {
      profile = matchedRegistered;
    } else {
      // 2. Check centralized mock users
      const mockMatch = findMockUserByEmail(cleanEmail);
      if (mockMatch) {
        profile = {
          name: mockMatch.name,
          id: mockMatch.id,
          dept: mockMatch.dept || 'Heritage Institute of Technology',
          roleLabel:
            mockMatch.role === 'Student'
              ? 'Student Member'
              : mockMatch.role === 'Faculty'
              ? 'Faculty Member'
              : 'Facility Administrator',
          email: mockMatch.email,
          avatar: mockMatch.avatar || mockMatch.name.slice(0, 2).toUpperCase(),
          role: mockMatch.role,
          rollNumber: mockMatch.rollNumber,
          branch: mockMatch.branch,
          year: mockMatch.year,
          semester: mockMatch.semester,
          group: mockMatch.group,
        };
      } else {
        // 3. Fallback based on requested role
        const roleKey = (role || 'student').toLowerCase();
        const base = INITIAL_PROFILES[roleKey] || INITIAL_PROFILES.student;
        profile = {
          ...base,
          email: cleanEmail || base.email,
          name: name || base.name,
          role: base.role,
        };
      }
    }

    setCurrentUser(profile);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spotfree_current_user', JSON.stringify(profile));
      } catch (e) {}
    }
    setNavHistory([]);

    const userRoleLower = profile.role.toLowerCase();
    if (userRoleLower === 'student') setCurrentView('student-dashboard');
    else if (userRoleLower === 'faculty') setCurrentView('faculty-dashboard');
    else setCurrentView('admin-dashboard');

    showToast(`Welcome back, ${profile.name}!`);
  }, [showToast]);

  const registerUser = useCallback((newUser: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
    rollNumber?: string;
    branch?: string;
    year?: string;
    semester?: string;
    group?: string;
  }) => {
    let savedUsers: UserProfile[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('spotfree_registered_users');
        if (raw) savedUsers = JSON.parse(raw);
      } catch (e) {
        // ignore
      }
    }

    const cleanEmail = newUser.email.trim().toLowerCase();
    if (
      savedUsers.some(u => u.email.toLowerCase() === cleanEmail) ||
      MOCK_USERS.some(u => u.email.toLowerCase() === cleanEmail)
    ) {
      return { success: false, error: 'An account with this email already exists.' };
    }

    const roleNormalized = (newUser.role.charAt(0).toUpperCase() + newUser.role.slice(1).toLowerCase()) as 'Student' | 'Faculty' | 'Admin';

    const created: UserProfile = {
      name: newUser.name.trim(),
      email: cleanEmail,
      role: roleNormalized,
      id: newUser.rollNumber ? newUser.rollNumber.trim() : `HIT-${roleNormalized.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      rollNumber: newUser.rollNumber?.trim(),
      branch: newUser.branch?.trim(),
      year: newUser.year?.trim(),
      semester: newUser.semester?.trim(),
      group: newUser.group?.trim(),
      dept: newUser.branch
        ? `Dept of ${newUser.branch}`
        : roleNormalized === 'Admin'
        ? 'Campus Operations & Space Planning'
        : 'Department of Computer Science',
      roleLabel:
        roleNormalized === 'Student'
          ? 'Student Member'
          : roleNormalized === 'Faculty'
          ? 'Faculty Member'
          : 'Facility Administrator',
      avatar: newUser.name.trim().slice(0, 2).toUpperCase() || 'U',
      password: newUser.password,
    };

    savedUsers.push(created);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('spotfree_registered_users', JSON.stringify(savedUsers));
      } catch (e) {
        // ignore
      }
    }

    showToast(`Account created for ${created.name}!`, 'check_circle');
    return { success: true, user: created };
  }, [showToast]);

  const logoutUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('spotfree_current_user');
      } catch (e) {}
    }
    setCurrentView('login');
    setNavHistory([]);
    showToast('Logged out of SpotFree', 'logout');
  }, [showToast]);

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      // Strictly prevent modifying email or role
      const updated: UserProfile = {
        ...prev,
        ...updates,
        email: prev.email,
        role: prev.role,
      };

      // Recompute avatar if name changed
      if (updates.name && updates.name.trim()) {
        const parts = updates.name.trim().split(/\s+/);
        const initials = parts.length > 1
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : updates.name.trim().slice(0, 2).toUpperCase();
        updated.avatar = initials;
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('spotfree_current_user', JSON.stringify(updated));

          // Also update in registered users list if present
          const raw = localStorage.getItem('spotfree_registered_users');
          if (raw) {
            const registeredUsers: UserProfile[] = JSON.parse(raw);
            const index = registeredUsers.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
            if (index !== -1) {
              registeredUsers[index] = { ...registeredUsers[index], ...updated };
              localStorage.setItem('spotfree_registered_users', JSON.stringify(registeredUsers));
            }
          }
        } catch (e) {
          console.warn('Error saving updated profile:', e);
        }
      }
      return updated;
    });

    showToast('Profile updated successfully!', 'check_circle');
  }, [showToast]);

  const changeUserPassword = useCallback((currentPassword: string, newPassword: string): { success: boolean; error?: string } => {
    const existingPassword = currentUser.password || 'password123';
    if (currentPassword !== existingPassword) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    setCurrentUser(prev => {
      const updated: UserProfile = {
        ...prev,
        password: newPassword,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('spotfree_current_user', JSON.stringify(updated));

          // Also update in registered users
          const raw = localStorage.getItem('spotfree_registered_users');
          let registeredUsers: UserProfile[] = [];
          if (raw) registeredUsers = JSON.parse(raw);
          const index = registeredUsers.findIndex(u => u.email.toLowerCase() === prev.email.toLowerCase());
          if (index !== -1) {
            registeredUsers[index].password = newPassword;
          } else {
            registeredUsers.push(updated);
          }
          localStorage.setItem('spotfree_registered_users', JSON.stringify(registeredUsers));
        } catch (e) {
          console.warn('Error saving new password:', e);
        }
      }
      return updated;
    });

    showToast('Password changed successfully!', 'lock_reset');
    return { success: true };
  }, [currentUser.password, showToast]);

  const bannerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dismissLiveBanner = useCallback(() => {
    dismissToast();
    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current);
      bannerTimeoutRef.current = null;
    }
    setLiveBanner(null);
  }, [dismissToast]);

  const triggerLiveBanner = useCallback((msg: string) => {
    // Legacy broadcast handler: route directly to single dark green toast
    showToast(msg);
  }, [showToast]);

  // Update room status mutation with role-based authority hierarchy (ONE SOURCE OF TRUTH)
  const updateRoomStatus = useCallback((
    roomId: string,
    newStatus: RoomStatus,
    note?: string,
    source?: 'QR' | 'MANUAL' | 'TIMETABLE' | 'STUDENT' | 'FACULTY OVERRIDE' | 'ADMIN OVERRIDE' | 'BOOKING',
    reservedUntil?: string | null,
    startTime?: string | null,
    endTime?: string | null
  ): { success: boolean; error?: string } => {
    // 1. Resilient room lookup matching exact ID, clean alphanumeric ID, or clean roomNumber
    const cleanKey = (roomId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const targetRoom = rooms.find(r => {
      const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rNumClean = (r.roomNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return r.id === roomId || rIdClean === cleanKey || (rNumClean && rNumClean === cleanKey);
    });

    if (!targetRoom) {
      showToast(`Room ${roomId} not found`, 'error');
      return { success: false, error: 'Room not found' };
    }

    // 2. Room authority calculation based on actual state fields: statusAuthority, updatedRole
    const roomAuthority: AuthorityLevel = targetRoom.statusAuthority
      ? normalizeRoleToAuthority(targetRoom.statusAuthority)
      : targetRoom.updatedRole
      ? normalizeRoleToAuthority(targetRoom.updatedRole)
      : 'STUDENT';

    // 3. Role-based override permissions hierarchy.
    // IMPORTANT: When source is explicitly 'FACULTY OVERRIDE' or 'ADMIN OVERRIDE',
    // the caller (History UI) has already verified the history entry is overridable
    // via canOverrideItem(). The room's current statusAuthority may be stale/unrelated
    // (e.g. ADMIN from a previous action on the same room), so we must NOT block
    // a Faculty override of a Student history entry based on the room's authority.
    const isExplicitOverride = source === 'FACULTY OVERRIDE' || source === 'ADMIN OVERRIDE';
    // Status override hierarchy applies when overriding active non-vacant rooms.
    // If the room is currently VACANT, any user can book/update it regardless of prior authority.
    if (!isExplicitOverride && targetRoom.status !== 'VACANT') {
      const authCheck = canUserOverrideRoom(currentUser.role || currentRole, roomAuthority);
      if (!authCheck.allowed) {
        showToast(authCheck.reason || 'Unauthorized to update room status', 'lock');
        return { success: false, error: authCheck.reason };
      }
    }

    const userAuthority = normalizeRoleToAuthority(currentUser.role || currentRole);
    let finalSource: StatusHistoryItem['source'] = source || 'MANUAL';
    if (userAuthority === 'ADMIN') {
      finalSource = 'ADMIN OVERRIDE';
    } else if (userAuthority === 'FACULTY') {
      if (roomAuthority === 'STUDENT' || source === 'FACULTY OVERRIDE') {
        finalSource = 'FACULTY OVERRIDE';
      } else {
        finalSource = source === 'QR' ? 'QR' : 'MANUAL';
      }
    } else {
      // STUDENT
      finalSource = source === 'QR' ? 'QR' : 'STUDENT';
    }

    const oldStatus = targetRoom.status;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userStr = currentUser.name || (userAuthority === 'FACULTY' ? 'Faculty Member' : userAuthority === 'ADMIN' ? 'Facility Administrator' : 'Student Member');

    const effectiveReservedUntil = endTime || reservedUntil || (newStatus === 'RESERVED' ? '02:30 PM' : null);

    let timeText = targetRoom.timeText;
    if (newStatus === 'VACANT') {
      timeText = userAuthority === 'FACULTY'
        ? 'Available for immediate study / session (Faculty Verified)'
        : userAuthority === 'ADMIN'
        ? 'Available for immediate study / session (Admin Override)'
        : 'Available for immediate study / session';
    } else if (newStatus === 'OCCUPIED') {
      timeText = startTime && endTime
        ? `Occupied: ${startTime} – ${endTime}${note ? ` • ${note}` : ''}`
        : `Occupied in active session${note ? ` • ${note}` : ''}`;
    } else if (newStatus === 'RESERVED') {
      timeText = startTime && endTime
        ? `Reserved: ${startTime} – ${endTime}${note ? ` • ${note}` : ''}`
        : `Reserved${effectiveReservedUntil ? ` until ${effectiveReservedUntil}` : ''}${note ? ` • ${note}` : ' for upcoming session'}`;
    }

    const newHistoryItem: StatusHistoryItem = {
      id: Date.now(),
      roomNumber: targetRoom.roomNumber || targetRoom.id,
      previousStatus: oldStatus,
      newStatus: newStatus,
      updatedBy: userStr,
      updatedRole: userAuthority,
      authorityLevel: userAuthority,
      timestamp: nowTimeStr,
      time: 'Just now',
      source: finalSource,
      note: note || (finalSource === 'FACULTY OVERRIDE' ? 'Faculty status override' : finalSource === 'ADMIN OVERRIDE' ? 'Admin status override' : finalSource === 'QR' ? 'Verified door plaque scan' : `${userAuthority} status update`),
      room: targetRoom.id,
      from: oldStatus,
      to: newStatus,
      by: userStr,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    };

    // Prepend to history without deleting any previous events (preserves original Student history entry)
    setHistory(prevHist => [newHistoryItem, ...prevHist]);

    // Update centralized room state everywhere
    setRooms(prevRooms =>
      prevRooms.map(r => {
        const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (r.id === targetRoom.id || rIdClean === cleanKey) {
          return {
            ...r,
            status: newStatus,
            statusAuthority: userAuthority,
            updatedBy: userStr,
            updatedRole: userAuthority,
            updatedAt: nowTimeStr,
            timeText,
            availableUntil: newStatus === 'VACANT' ? 'Open' : r.availableUntil,
            reservedStart: newStatus === 'RESERVED' ? (startTime || r.reservedStart || null) : null,
            reservedEnd: newStatus === 'RESERVED' ? (endTime || effectiveReservedUntil || r.reservedEnd || null) : null,
            reservedUntil: newStatus === 'RESERVED' ? effectiveReservedUntil : null,
          };
        }
        return r;
      })
    );

    const notifTitle =
      finalSource === 'FACULTY OVERRIDE'
        ? `Faculty Override: ${newStatus}`
        : finalSource === 'ADMIN OVERRIDE'
        ? `Admin Override: ${newStatus}`
        : newStatus === 'VACANT'
        ? 'Room became vacant'
        : newStatus === 'OCCUPIED'
        ? 'Room became occupied'
        : newStatus === 'RESERVED'
        ? 'Room reserved'
        : 'Room status updated';

    const newNotif: NotificationItem = {
      id: Date.now(),
      title: notifTitle,
      desc: `Room ${targetRoom.id} is now ${newStatus} (${userStr})`,
      time: 'Just now',
      unread: true,
      type: newStatus === 'RESERVED' ? 'reservation' : 'status',
    };
    setNotifications(prevNotifs => [newNotif, ...prevNotifs]);

    if (finalSource === 'FACULTY OVERRIDE') {
      showToast(`Status overridden to ${newStatus} by Faculty`, 'upgrade');
    } else if (finalSource === 'ADMIN OVERRIDE') {
      showToast(`Room ${targetRoom.id} status overridden by Admin`, 'shield_person');
    } else {
      showToast(`Room ${targetRoom.id} updated to ${newStatus}`);
    }
    return { success: true };
  }, [rooms, currentUser, currentRole, showToast]);

  // Book a vacant room directly from History or any view
  const bookVacantRoom = useCallback((
    roomId: string,
    date: string,
    startTime: string,
    duration: string
  ): boolean => {
    const cleanKey = (roomId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const target = rooms.find(r => {
      const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rNumClean = (r.roomNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return r.id === roomId || rIdClean === cleanKey || (rNumClean && rNumClean === cleanKey);
    });

    if (!target || target.status !== 'VACANT') {
      showToast('Selected room is no longer vacant', 'error');
      return false;
    }

    // Booking eligibility rule:
    // A room's booking availability depends ONLY on its CURRENT STATUS.
    // If room.status === 'VACANT', then ANY user (Student, Faculty, Admin) can book it,
    // regardless of who last updated it, currentAuthority, updatedRole, previous owner,
    // previous booking owner, or override source.
    const userAuthority = normalizeRoleToAuthority(currentUser.role || currentRole);
    const userStr = currentUser.name || (userAuthority === 'FACULTY' ? 'Faculty Member' : userAuthority === 'ADMIN' ? 'Facility Administrator' : 'Student Member');
    const bookingNote = `Booked for ${date} at ${startTime} (${duration})`;
    const reservedUntilText = startTime ? `${startTime} (+${duration})` : '02:30 PM';
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newHistoryItem: StatusHistoryItem = {
      id: Date.now(),
      roomNumber: target.roomNumber || target.id,
      previousStatus: 'VACANT',
      newStatus: 'RESERVED',
      updatedBy: userStr,
      updatedRole: userAuthority,
      authorityLevel: userAuthority,
      timestamp: nowTimeStr,
      time: 'Just now',
      source: 'BOOKING',
      note: bookingNote,
      room: target.id,
      from: 'VACANT',
      to: 'RESERVED',
      by: userStr,
    };

    // Prepend to history without deleting any previous events
    setHistory(prevHist => [newHistoryItem, ...prevHist]);

    const newNotif: NotificationItem = {
      id: Date.now(),
      title: 'Room Reserved',
      desc: `Room ${target.id} reserved by ${userStr} (${bookingNote})`,
      time: 'Just now',
      unread: true,
      type: 'reservation',
    };
    setNotifications(prevNotifs => [newNotif, ...prevNotifs]);

    showToast(`Room ${target.id} booked successfully!`);

    setRooms(prevRooms =>
      prevRooms.map(r => {
        const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (r.id === target.id || rIdClean === cleanKey) {
          return {
            ...r,
            status: 'RESERVED' as RoomStatus,
            statusAuthority: userAuthority,
            updatedBy: userStr,
            updatedRole: userAuthority,
            updatedAt: nowTimeStr,
            reservedStart: startTime || null,
            reservedEnd: reservedUntilText,
            timeText: `Reserved: ${bookingNote}`,
            reservedUntil: reservedUntilText,
          };
        }
        return r;
      })
    );

    return true;
  }, [rooms, currentUser, currentRole, showToast]);

  // Admin status override: override any room's status with explicit ADMIN OVERRIDE source
  const adminOverrideStatus = useCallback((
    roomId: string,
    newStatus: RoomStatus,
    reservedUntil?: string | null,
    note?: string,
    startTime?: string,
    endTime?: string
  ) => {
    const cleanKey = (roomId || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const target = rooms.find(r => {
      const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const rNumClean = (r.roomNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      return r.id === roomId || rIdClean === cleanKey || (rNumClean && rNumClean === cleanKey);
    });
    if (!target) return;

    const oldStatus = target.status;
    const adminName = currentUser.name ? `${currentUser.name} (Admin)` : 'Facility Administrator (Admin)';
    let timeText = target.timeText;
    if (newStatus === 'VACANT') {
      timeText = 'Available for immediate study / session (Admin Override)';
    } else if (newStatus === 'OCCUPIED') {
      timeText = startTime && endTime
        ? `Occupied: ${startTime} – ${endTime} (Admin Override)`
        : `Occupied in active session (Admin Override)${note ? ` • ${note}` : ''}`;
    } else if (newStatus === 'RESERVED') {
      timeText = startTime && endTime
        ? `Reserved: ${startTime} – ${endTime} (Admin Override)`
        : `Reserved${reservedUntil ? ` until ${reservedUntil}` : ''} (Admin Override)${note ? ` • ${note}` : ''}`;
    }

    const overrideNote = note || (
      startTime && endTime
        ? `${newStatus === 'RESERVED' ? 'Reserved' : 'Occupied'} ${startTime} – ${endTime} • Admin Override`
        : newStatus === 'RESERVED' && reservedUntil
        ? `Reserved until ${reservedUntil} • Admin Override`
        : 'Administrative room status override'
    );

    const effectiveReservedUntil = endTime || reservedUntil || (newStatus === 'RESERVED' ? '02:30 PM' : null);
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newHistoryItem: StatusHistoryItem = {
      id: Date.now(),
      roomNumber: target.roomNumber || target.id,
      previousStatus: oldStatus,
      newStatus: newStatus,
      updatedBy: adminName,
      updatedRole: 'ADMIN',
      authorityLevel: 'ADMIN',
      timestamp: nowTimeStr,
      time: 'Just now',
      source: 'ADMIN OVERRIDE',
      note: overrideNote,
      room: target.id,
      from: oldStatus,
      to: newStatus,
      by: adminName,
      startTime: startTime,
      endTime: endTime,
    };

    // Prepend to history without deleting any previous events
    setHistory(prevHist => [newHistoryItem, ...prevHist]);

    const notifTitle = `Admin Override: ${newStatus}`;
    const newNotif: NotificationItem = {
      id: Date.now(),
      title: notifTitle,
      desc: startTime && endTime
        ? `Room ${target.id} set to ${newStatus} (${startTime} – ${endTime}) by Admin`
        : `Room ${target.id} changed from ${oldStatus} to ${newStatus} by Admin`,
      time: 'Just now',
      unread: true,
      type: newStatus === 'RESERVED' ? 'reservation' : 'status',
    };
    setNotifications(prevNotifs => [newNotif, ...prevNotifs]);

    showToast(`Status overridden to ${newStatus} by Admin`, 'shield_person');

    setRooms(prevRooms =>
      prevRooms.map(r => {
        const rIdClean = r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (r.id === target.id || rIdClean === cleanKey) {
          return {
            ...r,
            status: newStatus,
            statusAuthority: 'ADMIN',
            updatedBy: adminName,
            updatedRole: 'ADMIN',
            updatedAt: nowTimeStr,
            reservedStart: startTime || null,
            reservedEnd: effectiveReservedUntil,
            timeText,
            availableUntil: newStatus === 'VACANT' ? 'Open' : r.availableUntil,
            reservedUntil: newStatus === 'RESERVED' ? effectiveReservedUntil : null,
          };
        }
        return r;
      })
    );
  }, [rooms, currentUser, showToast]);

  // Helper to parse time strings like "02:30 PM" or "11:00 AM (+1 Hour)" into decimal hour (e.g. 14.5)
  const parseTimeToDecimalHour = useCallback((timeStr?: string | null): number | null => {
    if (!timeStr) return null;
    const durMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)\s*\(\+([0-9.]+)\s*Hour/i);
    if (durMatch) {
      let h = parseInt(durMatch[1], 10);
      const m = parseInt(durMatch[2], 10);
      const mer = durMatch[3].toUpperCase();
      const dur = parseFloat(durMatch[4]);
      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return h + m / 60 + dur;
    }
    const stdMatch = timeStr.match(/(?:until\s+)?(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (stdMatch) {
      let h = parseInt(stdMatch[1], 10);
      const m = parseInt(stdMatch[2], 10);
      const mer = stdMatch[3].toUpperCase();
      if (mer === 'PM' && h < 12) h += 12;
      if (mer === 'AM' && h === 12) h = 0;
      return h + m / 60;
    }
    return null;
  }, []);

  // Monitor reserved rooms: if reservation period has ended, transition back to VACANT
  useEffect(() => {
    setRooms(prevRooms => {
      let hasChange = false;
      const updatedRooms = prevRooms.map(r => {
        if (r.status === 'RESERVED' && r.reservedUntil) {
          const expiryHour = parseTimeToDecimalHour(r.reservedUntil);
          if (expiryHour !== null && simulatedHour >= expiryHour) {
            hasChange = true;
            // Transition back to VACANT
            const expiredHistoryItem: StatusHistoryItem = {
              id: Date.now() + Math.random(),
              roomNumber: r.roomNumber || r.id,
              previousStatus: 'RESERVED',
              newStatus: 'VACANT',
              updatedBy: 'Facility Auto-Scheduler',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              time: 'Just now',
              source: 'MANUAL',
              note: `Reservation duration ended at ${r.reservedUntil} • Room released to VACANT`,
              room: r.id,
              from: 'RESERVED',
              to: 'VACANT',
              by: 'Facility Auto-Scheduler',
            };

            setHistory(prevHist => [expiredHistoryItem, ...prevHist]);

            return {
              ...r,
              status: 'VACANT' as RoomStatus,
              reservedUntil: null,
              timeText: 'Available now (Reservation concluded)',
            };
          }
        }
        return r;
      });

      return hasChange ? updatedRooms : prevRooms;
    });
  }, [simulatedHour, parseTimeToDecimalHour]);

  // Timetable → Room Occupancy Calculation Engine
  useEffect(() => {
    // Determine active classes for current simulated Day, Hour, and Selected Group
    const activeSlots = timetable.filter(slot => {
      const dayMatches = slot.day === simulatedDay;
      const timeMatches = simulatedHour >= slot.startHour && simulatedHour < slot.endHour;
      const groupMatches = slot.group === 'All' || slot.group === selectedGroup;
      return dayMatches && timeMatches && groupMatches;
    });

    if (activeSlots.length > 0) {
      setRooms(prev => {
        return prev.map(room => {
          // Normalize room ID check, e.g. "CME-604" matches "CME604" or "CME-604"
          const matchingSlot = activeSlots.find(s => {
            const sRoomClean = s.room.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const rIdClean = room.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            return sRoomClean === rIdClean;
          });

          // Keep active reservations intact so timetable doesn't overwrite user bookings
          if (matchingSlot && room.status !== 'RESERVED') {
            return {
              ...room,
              status: 'OCCUPIED',
              timeText: `Occupied: ${matchingSlot.subjectName} until ${matchingSlot.endTime}`,
            };
          }
          return room;
        });
      });
    }
  }, [simulatedDay, simulatedHour, selectedGroup, timetable]);

  // Add Room
  const addRoom = useCallback((newRoom: {
    id: string;
    building: CampusBuilding;
    floor: number;
    type: SpaceType;
    capacity: number;
  }) => {
    const cleanId = newRoom.id.trim().toUpperCase();
    const cleanRoomNo = cleanId.replace(/^[A-Z]+\s*[-]?/i, '') || cleanId;
    const cleanQrId = `QR-${cleanId.replace(/[\s-]/g, '')}`;
    const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const created: Room = {
      id: cleanId,
      roomNumber: cleanRoomNo,
      building: newRoom.building,
      floor: newRoom.floor,
      type: newRoom.type as RoomType,
      capacity: newRoom.capacity,
      status: 'VACANT',
      statusAuthority: 'ADMIN',
      updatedBy: currentUser.name || 'Facility Administrator',
      updatedRole: 'ADMIN',
      updatedAt: nowTimeStr,
      reservedStart: null,
      reservedEnd: null,
      availableUntil: '04:00 PM',
      reservedUntil: null,
      qrId: cleanQrId,
      timeText: 'Available now',
      amenities: ['Air Conditioning', 'Whiteboard', 'Power Outlets'],
      timeline: [{ time: 'All Day', text: 'Open Slot', status: 'Active' }],
    };

    setRooms(prev => [created, ...prev]);
    showToast(`Room ${cleanId} registered`);
  }, [currentUser.name, showToast]);

  // Edit Room
  const editRoom = useCallback((
    roomId: string,
    updates: { capacity?: number; type?: SpaceType; status?: RoomStatus }
  ) => {
    const target = rooms.find(r => r.id === roomId);
    if (!target) return;
    if (updates.status !== undefined && updates.status !== target.status) {
      updateRoomStatus(roomId, updates.status, 'Updated via Administration', 'ADMIN OVERRIDE');
    }
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          capacity: updates.capacity !== undefined ? updates.capacity : r.capacity,
          type: updates.type !== undefined ? (updates.type as RoomType) : r.type,
        };
      }
      return r;
    }));
    showToast(`Updated ${roomId}`);
  }, [rooms, showToast, updateRoomStatus]);

  // Simulate Timetable Upload (Untouched)
  const simulateTimetableUpload = useCallback(() => {
    setIsTimetableSyncing(true);
    setTimeout(() => {
      setIsTimetableSyncing(false);
      showToast('Timetable synchronized successfully with HIT portal', 'cloud_done');
    }, 1200);
  }, [showToast]);

  // Calculate Recommended Room based on user requirements from centralized rooms
  const calculateRecommendedRoom = useCallback((crit: BestRoomCriteria): Room | undefined => {
    let candidates = rooms.filter(r => r.status === 'VACANT');
    if (candidates.length === 0) {
      candidates = rooms.filter(r => r.status !== 'OCCUPIED');
    }
    if (candidates.length === 0) {
      candidates = [...rooms];
    }

    if (crit.preferredBuilding && crit.preferredBuilding !== 'Any' && crit.preferredBuilding !== 'any') {
      const bldgMatch = candidates.filter(r => r.building.toUpperCase() === crit.preferredBuilding.toUpperCase());
      if (bldgMatch.length > 0) {
        candidates = bldgMatch;
      }
    }

    // Score based on capacity and suitability
    const sorted = [...candidates].sort((a, b) => {
      const aCanFit = a.capacity >= crit.peopleCount ? 1 : 0;
      const bCanFit = b.capacity >= crit.peopleCount ? 1 : 0;
      if (aCanFit !== bCanFit) return bCanFit - aCanFit;

      const diffA = Math.abs(a.capacity - crit.peopleCount);
      const diffB = Math.abs(b.capacity - crit.peopleCount);
      return diffA - diffB;
    });

    const match = sorted[0] || rooms.find(r => r.status === 'VACANT') || rooms[0];
    if (match) {
      setRecommendedRoomId(match.id);
    }
    return match;
  }, [rooms]);

  // Notifications
  const unreadNotificationCount = useMemo(() => notifications.filter(n => n.unread).length, [notifications]);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    showToast('All notifications marked as read');
  }, [showToast]);

  const markNotificationRead = useCallback((id: number | string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, unread: false } : n)));
  }, []);

  const selectedRoom = useMemo(() => {
    if (!selectedRoomId) return rooms[0];
    const cleanSelected = selectedRoomId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return (
      rooms.find(r => r.id === selectedRoomId) ||
      rooms.find(r => r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanSelected) ||
      rooms.find(r => (r.roomNumber || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanSelected) ||
      rooms[0]
    );
  }, [rooms, selectedRoomId]);

  const recommendedRoom = useMemo(() => {
    if (!recommendedRoomId) return rooms[0];
    const cleanRec = recommendedRoomId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return (
      rooms.find(r => r.id === recommendedRoomId) ||
      rooms.find(r => r.id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() === cleanRec) ||
      rooms[0]
    );
  }, [rooms, recommendedRoomId]);

  // Stats for any building
  const getBuildingStats = useCallback((bldg: string) => {
    const list = bldg === 'All' ? rooms : rooms.filter(r => r.building === bldg);
    return {
      total: list.length,
      vacant: list.filter(r => r.status === 'VACANT').length,
      occupied: list.filter(r => r.status === 'OCCUPIED').length,
      reserved: list.filter(r => r.status === 'RESERVED').length,
      noInfo: list.filter(r => r.status === 'NO INFORMATION').length,
    };
  }, [rooms]);

  const setSimulatedTime = useCallback((hour: number, label: string) => {
    setSimulatedHour(hour);
    setSimulatedTimeLabel(label);
    showToast(`Time simulated to ${label}`);
  }, [showToast]);

  const value = {
    currentRole,
    setRole,
    loginUser,
    registerUser,
    logoutUser,
    currentView,
    navigate,
    goBack,
    currentUser,
    updateUserProfile,
    changeUserPassword,
    canUserOverrideRoom: (roomAuthority?: AuthorityLevel) => canUserOverrideRoom(currentUser.role || currentRole, roomAuthority),
    rooms,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoom,
    updateRoomStatus,
    bookVacantRoom,
    adminOverrideStatus,
    addRoom,
    editRoom,
    activeFilterBuilding,
    setActiveFilterBuilding,
    activeFilterStatus,
    setActiveFilterStatus,
    activeFilterType,
    setActiveFilterType,
    searchQuery,
    setSearchQuery,
    timetable,
    selectedGroup,
    setSelectedGroup,
    simulatedDay,
    setSimulatedDay,
    simulatedHour,
    simulatedTimeLabel,
    setSimulatedTime,
    isTimetableSyncing,
    simulateTimetableUpload,
    bestRoomCriteria,
    setBestRoomCriteria,
    recommendedRoom,
    calculateRecommendedRoom,
    history,
    historyFilterBuilding,
    setHistoryFilterBuilding,
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
    toast,
    showToast,
    dismissToast,
    liveBanner,
    dismissLiveBanner,
    getBuildingStats,
  };

  return <SpotFreeContext.Provider value={value}>{children}</SpotFreeContext.Provider>;
}

export function useSpotFree() {
  const context = useContext(SpotFreeContext);
  if (!context) {
    throw new Error('useSpotFree must be used within a SpotFreeProvider');
  }
  return context;
}
