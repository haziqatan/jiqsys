import { useEffect, useState } from 'react';

function getInitialTicketTable() {
  return window.__jiqsysTicketTable || {
    count: 0,
    selectedIds: [],
    allVisibleSelected: false,
    partiallySelected: false,
    tags: [],
    rows: [],
  };
}

export default function useLegacyTicketTable() {
  const [tableState, setTableState] = useState(getInitialTicketTable);

  useEffect(() => {
    setTableState(getInitialTicketTable());

    function handleTicketTableChange(event) {
      setTableState(event.detail || getInitialTicketTable());
    }

    window.addEventListener('jiqsys:ticket-table-change', handleTicketTableChange);
    return () => window.removeEventListener('jiqsys:ticket-table-change', handleTicketTableChange);
  }, []);

  return tableState;
}
