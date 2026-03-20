import { useEffect, useState } from 'react';

function getInitialTeam() {
  return Array.isArray(window.__jiqsysTeam) ? window.__jiqsysTeam : [];
}

export default function useLegacyTeam() {
  const [team, setTeam] = useState(getInitialTeam);

  useEffect(() => {
    setTeam(getInitialTeam());

    function handleTeamChange(event) {
      setTeam(Array.isArray(event.detail) ? event.detail : []);
    }

    window.addEventListener('jiqsys:team-change', handleTeamChange);
    return () => window.removeEventListener('jiqsys:team-change', handleTeamChange);
  }, []);

  return team;
}
