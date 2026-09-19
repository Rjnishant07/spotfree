'use client';

import React from 'react';
import { SpotFreeProvider, useSpotFree } from '@/context/SpotFreeContext';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Toast } from '@/components/FeedbackComponents';

// Screen Components
import { LoginScreen } from '@/components/screens/LoginScreen';
import { SignUpScreen } from '@/components/screens/SignUpScreen';
import { StudentDashboard } from '@/components/screens/StudentDashboard';
import { RoomAvailabilityScreen } from '@/components/screens/RoomAvailabilityScreen';
import { RoomDetailsScreen } from '@/components/screens/RoomDetailsScreen';
import { BestRoomRequirementsScreen } from '@/components/screens/BestRoomRequirementsScreen';
import { RecommendedRoomScreen } from '@/components/screens/RecommendedRoomScreen';
import { ScanRoomQRScreen } from '@/components/screens/ScanRoomQRScreen';
import { EnterRoomNumberScreen } from '@/components/screens/EnterRoomNumberScreen';
import { RoomIdentifiedScreen } from '@/components/screens/RoomIdentifiedScreen';
import { UpdateRoomStatusScreen } from '@/components/screens/UpdateRoomStatusScreen';
import { StatusUpdatedScreen } from '@/components/screens/StatusUpdatedScreen';
import { FacultyDashboard } from '@/components/screens/FacultyDashboard';
import { AdminDashboard } from '@/components/screens/AdminDashboard';
import { ManageRoomsScreen } from '@/components/screens/ManageRoomsScreen';
import { StatusHistoryScreen } from '@/components/screens/StatusHistoryScreen';
import { NotificationsScreen } from '@/components/screens/NotificationsScreen';
import { ProfileScreen } from '@/components/screens/ProfileScreen';
import { MyTimetableScreen } from '@/components/screens/MyTimetableScreen';

function SpotFreeApp() {
  const { currentView } = useSpotFree();

  const renderActiveScreen = () => {
    switch (currentView) {
      case 'login':
        return <LoginScreen />;
      case 'signup':
        return <SignUpScreen />;
      case 'student-dashboard':
        return <StudentDashboard />;
      case 'room-availability':
        return <RoomAvailabilityScreen />;
      case 'room-details':
        return <RoomDetailsScreen />;
      case 'best-room-req':
        return <BestRoomRequirementsScreen />;
      case 'recommended-room':
        return <RecommendedRoomScreen />;
      case 'scan-qr':
        return <ScanRoomQRScreen />;
      case 'enter-room':
        return <EnterRoomNumberScreen />;
      case 'room-identified':
        return <RoomIdentifiedScreen />;
      case 'update-status':
        return <UpdateRoomStatusScreen />;
      case 'status-updated':
        return <StatusUpdatedScreen />;
      case 'faculty-dashboard':
        return <FacultyDashboard />;
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'manage-rooms':
        return <ManageRoomsScreen />;
      case 'status-history':
        return <StatusHistoryScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'my-timetable':
        return <MyTimetableScreen />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-screen relative bg-[#f8f9ff]">
      {/* Main Screen Content */}
      <main className="flex-1 flex flex-col">
        {renderActiveScreen()}
      </main>

      {/* Bottom Navigation (role-aware, hidden on login & signup) */}
      {currentView !== 'login' && currentView !== 'signup' && <BottomNavigation />}

      {/* Global Feedback Toast */}
      <Toast />
    </div>
  );
}

export default function Home() {
  return (
    <SpotFreeProvider>
      <SpotFreeApp />
    </SpotFreeProvider>
  );
}
