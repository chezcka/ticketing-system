import { useState, useEffect } from 'react';
import * as ticketService from '../../services/ticketService';
import TicketCard from './TicketCard';
import './TicketList.css';

export default function TicketList({ filters = {} }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTickets();
  }, [filters]);

  const loadTickets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await ticketService.getAllTickets(filters);
      setTickets(data || []);
    } catch (err) {
      setError('Failed to load tickets');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="ticket-list-loading">Loading tickets...</div>;
  }

  if (error) {
    return <div className="ticket-list-error">{error}</div>;
  }

  if (tickets.length === 0) {
    return <div className="ticket-list-empty">No tickets found</div>;
  }

  return (
    <div className="ticket-list">
      {tickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}
    </div>
  );
}