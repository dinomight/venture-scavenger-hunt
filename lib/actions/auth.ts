'use server';

import { validateJoinCode, unlockYearSession } from '../session';

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
