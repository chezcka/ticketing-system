import { Link } from 'react-router-dom';
import './NotFoundPage.css';
 
export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-message">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard" className="btn-back-home">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}