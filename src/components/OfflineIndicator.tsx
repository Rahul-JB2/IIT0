import React, { useEffect, useState } from 'react';

// Hook to check online status quietly
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * OfflineIndicator:
 * In a true Android SDK application, all core offline data (syllabus, milestones, tests, goals)
 * runs natively without badgering the user with "Offline Mode" badges or banners.
 * As requested by the user: "All things could run offline but not mentioned ki offline working hai."
 * Hence, no intrusive offline banner is displayed.
 */
export const OfflineIndicator: React.FC = () => {
  return null;
};
