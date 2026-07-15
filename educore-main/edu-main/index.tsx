import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import './i18n';
import './index.css';

// Global ErrorBoundary for debugging white screen issues
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[EDUCORE] Render crash:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: { padding: '40px', fontFamily: 'monospace', background: '#1e1e2e', color: '#cdd6f4', minHeight: '100vh' }
      },
        React.createElement('h1', { style: { color: '#f38ba8', marginBottom: '16px' } }, '⚠️ EDUCORE-OMEGA Render Error'),
        React.createElement('pre', { style: { background: '#313244', padding: '16px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap', color: '#fab387' } },
          String(this.state.error)
        ),
        React.createElement('h3', { style: { color: '#89b4fa', marginTop: '24px' } }, 'Component Stack:'),
        React.createElement('pre', { style: { background: '#313244', padding: '16px', borderRadius: '8px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '12px', color: '#a6e3a1' } },
          this.state.errorInfo?.componentStack || 'N/A'
        )
      );
    }
    return this.props.children;
  }
}

import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);