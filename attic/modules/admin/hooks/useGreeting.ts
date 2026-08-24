import { useMemo } from 'react';

export function useGreeting(name: string) {
  return useMemo(() => {
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 17) greeting = 'Good Afternoon';
    return `${greeting}, ${name}`;
  }, [name]);
}