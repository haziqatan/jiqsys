import { useEffect, useState } from 'react';

function getInitialActivePage() {
  return window.__jiqsysActivePage || 'home';
}

export default function useLegacyActivePage() {
  const [activePage, setActivePage] = useState(getInitialActivePage);

  useEffect(() => {
    setActivePage(getInitialActivePage());

    function handleActivePageChange(event) {
      setActivePage(typeof event.detail === 'string' ? event.detail : 'home');
    }

    window.addEventListener('jiqsys:active-page-change', handleActivePageChange);
    return () => window.removeEventListener('jiqsys:active-page-change', handleActivePageChange);
  }, []);

  return activePage;
}
