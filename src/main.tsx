import { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const loadingEl = document.getElementById('loading');
if (loadingEl) loadingEl.remove();

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, error: err.message + '\n\n' + (err.stack || '') };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 600, margin: '80px auto', padding: 24, background: '#111827', color: '#EF4444', borderRadius: 12, fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ color: '#EF4444', margin: '0 0 12px' }}>Error en la aplicación</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#9CA3AF', overflow: 'auto', maxHeight: 400 }}>{this.state.error}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 24px', background: '#10B981', color: '#000', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}>Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);