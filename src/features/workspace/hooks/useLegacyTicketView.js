import { useEffect, useState } from 'react';

function getInitialTicketView() {
  return window.__jiqsysTicketView || 'table';
}

export default function useLegacyTicketView() {
  const [ticketView, setTicketView] = useState(getInitialTicketView);

  useEffect(() => {
    setTicketView(getInitialTicketView());

    function handleTicketViewChange(event) {
      setTicketView(typeof event.detail === 'string' ? event.detail : 'table');
    }

    window.addEventListener('jiqsys:ticket-view-change', handleTicketViewChange);
    return () => window.removeEventListener('jiqsys:ticket-view-change', handleTicketViewChange);
  }, []);

  return ticketView;
}
