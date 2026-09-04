// src/services/careService.ts
import { api } from './api';

export interface VaccineRecordResponse {
  vaccineId: string;
  vaccineName: string;
  isCompleted: boolean;
  completedDate?: string;
  facilityName?: string;
  notes?: string;
}

export interface GrowthRecordResponse {
  _id?: string;
  childName: string;
  date: string;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  whoWeightStatus: 'underweight' | 'normal' | 'overweight';
  whoHeightStatus: 'stunted' | 'normal' | 'tall';
}

/**
 * Fetch all vaccine records from MongoDB Cloud
 */
export async function getVaccineRecords(): Promise<VaccineRecordResponse[]> {
  try {
    const res = await api.get('/care/vaccines');
    return res.data.vaccines || [];
  } catch (err) {
    console.warn('Get vaccines warning:', err);
    return [];
  }
}

/**
 * Toggle vaccine completion and save to Cloud DB
 */
export async function toggleVaccineRecord(data: {
  vaccineId: string;
  vaccineName: string;
  isCompleted: boolean;
  completedDate?: string;
  facilityName?: string;
  notes?: string;
}): Promise<any> {
  const res = await api.post('/care/vaccines/toggle', data);
  return res.data;
}

/**
 * Fetch growth records from MongoDB Cloud
 */
export async function getGrowthRecords(): Promise<GrowthRecordResponse[]> {
  try {
    const res = await api.get('/care/growth');
    return res.data.growthRecords || [];
  } catch (err) {
    console.warn('Get growth records warning:', err);
    return [];
  }
}

/**
 * Add a new growth record to MongoDB Cloud
 */
export async function addGrowthRecord(data: {
  childName: string;
  date: string;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
}): Promise<any> {
  const res = await api.post('/care/growth', data);
  return res.data;
}
