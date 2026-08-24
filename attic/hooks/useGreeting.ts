// src/hooks/useGreeting.ts

export function useGreeting(name: string): string {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';
  return `${greeting}, ${name}`;
}

export default useGreeting;