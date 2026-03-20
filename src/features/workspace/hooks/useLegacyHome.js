import { useEffect, useState } from 'react';

function getInitialHome() {
  return window.__jiqsysHome || {
    top: null,
    chart: [],
    totalTickets: 0,
    note: {
      blocks: [],
      count: 0,
    },
  };
}

export default function useLegacyHome() {
  const [home, setHome] = useState(getInitialHome);

  useEffect(() => {
    setHome(getInitialHome());

    function handleHomeChange(event) {
      setHome(event.detail || getInitialHome());
    }

    window.addEventListener('jiqsys:home-change', handleHomeChange);
    return () => window.removeEventListener('jiqsys:home-change', handleHomeChange);
  }, []);

  return home;
}
