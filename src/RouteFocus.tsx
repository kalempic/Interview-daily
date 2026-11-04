import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteFocus() {
  const { pathname } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const main = document.getElementById('content');
    const heading = main?.querySelector('h1');
    const target = heading instanceof HTMLElement ? heading : main;
    if (!(target instanceof HTMLElement)) return;
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.focus();
  }, [pathname]);

  return null;
}
