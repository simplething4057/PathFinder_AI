import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[PathFinder ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh',
          padding: 32, fontFamily: 'sans-serif',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#C53030', marginBottom: 12 }}>렌더링 오류가 발생했습니다</h2>
          <pre style={{
            background: '#FFF5F5', border: '1px solid #FEB2B2',
            borderRadius: 8, padding: '16px 20px',
            fontSize: 12, color: '#742A2A', whiteSpace: 'pre-wrap',
            maxWidth: 680, width: '100%', overflowX: 'auto',
          }}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 20, padding: '10px 24px',
              background: '#2E75B6', color: '#fff',
              border: 'none', borderRadius: 8,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            🔄 다시 시도
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
