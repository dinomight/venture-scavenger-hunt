'use server';

import {
  validateJoinCode,
  unlockYearSession,
  validateAdminPin,
  unlockAdminSession,
  lockAdminSession,
} from '../session';
import { revalidatePath } from 'next/cache';

export async function unlockYearAction(year: number, joinCode: string) {
  if (!joinCode || joinCode.trim() === '') {
    return { success: false, error: 'PLEASE ENTER SECURITY PASSPHRASE' };
  }

  const isValid = await validateJoinCode(year, joinCode);

  if (!isValid) {
    return {
      success: false,
      error: 'ACCESS DENIED: INVALID PASSPHRASE FOR THIS CON HUNT',
    };
  }

  await unlockYearSession(year);
  return { success: true };
}

export async function unlockAdminAction(pin: string) {
  if (!pin || pin.trim() === '') {
    return { success: false, error: 'ENTER MASTER CLEARANCE PASSPHRASE' };
  }

  const isValid = validateAdminPin(pin);
  if (!isValid) {
    return {
      success: false,
      error: 'ACCESS DENIED: INVALID MASTER CLEARANCE CODE',
    };
  }

  await unlockAdminSession();
  try {
    revalidatePath('/admin');
  } catch {
    // Ignore outside request context
  }
  return { success: true };
}

export async function lockAdminAction() {
  await lockAdminSession();
  try {
    revalidatePath('/admin');
  } catch {
    // Ignore outside request context
  }
  return { success: true };
}
