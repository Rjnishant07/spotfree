import { MOCK_ROOMS } from '../mock-data/rooms';
import { apply6PMRuleToRooms } from '../context/SpotFreeContext';
import { Room } from '../lib/types';

console.log('====================================================');
console.log('VERIFYING 6:00 PM AUTOMATIC VACANT RULE');
console.log('====================================================\n');

// Create test room set with mixed statuses:
// - QR room that is OCCUPIED
// - QR room that is RESERVED
// - Timetable room that is OCCUPIED
// - Supporting room that is OCCUPIED
const testRooms: Room[] = [
  {
    ...MOCK_ROOMS.find(r => r.id === 'CME604')!,
    status: 'OCCUPIED',
    timeText: 'Active session until 6:30 PM',
  },
  {
    ...MOCK_ROOMS.find(r => r.id === 'ICT B08')!,
    status: 'RESERVED',
    reservedUntil: '07:00 PM',
    timeText: 'Reserved until 07:00 PM',
  },
  {
    ...MOCK_ROOMS.find(r => r.id === 'CB601')!,
    status: 'OCCUPIED',
    currentClass: {
      subjectCode: 'MTH2102',
      subjectName: 'Probability',
      faculty: 'Prof. Arpita Roy',
      startTime: '05:00 PM',
      endTime: '06:30 PM',
      day: 'Thu',
      group: 'All',
      room: 'CB601',
    },
    timeText: 'Occupied until 06:30 PM',
  },
  {
    ...MOCK_ROOMS.find(r => r.id === 'LIBRARY')!,
    status: 'OCCUPIED',
    timeText: 'Library Session',
  },
  ...MOCK_ROOMS.filter(r => !['CME604', 'ICT B08', 'CB601', 'LIBRARY'].includes(r.id)),
];

console.log('Total test rooms:', testRooms.length);

// 1. BEFORE 6:00 PM (e.g. 5:59 PM = 17:59)
console.log('\n--- 1. BEFORE 6:00 PM (17:59) ---');
const before6 = new Date(2026, 8, 24, 17, 59, 0);
const roomsBefore6 = apply6PMRuleToRooms(testRooms, before6);

const occupiedBefore = roomsBefore6.filter(r => r.status === 'OCCUPIED').length;
const reservedBefore = roomsBefore6.filter(r => r.status === 'RESERVED').length;
console.log(`Before 6 PM: Occupied=${occupiedBefore}, Reserved=${reservedBefore}`);
if (occupiedBefore > 0 && reservedBefore > 0) {
  console.log('✓ PASS: Normal room status is preserved before 6:00 PM.');
} else {
  console.error('✗ FAIL: Status was altered before 6:00 PM!');
}

// 2. AT EXACTLY 6:00 PM (18:00:00)
console.log('\n--- 2. AT EXACTLY 6:00 PM (18:00:00) ---');
const at6PM = new Date(2026, 8, 24, 18, 0, 0);
const roomsAt6PM = apply6PMRuleToRooms(testRooms, at6PM);

const nonVacantAt6 = roomsAt6PM.filter(r => r.status !== 'VACANT');
console.log(`At 6:00 PM: Non-vacant rooms = ${nonVacantAt6.length} (Expected: 0)`);
if (nonVacantAt6.length === 0) {
  console.log('✓ PASS: EVERY room is VACANT at 6:00 PM.');
} else {
  console.error(`✗ FAIL: Found ${nonVacantAt6.length} non-vacant rooms at 6:00 PM:`, nonVacantAt6.map(r => r.id));
}

// Check QR rooms at 6 PM
const qrRooms = ['CME604', 'CME605', 'CB501', 'ICT403', 'ICT B08'];
const allQrVacant = qrRooms.every(id => {
  const r = roomsAt6PM.find(room => room.id === id);
  return r && r.status === 'VACANT';
});
console.log('All 5 QR rooms VACANT at 6:00 PM:', allQrVacant ? '✓ PASS' : '✗ FAIL');

// Check Timetable rooms at 6 PM
const ttRooms = ['CB601', 'LIBRARY'];
const allTtVacant = ttRooms.every(id => {
  const r = roomsAt6PM.find(room => room.id === id);
  return r && r.status === 'VACANT' && r.currentClass === null;
});
console.log('All timetable rooms VACANT with active class cleared at 6:00 PM:', allTtVacant ? '✓ PASS' : '✗ FAIL');

// Check timeText and clear of stale data
const cme604At6 = roomsAt6PM.find(r => r.id === 'CME604')!;
console.log('CME604 timeText at 6 PM:', cme604At6.timeText);
console.log('CME604 reservedUntil at 6 PM:', cme604At6.reservedUntil);

// 3. AFTER 6:00 PM (e.g. 6:01 PM, 7:30 PM, 11:59 PM)
console.log('\n--- 3. AFTER 6:00 PM (18:01, 19:30, 23:59) ---');
for (const [hour, min] of [[18, 1], [19, 30], [23, 59]]) {
  const afterTime = new Date(2026, 8, 24, hour, min, 0);
  const roomsAfter = apply6PMRuleToRooms(testRooms, afterTime);
  const nonVacant = roomsAfter.filter(r => r.status !== 'VACANT').length;
  console.log(`At ${hour}:${String(min).padStart(2, '0')}: Non-vacant = ${nonVacant} (Expected: 0) -> ${nonVacant === 0 ? '✓ PASS' : '✗ FAIL'}`);
}

// 4. NEXT DAY BEFORE 6:00 PM (Roll-over test)
console.log('\n--- 4. NEXT DAY (Date Roll-over) ---');
const nextDay10AM = new Date(2026, 8, 25, 10, 0, 0); // Next day at 10:00 AM
const roomsNextDay = apply6PMRuleToRooms(testRooms, nextDay10AM);
const occupiedNextDay = roomsNextDay.filter(r => r.status === 'OCCUPIED').length;
console.log(`Next day at 10:00 AM: Non-vacant/Occupied preserved = ${occupiedNextDay > 0 ? '✓ PASS' : '✗ FAIL'}`);

console.log('\n====================================================');
console.log('6:00 PM REAL-TIME RULE VERIFICATION COMPLETE!');
console.log('====================================================');
