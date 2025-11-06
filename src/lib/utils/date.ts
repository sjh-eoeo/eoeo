/**
 * Get contract duration in weeks and days
 */
export function getContractDuration(startDate: string): string {
  const start = new Date(startDate).getTime();
  const now = new Date().getTime();
  
  if (now < start) return 'Starts soon';
  
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diffDays / 7);
  const days = diffDays % 7;
  
  return `${weeks}w ${days}d`;
}

/**
 * Calculate days until a specific date
 */
export function getDaysUntil(targetDate: Date | null): { text: string; color: string } {
  if (!targetDate) return { text: 'N/A', color: 'text-gray-400' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 3) return { text: `D-${diffDays}`, color: 'text-green-400' };
  if (diffDays > 0) return { text: `D-${diffDays}`, color: 'text-yellow-400' };
  if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-400' };
  
  return { text: `Overdue ${-diffDays}d`, color: 'text-red-400' };
}

/**
 * Calculate overdue days or days until due
 */
export function getOverdueDays(dueDate: Date | null): { text: string; color: string } {
  if (!dueDate) return { text: 'N/A', color: 'text-gray-400' };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateCopy = new Date(dueDate);
  dueDateCopy.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - dueDateCopy.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) return { text: `${diffDays} day(s) overdue`, color: 'text-red-400' };
  if (diffDays === 0) return { text: 'Due Today', color: 'text-orange-400' };
  
  // Future date - show "In X days"
  const daysUntil = -diffDays;
  if (daysUntil <= 3) return { text: `In ${daysUntil} day(s)`, color: 'text-yellow-400' };
  return { text: `In ${daysUntil} day(s)`, color: 'text-green-400' };
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function toISODateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}
