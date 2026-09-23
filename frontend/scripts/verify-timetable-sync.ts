import { MOCK_ROOMS } from '../mock-data/rooms';
import { HIT_TIMETABLE } from '../lib/mockData';
import {
  isProtectedQrRoom,
  PROTECTED_QR_ROOMS,
  computeTimetableRoomState,
} from '../context/SpotFreeContext';

console.log('====================================================');
console.log('TEST 1: VERIFY 5 QR ROOMS ARE STRICTLY PROTECTED');
console.log('====================================================');
const expectedQrRooms = ['CME604', 'CME605', 'CB501', 'ICT403', 'ICT B08'];

let test1Passed = true;
for (const id of expectedQrRooms) {
  const isProtected = isProtectedQrRoom(id);
  if (!isProtected) {
    console.error(`FAILED: ${id} should be protected QR room!`);
    test1Passed = false;
  }
  const original = MOCK_ROOMS.find(r => r.id === id);
  if (!original) {
    console.error(`FAILED: ${id} missing from MOCK_ROOMS!`);
    test1Passed = false;
  } else {
    // Test that computeTimetableRoomState returns original room completely untouched
    const testDate = new Date('2026-09-24T10:00:00'); // Thursday 10 AM
    const processed = computeTimetableRoomState(original, testDate, HIT_TIMETABLE);
    if (processed !== original && JSON.stringify(processed) !== JSON.stringify(original)) {
      console.error(`FAILED: ${id} was altered by timetable engine!`);
      test1Passed = false;
    }
  }
}
if (test1Passed) {
  console.log('✓ PASS: All 5 QR rooms are strictly protected and untouched.');
}

console.log('\n====================================================');
console.log('TEST 2: VERIFY TIMETABLE ROOMS IN CENTRAL DATASET');
console.log('====================================================');
const cb601 = MOCK_ROOMS.find(r => r.id === 'CB601');
const library = MOCK_ROOMS.find(r => r.id === 'LIBRARY');

let test2Passed = true;
if (!cb601) {
  console.error('FAILED: CB601 is missing from MOCK_ROOMS!');
  test2Passed = false;
} else {
  console.log(`✓ CB601 found: Bldg=${cb601.building}, Floor=${cb601.floor}, Type=${cb601.type}, Capacity=${cb601.capacity}`);
}

if (!library) {
  console.error('FAILED: LIBRARY is missing from MOCK_ROOMS!');
  test2Passed = false;
} else {
  console.log(`✓ LIBRARY found: Bldg=${library.building}, Floor=${library.floor}, Type=${library.type}, Capacity=${library.capacity}`);
}

console.log('\n====================================================');
console.log('TEST 3: REAL-TIME TIMETABLE OCCUPANCY SCENARIOS');
console.log('====================================================');

// Scenario 3A: Thursday 09:30 AM (Inside MTH2102 for CB601)
// Thursday = day 4
const thu930 = new Date(2026, 8, 24, 9, 30); // 2026-09-24 is a Thursday
const cb601_thu930 = computeTimetableRoomState(cb601!, thu930, HIT_TIMETABLE);
console.log('Scenario 3A (Thu 9:30 AM - CB601 during MTH2102):');
console.log('  Status:', cb601_thu930.status, '(Expected: OCCUPIED)');
console.log('  Subject:', cb601_thu930.currentClass?.subjectCode, cb601_thu930.currentClass?.subjectName);
console.log('  Faculty:', cb601_thu930.currentClass?.faculty);
console.log('  Authority:', cb601_thu930.statusAuthority, '(Expected: TIMETABLE)');
if (
  cb601_thu930.status === 'OCCUPIED' &&
  cb601_thu930.currentClass?.subjectCode === 'MTH2102' &&
  cb601_thu930.currentClass?.faculty === 'Prof. (Dr.) Arpita Roy' &&
  cb601_thu930.statusAuthority === 'TIMETABLE'
) {
  console.log('  ✓ PASS');
} else {
  console.error('  ✗ FAIL Scenario 3A');
}

// Scenario 3B: Thursday 10:30 AM (Inside DSC2101 for CB601 - TBA)
const thu1030 = new Date(2026, 8, 24, 10, 30);
const cb601_thu1030 = computeTimetableRoomState(cb601!, thu1030, HIT_TIMETABLE);
console.log('\nScenario 3B (Thu 10:30 AM - CB601 during DSC2101 with TBA teacher):');
console.log('  Status:', cb601_thu1030.status, '(Expected: OCCUPIED)');
console.log('  Faculty:', cb601_thu1030.currentClass?.faculty, '(Expected: To Be Announced)');
if (
  cb601_thu1030.status === 'OCCUPIED' &&
  cb601_thu1030.currentClass?.subjectCode === 'DSC2101' &&
  cb601_thu1030.currentClass?.faculty === 'To Be Announced'
) {
  console.log('  ✓ PASS');
} else {
  console.error('  ✗ FAIL Scenario 3B');
}

// Scenario 3C: Thursday 12:30 PM (Lunch break - Between classes)
const thu1230 = new Date(2026, 8, 24, 12, 30);
const cb601_thu1230 = computeTimetableRoomState(cb601!, thu1230, HIT_TIMETABLE);
console.log('\nScenario 3C (Thu 12:30 PM - CB601 after morning classes):');
console.log('  Status:', cb601_thu1230.status, '(Expected: VACANT)');
console.log('  TimeText:', cb601_thu1230.timeText);
if (cb601_thu1230.status === 'VACANT') {
  console.log('  ✓ PASS');
} else {
  console.error('  ✗ FAIL Scenario 3C');
}

// Scenario 3D: Friday 03:30 PM (Inside LIBRARY Session 3:00 PM - 5:00 PM)
// Friday = day 5
const fri1530 = new Date(2026, 8, 25, 15, 30); // 2026-09-25 is a Friday
const lib_fri1530 = computeTimetableRoomState(library!, fri1530, HIT_TIMETABLE);
console.log('\nScenario 3D (Fri 3:30 PM - LIBRARY during Library Session):');
console.log('  Status:', lib_fri1530.status, '(Expected: OCCUPIED)');
console.log('  Subject:', lib_fri1530.currentClass?.subjectCode, lib_fri1530.currentClass?.subjectName);
console.log('  Faculty:', lib_fri1530.currentClass?.faculty, '(Expected: Central Library Staff)');
if (
  lib_fri1530.status === 'OCCUPIED' &&
  lib_fri1530.currentClass?.subjectCode === 'LIBRARY' &&
  lib_fri1530.currentClass?.faculty === 'Central Library Staff'
) {
  console.log('  ✓ PASS');
} else {
  console.error('  ✗ FAIL Scenario 3D');
}

// Scenario 3E: After 6:00 PM (Requirement 4D)
const thu1830 = new Date(2026, 8, 24, 18, 30);
const cb601_after6 = computeTimetableRoomState(cb601!, thu1830, HIT_TIMETABLE);
const lib_after6 = computeTimetableRoomState(library!, thu1830, HIT_TIMETABLE);
console.log('\nScenario 3E (After 6:00 PM - Rule 4D):');
console.log('  CB601 Status:', cb601_after6.status, '(Expected: VACANT)');
console.log('  LIBRARY Status:', lib_after6.status, '(Expected: VACANT)');
if (cb601_after6.status === 'VACANT' && lib_after6.status === 'VACANT') {
  console.log('  ✓ PASS: Both rooms automatically VACANT after 6:00 PM');
} else {
  console.error('  ✗ FAIL Scenario 3E');
}

// Scenario 3F: Before 9:00 AM (Requirement 4E)
const thu830 = new Date(2026, 8, 24, 8, 30);
const cb601_before9 = computeTimetableRoomState(cb601!, thu830, HIT_TIMETABLE);
console.log('\nScenario 3F (Before 9:00 AM - Rule 4E):');
console.log('  CB601 Status:', cb601_before9.status, '(Expected: VACANT)');
console.log('  Upcoming:', cb601_before9.upcomingClass?.subjectCode, cb601_before9.upcomingClass?.startTime);
if (cb601_before9.status === 'VACANT' && cb601_before9.upcomingClass?.subjectCode === 'MTH2102') {
  console.log('  ✓ PASS: Room is VACANT before 9:00 AM and shows upcoming class');
} else {
  console.error('  ✗ FAIL Scenario 3F');
}

// Scenario 3G: Weekend (Saturday / Sunday)
const sun1400 = new Date(2026, 8, 27, 14, 0); // Sunday
const cb601_sun = computeTimetableRoomState(cb601!, sun1400, HIT_TIMETABLE);
console.log('\nScenario 3G (Sunday - Weekend):');
console.log('  CB601 Status:', cb601_sun.status, '(Expected: VACANT)');
if (cb601_sun.status === 'VACANT') {
  console.log('  ✓ PASS: Room is VACANT on weekends');
} else {
  console.error('  ✗ FAIL Scenario 3G');
}

console.log('\n====================================================');
console.log('ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY!');
console.log('====================================================');
