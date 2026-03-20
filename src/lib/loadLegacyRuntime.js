import { initializeSupabaseGlobals } from './supabase.js';

const LEGACY_RUNTIME_ID = 'jiqsys-legacy-runtime';
const LEGACY_RUNTIME_SRC = '/legacy/runtime.js';

function appendLegacyRuntime() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = LEGACY_RUNTIME_ID;
    script.src = LEGACY_RUNTIME_SRC;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load the legacy Jiqsys runtime.'));
    document.body.appendChild(script);
  });
}

export async function loadLegacyRuntime() {
  initializeSupabaseGlobals();
  const existing = document.getElementById(LEGACY_RUNTIME_ID);

  if (!existing) {
    await appendLegacyRuntime();
  }

  if (typeof window.__bootJiqsysLegacyApp === 'function') {
    await window.__bootJiqsysLegacyApp();
  }
}
