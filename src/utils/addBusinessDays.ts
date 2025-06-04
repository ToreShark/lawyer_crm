// src/utils/addBusinessDays.ts
import { addDays, isWeekend } from 'date-fns';

export function addBusinessDays(startDate: Date, businessDays: number): Date {
  let current = new Date(startDate);
  let added = 0;

  while (added < businessDays) {
    current = addDays(current, 1);
    if (!isWeekend(current)) {
      added++;
    }
  }

  return current;
}
