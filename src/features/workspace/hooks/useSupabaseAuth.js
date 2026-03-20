import { useEffect, useMemo, useState } from 'react';
import { initializeSupabaseGlobals } from '../../../lib/supabase.js';
import { ensureWorkspaceAccess, setActiveWorkspace } from '../../../lib/workspaceAccess.js';

const initialState = {
  loading: true,
  session: null,
  user: null,
  access: null,
  error: null,
};

export default function useSupabaseAuth() {
  const supabase = useMemo(() => initializeSupabaseGlobals(), []);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let active = true;

    async function syncSession(nextSession) {
      if (!active) return;

      if (!nextSession?.user) {
        setState({
          loading: false,
          session: null,
          user: null,
          access: null,
          error: null,
        });
        return;
      }

      setState((current) => ({
        ...current,
        loading: true,
        session: nextSession,
        user: nextSession.user,
        error: null,
      }));

      try {
        const access = await ensureWorkspaceAccess(supabase, nextSession.user);
        if (!active) return;
        setState({
          loading: false,
          session: nextSession,
          user: nextSession.user,
          access,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState({
          loading: false,
          session: nextSession,
          user: nextSession.user,
          access: null,
          error,
        });
      }
    }

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        return syncSession(data.session);
      })
      .catch((error) => {
        if (!active) return;
        setState({
          loading: false,
          session: null,
          user: null,
          access: null,
          error,
        });
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      syncSession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function switchWorkspace(workspaceId) {
    if (!state.user?.id || !workspaceId || state.access?.activeWorkspaceId === workspaceId) return;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      await setActiveWorkspace(supabase, workspaceId);
      window.location.reload();
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error,
      }));
    }
  }

  return {
    ...state,
    switchWorkspace,
  };
}
