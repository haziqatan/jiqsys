import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { getSupabaseClient } from '../../../lib/supabase.js';

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.24 1.25-.96 2.3-2.04 3.01l3.3 2.56c1.92-1.77 3.03-4.37 3.03-7.46 0-.71-.06-1.4-.18-2.06H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.3-2.56c-.91.61-2.08.97-3.31.97-2.55 0-4.72-1.72-5.49-4.03l-3.42 2.64A9.99 9.99 0 0012 22z" />
      <path fill="#4A90E2" d="M6.51 13.94A5.98 5.98 0 016.2 12c0-.67.12-1.32.31-1.94L3.09 7.42A10.01 10.01 0 002 12c0 1.61.38 3.13 1.09 4.58l3.42-2.64z" />
      <path fill="#FBBC05" d="M12 6.04c1.47 0 2.78.5 3.82 1.48l2.87-2.87C16.95 2.98 14.7 2 12 2 8.09 2 4.72 4.24 3.09 7.42l3.42 2.64C7.28 7.76 9.45 6.04 12 6.04z" />
    </svg>
  );
}

function AuthCard({ children }) {
  return (
    <div className="auth-card">
      <div className="auth-brand">
        <div className="auth-logo"><img src="/asset/ziqlogo.png" alt="Jiqsys logo" /></div>
        <div className="auth-title">Jiqsys</div>
      </div>
      {children}
    </div>
  );
}

async function signInWithGoogle() {
  const supabase = getSupabaseClient();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
}

async function signOutAndReload() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  window.location.reload();
}

export default function AuthOverlay({ auth }) {
  if (auth.loading) {
    return (
      <div className="auth-ovl" id="auth-ovl">
        <AuthCard>
          <div className="auth-sub" style={{ marginBottom: '18px' }}>Preparing your workspace…</div>
          <div className="auth-note">Checking your session and workspace access.</div>
        </AuthCard>
      </div>
    );
  }

  if (!auth.session) {
    return (
      <div className="auth-ovl" id="auth-ovl">
        <AuthCard>
          <div className="auth-sub" style={{ marginBottom: '18px' }}>Sign in with Google to open your workspace.</div>
          <div className="auth-stack">
            <button className="btn btn-p" style={{ width: '100%', justifyContent: 'center', gap: '8px' }} onClick={() => signInWithGoogle()}>
              <GoogleMark />
              <span>Continue with Google</span>
            </button>
          </div>
          <div className="auth-note">Your account access is controlled from Supabase workspace membership.</div>
        </AuthCard>
      </div>
    );
  }

  if (auth.error || auth.access?.status === 'setup-required') {
    const message = auth.error?.message || auth.access?.message || 'Workspace auth is not fully configured yet.';
    return (
      <div className="auth-ovl" id="auth-ovl">
        <AuthCard>
          <div className="auth-sub" style={{ marginBottom: '12px' }}>Workspace setup required</div>
          <div className="auth-msg" style={{ minHeight: 0, marginBottom: '16px' }}>{message}</div>
          <div className="auth-stack">
            <button className="btn btn-s" style={{ width: '100%', justifyContent: 'center' }} onClick={() => signOutAndReload()}>
              Sign out
            </button>
          </div>
          <div className="auth-note">Run the new Supabase workspace auth SQL before testing Google login.</div>
        </AuthCard>
      </div>
    );
  }

  if (auth.access?.status === 'no-access') {
    return (
      <div className="auth-ovl" id="auth-ovl">
        <AuthCard>
          <div className="auth-sub" style={{ marginBottom: '12px' }}>No workspace access yet</div>
          <div className="auth-note" style={{ marginTop: 0, marginBottom: '18px' }}>
            Signed in as <strong>{auth.user?.email}</strong>, but this account has not been added to any workspace.
          </div>
          <div className="auth-stack">
            <button className="btn btn-s" style={{ width: '100%', justifyContent: 'center' }} onClick={() => signOutAndReload()}>
              Sign out
            </button>
          </div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="auth-ovl hidden" id="auth-ovl">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo"><img src="/asset/ziqlogo.png" alt="Jiqsys logo" /></div>
          <div className="auth-title">Jiqsys</div>
          <div className="auth-sub" id="auth-subtitle">Enter your password to unlock the workspace.</div>
        </div>
        <div className="auth-stack">
          <div className="fr" style={{ marginBottom: 0 }}>
            <div className="ilbl" id="auth-password-label">Password</div>
            <input
              className="inf"
              id="auth-password"
              type="password"
              placeholder="Enter password"
              onKeyDown={(event) => {
                if (event.key === 'Enter') callLegacyAction('submitAccessPassword');
              }}
            />
          </div>
          <div className="fr" id="auth-confirm-wrap" style={{ display: 'none', marginBottom: 0 }}>
            <div className="ilbl">Confirm Password</div>
            <input
              className="inf"
              id="auth-password-confirm"
              type="password"
              placeholder="Confirm password"
              onKeyDown={(event) => {
                if (event.key === 'Enter') callLegacyAction('submitAccessPassword');
              }}
            />
          </div>
          <div className="auth-msg" id="auth-msg" />
          <button className="btn btn-p" style={{ width: '100%', justifyContent: 'center' }} id="auth-submit-btn" onClick={() => callLegacyAction('submitAccessPassword')}>
            Unlock
          </button>
          <button className="btn btn-s" style={{ width: '100%', justifyContent: 'center' }} onClick={() => signOutAndReload()}>
            Sign out
          </button>
        </div>
        <div className="auth-note" id="auth-note">Your Google session is active. This screen only appears if workspace password lock is enabled.</div>
      </div>
    </div>
  );
}
