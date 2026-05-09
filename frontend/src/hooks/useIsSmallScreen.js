import { useEffect, useState } from 'react';

export function useIsSmallScreen(breakpoint = 900) {
  const [isSmall, setIsSmall] = useState(() => window.innerWidth <= breakpoint);

  useEffect(() => {
    const check = () => setIsSmall(window.innerWidth <= breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isSmall;
}