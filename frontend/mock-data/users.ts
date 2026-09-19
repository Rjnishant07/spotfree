import { User } from './types';

export const MOCK_USERS: User[] = [
  {
    id: '2562014',
    name: 'Nishant Ranjan',
    rollNumber: '2562014',
    email: 'nishant.ranjan.ds29@heritageit.edu.in',
    role: 'Student',
    branch: 'CSE (Data Science)',
    year: '2nd Year',
    semester: '1st Semester',
    group: 'Group 1',
    dept: 'Department of Computer Science & Engineering (Data Science)',
    avatar: 'NR',
  },
  {
    id: 'ritwick.banerjee@heritageit.edu',
    name: 'Ritwick Banerjee',
    email: 'ritwick.banerjee@heritageit.edu',
    role: 'Faculty',
    dept: 'Department of Computer Science & Engineering',
    avatar: 'RB',
  },
  {
    id: 'subhajit.datta@heritageit.edu',
    name: 'Subhajit Datta',
    email: 'subhajit.datta@heritageit.edu',
    role: 'Admin',
    dept: 'Campus Operations & Space Planning',
    avatar: 'SD',
  },
];

export const getDefaultMockUser = (role: 'Student' | 'Faculty' | 'Admin'): User => {
  const found = MOCK_USERS.find((u) => u.role.toLowerCase() === role.toLowerCase());
  return found || MOCK_USERS[0];
};

export const findMockUserByEmail = (email: string): User | undefined => {
  const normalized = email.trim().toLowerCase();
  return MOCK_USERS.find((u) => u.email.toLowerCase() === normalized);
};
