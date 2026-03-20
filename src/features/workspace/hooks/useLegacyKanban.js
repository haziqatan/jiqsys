import { useEffect, useState } from 'react';

function getInitialKanban() {
  return Array.isArray(window.__jiqsysKanban) ? window.__jiqsysKanban : [];
}

export default function useLegacyKanban() {
  const [kanban, setKanban] = useState(getInitialKanban);

  useEffect(() => {
    setKanban(getInitialKanban());

    function handleKanbanChange(event) {
      setKanban(Array.isArray(event.detail) ? event.detail : []);
    }

    window.addEventListener('jiqsys:kanban-change', handleKanbanChange);
    return () => window.removeEventListener('jiqsys:kanban-change', handleKanbanChange);
  }, []);

  return kanban;
}
