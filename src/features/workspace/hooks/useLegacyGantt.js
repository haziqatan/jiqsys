import { useEffect, useState } from 'react';

function getInitialGantt() {
  return window.__jiqsysGantt || {
    scale: 'month',
    lw: 260,
    totalW: 0,
    headerH: 36,
    headerMain: [],
    headerSub: [],
    gridLines: [],
    todayOffset: null,
    rows: [],
    empty: true,
  };
}

export default function useLegacyGantt() {
  const [gantt, setGantt] = useState(getInitialGantt);

  useEffect(() => {
    setGantt(getInitialGantt());

    function handleGanttChange(event) {
      setGantt(event.detail || getInitialGantt());
    }

    window.addEventListener('jiqsys:gantt-change', handleGanttChange);
    return () => window.removeEventListener('jiqsys:gantt-change', handleGanttChange);
  }, []);

  return gantt;
}
