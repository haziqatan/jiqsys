import { useEffect, useState } from 'react';

function getInitialTicketControls() {
  return window.__jiqsysTicketControls || {
    filters: {
      status: '',
      priority: '',
      assignee: '',
      q: '',
    },
    sort: {
      col: 'id',
      dir: 'asc',
    },
    statuses: [],
    assignees: [],
    tags: [],
    anyActive: false,
  };
}

export default function useLegacyTicketControls() {
  const [controls, setControls] = useState(getInitialTicketControls);

  useEffect(() => {
    setControls(getInitialTicketControls());

    function handleControlsChange(event) {
      setControls(event.detail || getInitialTicketControls());
    }

    window.addEventListener('jiqsys:ticket-controls-change', handleControlsChange);
    return () => window.removeEventListener('jiqsys:ticket-controls-change', handleControlsChange);
  }, []);

  return controls;
}
