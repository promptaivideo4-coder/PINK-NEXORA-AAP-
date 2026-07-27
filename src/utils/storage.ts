/**
 * Storage utilities for safe localStorage handling and session cleanup
 */

export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading key "${key}" from localStorage:`, error);
    return fallback;
  }
}

export function safeSetJSON(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting key "${key}" in localStorage:`, error);
    return false;
  }
}

export function clearOwnerSessionData(): void {
  const sensitiveKeys = [
    'nexora_full_name',
    'nexora_email',
    'nexora_phone',
    'nexora_personal_avatar',
    'nexora_business_logo',
    'nexora_owner_role',
    'selected_customer_id',
    'selected_customer_data',
    'booking_auto_client_id',
    'booking_auto_client_name',
    'booking_auto_staff_id',
    'booking_auto_staff_name',
    'nexora-new-appointment-form',
    'nexora-new-service-form',
    'nexora_selected_staff_id',
    'nexora_selected_service_id'
  ];

  sensitiveKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove key ${key}:`, e);
    }
  });
}
