'use client';

import React, { useState } from 'react';
import { useSpotFree } from '@/context/SpotFreeContext';
import { useUIPrefs } from '@/context/UIPrefsContext';
import { Header } from '../Header';

export const NotificationsScreen: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markAllNotificationsRead,
    markNotificationRead,
    goBack,
    setSelectedRoomId,
    navigate,
  } = useSpotFree();
  const { effectiveView } = useUIPrefs();
  const isWeb = effectiveView === 'web';

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'unread') return notif.unread;
    return true;
  });

  const handleRoomClick = (desc: string) => {
    // Try to extract room ID like CME-104, CB-501, ICT-205
    const match = desc.match(/(CME-\d+|CB-\d+|ICT-[A-Z0-9]+)/i);
    if (match) {
      setSelectedRoomId(match[1].toUpperCase());
      navigate('room-details');
    }
  };

  return (
    <div className="flex flex-col w-full pb-24 bg-[#f8f9ff]">
      <Header
        title="Notifications"
        subtitle="SpotFree Campus Alerts"
        showBack={true}
      />

      <main className={isWeb ? 'w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4' : 'flex flex-col w-full px-gutter pt-3 pb-6'}>
        {/* Interactive Sub-header Action Bar */}
        <div className="flex items-center justify-between py-space-sm mb-space-sm">
          <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">
              SpotFree Alerts
            </span>
            <span className="ml-1 bg-primary text-on-primary font-label-sm text-label-sm px-1.5 py-0.2 rounded-full">
              {unreadNotificationCount}
            </span>
          </div>

          <button
            className="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors py-2 px-1 rounded-lg cursor-pointer"
            type="button"
            onClick={markAllNotificationsRead}
          >
            Mark all as read
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-space-md">
          <button
            className={`flex items-center gap-1.5 px-4 h-9 rounded-full font-label-md text-label-md shadow-sm transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <span>All</span>
            <span
              className={`px-1.5 py-0.5 rounded-full font-label-sm text-label-sm ${
                activeTab === 'all'
                  ? 'bg-surface-container-lowest/20 text-on-primary'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              {notifications.length}
            </span>
          </button>

          <button
            className={`flex items-center gap-1.5 px-4 h-9 rounded-full font-label-md text-label-md transition-all cursor-pointer ${
              activeTab === 'unread'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
            onClick={() => setActiveTab('unread')}
          >
            <span>Unread</span>
            <span className="bg-secondary-container text-on-secondary-container px-1.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold">
              {unreadNotificationCount}
            </span>
          </button>
        </div>

        {/* Notification Stream */}
        <div className="flex flex-col gap-3">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-surface-container-lowest rounded-xl">
              <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline mb-3">
                <span className="material-symbols-outlined text-[24px]">notifications_off</span>
              </div>
              <p className="font-title-sm text-title-sm text-on-surface">All caught up!</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 max-w-[220px]">
                {activeTab === 'unread'
                  ? 'You have no unread notifications right now.'
                  : 'No campus notifications recorded.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isOccupied =
                notif.desc.includes('OCCUPIED') || notif.desc.toLowerCase().includes('occupied');
              const isVacant =
                notif.desc.includes('VACANT') || notif.desc.toLowerCase().includes('vacant');
              const isReserved =
                notif.desc.includes('RESERVED') || notif.desc.toLowerCase().includes('reserved');

              let iconName = 'campaign';
              let iconBoxClass = 'bg-surface-container text-on-surface-variant';

              if (isOccupied) {
                iconName = 'sensor_door';
                iconBoxClass = 'bg-error-container/40 text-error';
              } else if (isVacant) {
                iconName = 'meeting_room';
                iconBoxClass = 'bg-secondary-container/50 text-secondary';
              } else if (isReserved) {
                iconName = 'schedule';
                iconBoxClass = 'bg-surface-container text-on-surface-variant';
              }

              return (
                <article
                  key={notif.id}
                  className={`notification-item relative rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                    notif.unread
                      ? 'bg-surface-container-lowest'
                      : 'bg-surface-container-lowest/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread Status Dot */}
                    <div className="pt-1">
                      <span
                        className={`status-dot flex h-2.5 w-2.5 rounded-full ${
                          notif.unread ? 'bg-secondary' : 'bg-transparent'
                        }`}
                      />
                    </div>

                    {/* Category / Status Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBoxClass}`}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {iconName}
                      </span>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <h2 className="font-title-sm text-title-sm text-on-surface truncate">
                          {notif.title}
                        </h2>
                        <span className="font-label-sm text-label-sm text-outline shrink-0">
                          {notif.time}
                        </span>
                      </div>

                      {/* Formatted body if status change or raw desc */}
                      {isOccupied || isVacant || isReserved ? (
                        <div
                          className="flex items-center gap-1.5 mt-1 cursor-pointer"
                          onClick={() => handleRoomClick(notif.desc)}
                        >
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {notif.desc}
                          </span>
                        </div>
                      ) : (
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                          {notif.desc}
                        </p>
                      )}

                      {/* Bottom Micro-actions */}
                      <div className="flex items-center justify-between mt-3 pt-2">
                        <span className="font-label-sm text-label-sm text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">
                            {isOccupied
                              ? 'qr_code_scanner'
                              : isVacant
                              ? 'bolt'
                              : isReserved
                              ? 'event_available'
                              : 'location_city'}
                          </span>
                          {isOccupied
                            ? 'Door sensor scan'
                            : isVacant
                            ? 'Free for study'
                            : isReserved
                            ? 'Scheduled class session'
                            : 'Facilities Division'}
                        </span>

                        {notif.unread ? (
                          <button
                            className="read-action-btn font-label-md text-label-md text-on-surface-variant hover:text-primary flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-surface-container transition-colors cursor-pointer"
                            onClick={() => markNotificationRead(notif.id)}
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            Mark read
                          </button>
                        ) : (
                          <span className="font-label-sm text-label-sm text-outline flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">done_all</span>
                            Read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Helpful Context Banner */}
        <section className="mt-6 bg-surface-container-low rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 text-on-tertiary-container">
            <span className="material-symbols-outlined text-[18px]">info</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-label-md text-label-md text-on-surface font-semibold">
              Automatic Space Sync
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
              Notifications update automatically when room occupancy changes via door QR scan, manual status update, or scheduled class timetable.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default NotificationsScreen;
