/**
 * Clean, safe notification interface prepared for future backend/Supabase integration.
 * No automatic permission requests on page load.
 * No fake push server or VAPID subscriptions.
 */

export interface NotificationPreference {
  pushEnabled: boolean;
  smsEnabled: boolean;
  emailSummaries: boolean;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}
