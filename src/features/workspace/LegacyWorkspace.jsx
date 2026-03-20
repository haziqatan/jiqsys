import { useEffect, useRef } from 'react';
import { loadLegacyRuntime } from '../../lib/loadLegacyRuntime.js';
import Sidebar from './components/Sidebar.jsx';
import TeamPage from './components/TeamPage.jsx';
import HomePage from './components/HomePage.jsx';
import TicketsPage from './components/TicketsPage.jsx';
import TrashPage from './components/TrashPage.jsx';
import AuthOverlay from './components/AuthOverlay.jsx';
import WorkspaceOverlays from './components/WorkspaceOverlays.jsx';
import FeaturePages from './components/FeaturePages.jsx';
import useSupabaseAuth from './hooks/useSupabaseAuth.js';

export default function LegacyWorkspace() {
  const auth = useSupabaseAuth();
  const runtimeLoadedRef = useRef(false);

  useEffect(() => {
    window.__JIQSYS_WORKSPACE_ACCESS__ = auth.access || null;
    window.__JIQSYS_AUTH_USER__ = auth.user || null;
  }, [auth.access, auth.user]);

  useEffect(() => {
    if (auth.loading || auth.access?.status !== 'ready' || runtimeLoadedRef.current) return;

    runtimeLoadedRef.current = true;
    loadLegacyRuntime().catch((error) => {
      console.error(error);
    });
  }, [auth.loading, auth.access?.status]);

  const showWorkspace = !auth.loading && auth.session && auth.access?.status === 'ready';

  return (
    <>
      {showWorkspace ? (
        <div className="shell" id="app-shell">
          <div id="toast-stack" />
          <Sidebar auth={auth} />
          <main className="main">
            <TeamPage auth={auth} />
            <HomePage auth={auth} />
            <TicketsPage auth={auth} />
            <FeaturePages auth={auth} />
            <TrashPage />
          </main>
        </div>
      ) : null}
      <AuthOverlay auth={auth} />
      {showWorkspace ? <WorkspaceOverlays auth={auth} /> : null}
    </>
  );
}
