
/**
 * Common interface types used across the application
 */

export interface ScheduledTaskSegment {
  id: string;
  originalRequirementId?: string | number;
  resource_id: number;
  resource_name: string;
  machine_name: string; // Used for both machine and software names
  resource_category?: ResourceCategory;
  segment_hours: number;
  total_training_hours: number;
  start_day: number;
  duration_days: number;
  start_hour_offset: number; // Hours into the day when this segment starts
}

export type ResourceCategory = "Machine" | "Software" | "Unknown";

// App version information
export const APP_VERSION = "1.0.0";
