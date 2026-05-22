package org.example.ticketingsystem.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.Priority;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.example.ticketingsystem.repository.CommentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final WorkloadService workloadService;

    public TicketService(TicketRepository ticketRepository, UserRepository userRepository,
                         CommentRepository commentRepository, WorkloadService workloadService) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.workloadService = workloadService;
    }

    /**
     * Create a new ticket and AUTO-ASSIGN to least busy agent.
     * Status stays OPEN after assignment — only an agent actively working
     * on the ticket should trigger IN_PROGRESS.
     */
    public TicketResponse createTicket(Long userId, TicketCreateRequest request) {
        // Validate user exists (the client creating the ticket)
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create ticket with OPEN status
        Ticket ticket = new Ticket();
        ticket.setTitle(request.getTitle());
        ticket.setDescription(request.getDescription());
        ticket.setCategory(request.getCategory());
        ticket.setPriority(Priority.valueOf(request.getPriority().toUpperCase()));
        ticket.setCreatedBy(userId);
        ticket.setStatus(TicketStatus.OPEN);

        // Save ticket first (without assignment)
        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket created: {} by user: {}", savedTicket.getId(), creator.getFullName());

        // AUTO-ASSIGN to least busy agent — status intentionally stays OPEN
        try {
            Long agentId = workloadService.assignToLeastBusyAgent();
            if (agentId != null) {
                // Use setAssignedTo directly instead of assignTo()
                // to avoid any status side-effects inside assignTo()
                savedTicket.setAssignedTo(agentId);
                savedTicket.setStatus(TicketStatus.OPEN); // enforce OPEN regardless
                savedTicket = ticketRepository.save(savedTicket);
                workloadService.updateAgentWorkload(agentId);

                User assignedAgent = userRepository.findById(agentId).orElse(null);
                log.info("Ticket {} auto-assigned to agent: {}", savedTicket.getId(),
                        assignedAgent != null ? assignedAgent.getFullName() : "Unknown");
            } else {
                log.warn("No agents available for ticket assignment: {}", savedTicket.getId());
            }
        } catch (Exception e) {
            log.error("Error auto-assigning ticket: {}", e.getMessage());
            // Don't fail ticket creation if assignment fails
        }

        return convertToResponse(savedTicket);
    }

    /** Get ticket by ID **/
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));
        return convertToResponse(ticket);
    }

    /** Get all tickets with pagination **/
    @Transactional(readOnly = true)
    public Page<TicketResponse> getAllTickets(Pageable pageable) {
        Page<Ticket> tickets = ticketRepository.findAll(pageable);
        List<TicketResponse> content = tickets.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, tickets.getTotalElements());
    }

    /** Get tickets created by a user (client view) **/
    @Transactional(readOnly = true)
    public Page<TicketResponse> getUserTickets(Long userId, Pageable pageable) {
        Page<Ticket> tickets = ticketRepository.findByCreatedBy(userId, pageable);
        List<TicketResponse> content = tickets.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, tickets.getTotalElements());
    }

    /** Get tickets assigned to a user (agent view) **/
    @Transactional(readOnly = true)
    public Page<TicketResponse> getAssignedTickets(Long userId, Pageable pageable) {
        Page<Ticket> tickets = ticketRepository.findByAssignedTo(userId, pageable);
        List<TicketResponse> content = tickets.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        return new PageImpl<>(content, pageable, tickets.getTotalElements());
    }

    /** Update ticket **/
    public TicketResponse updateTicket(Long id, TicketUpdateRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            ticket.setTitle(request.getTitle());
        }
        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            ticket.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            ticket.setCategory(request.getCategory());
        }
        if (request.getPriority() != null) {
            ticket.setPriority(Priority.valueOf(request.getPriority().toUpperCase()));
        }

        // Also allow status update via updateTicket if provided
        if (request.getStatus() != null) {
            ticket.setStatus(TicketStatus.valueOf(request.getStatus().toUpperCase()));
        }

        Ticket updatedTicket = ticketRepository.save(ticket);
        log.info("Ticket updated: {}", id);
        return convertToResponse(updatedTicket);
    }

    /** Manually assign ticket to an agent (admin/agent operation) **/
    public TicketResponse assignTicket(Long ticketId, Long agentId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

        // Use setAssignedTo to avoid side-effects from assignTo()
        ticket.setAssignedTo(agentId);
        Ticket assignedTicket = ticketRepository.save(ticket);
        workloadService.updateAgentWorkload(agentId);

        log.info("Ticket {} manually assigned to agent {}", ticketId, agent.getFullName());
        return convertToResponse(assignedTicket);
    }

    /** Auto-assign ticket to agent with lowest workload **/
    public TicketResponse autoAssignTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        Long agentId = workloadService.assignToLeastBusyAgent();
        if (agentId == null) {
            throw new IllegalArgumentException("No available agents");
        }

        ticket.setAssignedTo(agentId);
        Ticket assignedTicket = ticketRepository.save(ticket);
        workloadService.updateAgentWorkload(agentId);

        log.info("Ticket {} auto-assigned to agent {}", ticketId, agentId);
        return convertToResponse(assignedTicket);
    }

    /** Update ticket status **/
    public TicketResponse updateStatus(Long id, TicketStatusRequest request) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        TicketStatus newStatus = TicketStatus.valueOf(request.getStatus().toUpperCase());
        ticket.setStatus(newStatus);
        Ticket updatedTicket = ticketRepository.save(ticket);

        log.info("Ticket {} status updated to {}", id, newStatus);
        return convertToResponse(updatedTicket);
    }

    /** Mark ticket as resolved **/
    public TicketResponse resolveTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        ticket.markResolved();
        Ticket resolvedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} marked as resolved", id);
        return convertToResponse(resolvedTicket);
    }

    /** Close ticket **/
    public TicketResponse closeTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        ticket.close();
        Ticket closedTicket = ticketRepository.save(ticket);
        log.info("Ticket {} closed", id);
        return convertToResponse(closedTicket);
    }

    /** Delete ticket (admin only) **/
    public void deleteTicket(Long id) {
        Ticket ticket = ticketRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        commentRepository.deleteByTicketId(id);
        ticketRepository.delete(ticket);
        log.info("Ticket {} deleted", id);
    }

    /** Get ticket statistics **/
    @Transactional(readOnly = true)
    public TicketStatsResponse getTicketStats() {
        return new TicketStatsResponse(
                ticketRepository.countByStatus(TicketStatus.OPEN),
                ticketRepository.countByStatus(TicketStatus.IN_PROGRESS),
                ticketRepository.countByStatus(TicketStatus.RESOLVED),
                ticketRepository.countByStatus(TicketStatus.CLOSED)
        );
    }

    /** Convert Ticket entity to TicketResponse DTO **/
    private TicketResponse convertToResponse(Ticket ticket) {
        TicketResponse response = new TicketResponse();
        response.setId(ticket.getId());
        response.setTitle(ticket.getTitle());
        response.setDescription(ticket.getDescription());
        response.setStatus(ticket.getStatus().toString());
        response.setPriority(ticket.getPriority().toString());
        response.setCategory(ticket.getCategory());
        response.setCreatedBy(ticket.getCreatedBy());
        response.setAssignedTo(ticket.getAssignedTo());
        response.setCreatedAt(ticket.getCreatedAt());
        response.setUpdatedAt(ticket.getUpdatedAt());
        response.setResolvedAt(ticket.getResolvedAt());

        // Get creator name
        userRepository.findById(ticket.getCreatedBy()).ifPresent(user ->
                response.setCreatedByName(user.getFullName())
        );

        // Get assignee name
        if (ticket.getAssignedTo() != null) {
            userRepository.findById(ticket.getAssignedTo()).ifPresent(user ->
                    response.setAssignedToName(user.getFullName())
            );
        }

        // Get comment count
        response.setCommentCount(Math.toIntExact(commentRepository.countByTicketId(ticket.getId())));

        return response;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TicketStatsResponse {
        private Long openCount;
        private Long inProgressCount;
        private Long resolvedCount;
        private Long closedCount;
    }
}