import { AndroidPermissionConfig, BlockedAppConfig } from '../types/jee';

// Real Android System Permissions required by native app blockers / digital wellbeing apps
export const ANDROID_PERMISSIONS: AndroidPermissionConfig[] = [
  {
    id: 'usage_stats',
    name: 'Usage Access Permission',
    permissionKey: 'android.permission.PACKAGE_USAGE_STATS',
    intentAction: 'android.settings.USAGE_ACCESS_SETTINGS',
    description: 'Detects in real-time when YouTube, Chrome, Pocket FM, or Games are launched in foreground.',
    requiredFor: 'App Detection & Foreground Monitoring',
    granted: true,
    isCritical: true,
  },
  {
    id: 'overlay',
    name: 'Display Over Other Apps (Overlay)',
    permissionKey: 'android.permission.SYSTEM_ALERT_WINDOW',
    intentAction: 'android.settings.action.MANAGE_OVERLAY_PERMISSION',
    description: 'Renders the JEE Study Guard lock screen over YouTube/Chrome when opened outside reward hours.',
    requiredFor: 'Interception Lock Screen & Siren Overlays',
    granted: true,
    isCritical: true,
  },
  {
    id: 'accessibility',
    name: 'Accessibility Service',
    permissionKey: 'android.permission.BIND_ACCESSIBILITY_SERVICE',
    intentAction: 'android.settings.ACCESSIBILITY_SETTINGS',
    description: 'Instantly captures window state changes and blocks distracting apps within 50ms of tapping them.',
    requiredFor: 'Instant App Intercept & Back-to-Study Redirect',
    granted: true,
    isCritical: true,
  },
  {
    id: 'dnd_policy',
    name: 'Do Not Disturb & Notification Access',
    permissionKey: 'android.permission.ACCESS_NOTIFICATION_POLICY',
    intentAction: 'android.settings.NOTIFICATION_POLICY_ACCESS_SETTINGS',
    description: 'Mutes incoming notifications from YouTube, Instagram, WhatsApp, and Games during active study hours.',
    requiredFor: 'Zero Notification Interruptions',
    granted: true,
    isCritical: false,
  },
  {
    id: 'battery_opt',
    name: 'Ignore Battery Optimization',
    permissionKey: 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    intentAction: 'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS',
    description: 'Prevents Android OS from killing background Study Guard process when screen is locked or idle.',
    requiredFor: 'Continuous Background Protection',
    granted: true,
    isCritical: false,
  },
  {
    id: 'query_packages',
    name: 'Query All Packages (Installed Games)',
    permissionKey: 'android.permission.QUERY_ALL_PACKAGES',
    intentAction: 'android.settings.APPLICATION_SETTINGS',
    description: 'Detects phone games installed on your Android phone (BGMI, Free Fire, Ludo, Chess, etc.).',
    requiredFor: 'Installed Phone Games Interception',
    granted: true,
    isCritical: true,
  },
  {
    id: 'exact_alarm',
    name: 'Exact Alarm & Break Timer Alerts',
    permissionKey: 'android.permission.SCHEDULE_EXACT_ALARM',
    intentAction: 'android.settings.REQUEST_SCHEDULE_EXACT_ALARM',
    description: 'Rings loud buzzer alarm and immediately re-locks YouTube & Pocket FM when break timer expires.',
    requiredFor: 'Automated Lock Re-Engagement',
    granted: true,
    isCritical: false,
  },
  {
    id: 'notifications',
    name: 'Post Notifications & Alerts',
    permissionKey: 'android.permission.POST_NOTIFICATIONS',
    intentAction: 'android.settings.APP_NOTIFICATION_SETTINGS',
    description: 'Displays persistent status-bar HUD showing remaining minutes on your story or YouTube pass.',
    requiredFor: 'Status Bar Timer HUD',
    granted: true,
    isCritical: false,
  },
];

// Default Blocked Apps that can only be unlocked with specific Game Rewards / Passes
export const DEFAULT_BLOCKED_APPS: BlockedAppConfig[] = [
  {
    id: 'youtube',
    appName: 'YouTube & Shorts',
    packageName: 'com.google.android.youtube',
    category: 'video',
    isBlockedByDefault: true,
    allowedWithPassType: 'youtube',
    icon: 'play',
    playStoreUrl: 'market://details?id=com.google.android.youtube',
    launchUrlScheme: 'vnd.youtube://',
  },
  {
    id: 'chrome',
    appName: 'Google Chrome',
    packageName: 'com.android.chrome',
    category: 'browser',
    isBlockedByDefault: true,
    allowedWithPassType: 'chrome',
    icon: 'globe',
    playStoreUrl: 'market://details?id=com.android.chrome',
    launchUrlScheme: 'googlechrome://',
  },
  {
    id: 'pocket_fm',
    appName: 'Pocket FM (Audio Stories)',
    packageName: 'com.pocketfm.android',
    category: 'audio',
    isBlockedByDefault: true,
    allowedWithPassType: 'pocket_fm',
    icon: 'headphones',
    playStoreUrl: 'market://details?id=com.pocketfm.android',
    launchUrlScheme: 'pocketfm://',
  },
  {
    id: 'games_bgmi',
    appName: 'Phone Games (BGMI / Free Fire)',
    packageName: 'com.pubg.imobile',
    category: 'games',
    isBlockedByDefault: true,
    allowedWithPassType: 'game',
    icon: 'gamepad-2',
    playStoreUrl: 'market://details?id=com.pubg.imobile',
    launchUrlScheme: '',
  },
  {
    id: 'instagram',
    appName: 'Instagram & Reels',
    packageName: 'com.instagram.android',
    category: 'social',
    isBlockedByDefault: true,
    icon: 'camera',
    playStoreUrl: 'market://details?id=com.instagram.android',
    launchUrlScheme: 'instagram://',
  },
];

/**
 * Triggers Android OS native settings intent for a given permission
 */
export function openAndroidPermissionSettings(intentAction: string): void {
  try {
    const androidIntentUri = `intent:#Intent;action=${intentAction};end`;
    const anchor = document.createElement('a');
    anchor.href = androidIntentUri;
    anchor.rel = 'noopener noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } catch (err) {
    console.warn('Unable to invoke native Android intent:', err);
  }
}

/**
 * Checks if the student has an active pass before launching an app.
 * If not permitted, intercepts and calls onBlocked callback.
 */
export function attemptLaunchOrIntercept(
  app: BlockedAppConfig,
  activePasses: any[] = [],
  onBlocked: (app: BlockedAppConfig) => void
): boolean {
  if (!app.isBlockedByDefault) {
    if (app.launchUrlScheme) {
      window.location.href = app.launchUrlScheme;
    }
    return true;
  }

  // Check if unblock pass is active
  const now = Date.now();
  const hasPass = activePasses.some((p) => {
    return (
      p.type === app.allowedWithPassType &&
      new Date(p.expiresAt).getTime() > now &&
      p.remainingSeconds > 0
    );
  });

  if (!hasPass) {
    // Intercepted by Study Guard!
    onBlocked(app);
    return false;
  }

  // Pass is active, launch app
  if (app.launchUrlScheme) {
    try {
      window.location.href = app.launchUrlScheme;
    } catch {
      if (app.playStoreUrl) window.location.href = app.playStoreUrl;
    }
  }
  return true;
}
