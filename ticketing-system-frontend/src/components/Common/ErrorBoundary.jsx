import React from 'react';
import './ErrorBoundary.css';
 
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
 
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
 
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
 
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ Something Went Wrong</h2>
            <p>{this.state.error?.message}</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="btn-retry"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
 
    return this.props.children;
  }
}