import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { isSupabaseConfigured } from '@/api/supabaseClient'
import ErrorBoundary from '@/components/ErrorBoundary'

function SupabaseNotConfigured() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Supabase isn't configured yet</h1>
        <p style={{ marginTop: 12, color: '#555', lineHeight: 1.5 }}>
          Copy <code>.env.example</code> to <code>.env</code> and fill in <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> from your Supabase project's API settings, then restart the dev server.
        </p>
      </div>
    </div>
  );
}

// Last resort — if anything anywhere in the tree throws during render and
// no closer boundary catches it, this is what stands between the user and
// a blank white screen. Gives them a way out (reload) instead of nothing.
function CrashFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
        <p style={{ marginTop: 12, color: '#555', lineHeight: 1.5 }}>
          This page hit an unexpected error. Reloading usually fixes it.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: 20, padding: '10px 24px', borderRadius: 999, background: '#0E2346', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary fallback={<CrashFallback />}>
    {isSupabaseConfigured ? <App /> : <SupabaseNotConfigured />}
  </ErrorBoundary>
)
