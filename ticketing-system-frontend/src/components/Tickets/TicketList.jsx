import { useState, useEffect } from 'react';
import * as ticketService from '../../services/ticketService';
import TicketCard from './TicketCard';
import Pagination from '../Pagination/Pagination';
import './TicketList.css';

export default function TicketList({ filters = {} }) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    loadTickets();
  }, [filters]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
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

  // Slice tickets for the current page (client-side pagination)
  const paginatedTickets = tickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
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
      {paginatedTickets.map(ticket => (
        <TicketCard key={ticket.id} ticket={ticket} />
      ))}

      <Pagination
        currentPage={currentPage}
        totalItems={tickets.length}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
}