import { Link } from 'react-router-dom';
import { formatDate, getStatusColor, getPriorityLabel } from '../../utils/formatters';
import './TicketCard.css';

export default function TicketCard({ ticket }) {
  const statusColor = getStatusColor(ticket.status);

  return (
    <Link to={`/ticket/${ticket.id}`} className="ticket-card">
      <div className="ticket-header">
        <h3 className="ticket-title">{ticket.title}</h3>
        <span className="ticket-id">#{ticket.id}</span>
      </div>

      <p className="ticket-description">{ticket.description}</p>

      <div className="ticket-footer">
        <div className="ticket-meta">
          <span 
            className="ticket-status"
            style={{ backgroundColor: statusColor }}
          >
            {ticket.status}
          </span>
          <span className="ticket-priority">
            {getPriorityLabel(ticket.priority)}
          </span>
        </div>
        <span className="ticket-date">{formatDate(ticket.createdAt)}</span>
      </div>
    </Link>
  );
}