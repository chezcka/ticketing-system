package org.example.ticketingsystem.repository;

import org.example.ticketingsystem.model.Priority;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /** Find all tickets created by a specific user **/
    Page<Ticket> findByCreatedBy(Long userId, Pageable pageable);

    /** Find all tickets assigned to a specific agent **/
    Page<Ticket> findByAssignedTo(Long agentId, Pageable pageable);

    /** Find all tickets with a specific status **/
    List<Ticket> findByStatus(TicketStatus status);

    /** Find all open tickets (not closed or resolved) **/
    @Query("SELECT t FROM Ticket t WHERE t.status IN ('OPEN', 'IN_PROGRESS')")
    List<Ticket> findOpenTickets();

    /** Find all tickets with a specific priority **/
    List<Ticket> findByPriority(Priority priority);

    /** Find all tickets assigned to an agent with specific status **/
    List<Ticket> findByAssignedToAndStatus(Long agentId, TicketStatus status);

    /** Count tickets by status **/
    Long countByStatus(TicketStatus status);

    /** Count open tickets for an agent **/
    Long countByAssignedToAndStatus(Long agentId, TicketStatus status);

    /** Find unassigned tickets **/
    @Query("SELECT t FROM Ticket t WHERE t.assignedTo IS NULL AND t.status = 'OPEN'")
    List<Ticket> findUnassignedTickets();

    /** Find tickets containing search term in title or description **/
    @Query("SELECT t FROM Ticket t WHERE t.title LIKE %:searchTerm% OR t.description LIKE %:searchTerm%")
    List<Ticket> searchTickets(@Param("searchTerm") String searchTerm);

    /** Find all open tickets for an agent **/
    List<Ticket> findByAssignedToAndStatusIn(Long agentId, List<TicketStatus> statuses);
}