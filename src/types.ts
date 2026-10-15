export interface Patient {
  patientId: string;
  prefix: string;
  firstName: string;
  lastName: string;
  age: number;
  address: string;
  villageNo: number;
  subdistrict: string;
  district: string;
  province: string;
  dob: string;
  idCard: string;
  phone: string;
  // Metadata for local/sheet row tracking
  rowIndex?: number;
}

export interface BloodSugarLog {
  logId: string;
  idCard: string;
  fullName: string;
  measureDate: string; // Date
  measureType?: string; // Measure (e.g. DTX)
  bloodSugarLevel: number; // BloodSugar (mg/dL)
  levelHealth?: string; // LevelHealth (e.g. ปกติ (DM Remission))
  healthVolunteer: string; // Volunteer
  timestamp: string;
  weight: number | string;
  height: number | string;
  waistline: number | string;
  bloodPressure: string;
  symptoms: string;
  village: string;
  pulse: number | string;
  prefix: string;
  firstName: string;
  lastName: string;
  // Metadata
  rowIndex?: number;
}

export interface VillageInfo {
  villageNo: number;
  name: string;
  subdistrict: string;
  district: string;
  province: string;
}

export type SugarStatus = 'hypo' | 'normal' | 'controlled' | 'warning' | 'high' | 'crisis';

export interface AppUser {
  userId: string;
  fullName: string;
  email: string;
  role: 'Nurse' | 'VHV' | 'Admin' | 'Staff' | string;
  phone: string;
  position: string;
  status: 'Active' | 'Pending' | 'Inactive' | boolean | string;
  registeredDate: string;
  username?: string;
  password?: string;
  rowIndex?: number;
}

export interface SugarStatusInfo {
  status: SugarStatus;
  label: string;
  shortLabel: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  badgeBg: string;
  badgeText: string;
  advice: string;
  iconName: string;
}
