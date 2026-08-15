import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { isSupabaseConfigured } from '@/api/supabaseClient'

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

ReactDOM.createRoot(document.getElementById('root')).render(
  isSupabaseConfigured ? <App /> : <SupabaseNotConfigured />
)
