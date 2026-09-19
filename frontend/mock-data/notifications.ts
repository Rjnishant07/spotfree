import { Notification } from './types';

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    title: 'Room status updated',
    desc: 'Room CME-104 is now VACANT (Reported via Door plaque QR scan)',
    time: '10m ago',
    unread: true,
    type: 'status',
  },
  {
    id: 2,
    title: 'Room became occupied',
    desc: 'Room CME604 is now OCCUPIED for CSEN2101 Data Structures',
    time: '25m ago',
    unread: true,
    type: 'status',
  },
  {
    id: 3,
    title: 'Room became vacant',
    desc: 'Room ICT-205 is now VACANT and open for study',
    time: '45m ago',
    unread: false,
    type: 'status',
  },
  {
    id: 4,
    title: 'Room reserved',
    desc: 'Room CB501 reserved for Academic Session until 12:00 PM',
    time: '1h ago',
    unread: false,
    type: 'reservation',
  },
  {
    id: 5,
    title: 'Room information updated',
    desc: 'Room ICT403 projector & smart display maintenance completed',
    time: '3h ago',
    unread: false,
    type: 'info',
  },
];
