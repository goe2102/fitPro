

export default function hasRequiredAge (age: number, date: Date): boolean {

  if (age < 0) return false;

  const now = new Date();
  const birthDate = new Date(date);

  if (birthDate > now) {
    return false;
  }

  let calculatedAge = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    calculatedAge--;
  }

  return calculatedAge >= age;
}