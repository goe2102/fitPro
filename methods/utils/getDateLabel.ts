import { dateToString, getTodayString } from "../../hooks/useDailyNutrition";

export default function getDayLabel(dateStr: string): string {
  const today = getTodayString();
  const yesterday = dateToString(new Date(Date.now() - 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}