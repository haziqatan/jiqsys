import { useEffect, useState } from 'react';

function getInitialTrash() {
  return window.__jiqsysTrash || {
    tickets: [],
    features: [],
    selectedIds: [],
    allSelected: false,
    partiallySelected: false,
    hasTrashTickets: false,
    hasDeletedFeatures: false,
    isEmpty: true,
  };
}

export default function useLegacyTrash() {
  const [trash, setTrash] = useState(getInitialTrash);

  useEffect(() => {
    setTrash(getInitialTrash());

    function handleTrashChange(event) {
      setTrash(event.detail || getInitialTrash());
    }

    window.addEventListener('jiqsys:trash-change', handleTrashChange);
    return () => window.removeEventListener('jiqsys:trash-change', handleTrashChange);
  }, []);

  return trash;
}
