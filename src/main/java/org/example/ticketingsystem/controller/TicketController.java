package org.example.ticketingsystem.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.service.TicketService;
import org.example.ticketingsystem.service.WorkloadService;
import org.example.ticketingsystem.util.JwtTokenProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class TicketController {

    private final TicketService ticketService;
    private final JwtTokenProvider jwtTokenProvider;
    private final WorkloadService workloadService;

    public TicketController(TicketService ticketService, JwtTokenProvider jwtTokenProvider, WorkloadService workloadService) {
        this.ticketService = ticketService;
        this.jwtTokenProvider = jwtTokenProvider;
        this.workloadService = workloadService;
    }

    /**
     * Create a new ticket
     * POST /api/tickets
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> createTicket(@RequestBody TicketCreateRequest request,
                                          @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            TicketResponse response = ticketService.createTicket(userId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Ticket created successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Get all tickets with pagination
     * GET /api/tickets?page=0&size=10
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAllTickets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<TicketResponse> tickets = ticketService.getAllTickets(pageable);
            return ResponseEntity.ok(new ApiResponse<>(true, "Tickets retrieved", tickets));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch tickets"));
        }
    }

    /**
     * Get ticket statistics
     * ⭐ MUST be BEFORE /{id} routes to avoid route collision
     * GET /api/tickets/stats
     */
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getTicketStats() {
        try {
            TicketService.TicketStatsResponse stats = ticketService.getTicketStats();
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket statistics", stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch statistics"));
        }
    }

    /**
     * Get all agents with their workload
     * ⭐ Used by AdminDashboard to show agent dropdown with workload info
     * GET /api/tickets/agents/workload
     */
    @GetMapping("/agents/workload")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAgentsWithWorkload() {
        try {
            List<WorkloadService.AgentWorkloadInfo> workloads = workloadService.getAllAgentWorkloads();
            return ResponseEntity.ok(new ApiResponse<>(true, "Agent workloads retrieved", workloads));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch agent workloads"));
        }
    }

    /**
     * Get ticket by ID
     * GET /api/tickets/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getTicket(@PathVariable Long id) {
        try {
            TicketResponse ticket = ticketService.getTicketById(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket retrieved", ticket));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Get my tickets (created by current user)
     * GET /api/tickets/user/mine?page=0&size=10
     */
    @GetMapping("/user/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getMyTickets(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            Pageable pageable = PageRequest.of(page, size);
            Page<TicketResponse> tickets = ticketService.getUserTickets(userId, pageable);
            return ResponseEntity.ok(new ApiResponse<>(true, "Your tickets retrieved", tickets));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch your tickets"));
        }
    }

    /**
     * Get tickets assigned to current user (agent)
     * GET /api/tickets/assigned/me?page=0&size=10
     */
    @GetMapping("/assigned/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getAssignedTickets(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            Pageable pageable = PageRequest.of(page, size);
            Page<TicketResponse> tickets = ticketService.getAssignedTickets(userId, pageable);
            return ResponseEntity.ok(new ApiResponse<>(true, "Your assigned tickets retrieved", tickets));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(false, "Failed to fetch assigned tickets"));
        }
    }

    /**
     * Update ticket
     * PUT /api/tickets/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateTicket(@PathVariable Long id,
                                          @RequestBody TicketUpdateRequest request) {
        try {
            TicketResponse response = ticketService.updateTicket(id, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket updated successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Assign ticket to an agent (ADMIN MANUAL ASSIGNMENT)
     * ⭐ This is the key endpoint for admin to reassign tickets
     * PATCH /api/tickets/{id}/assign
     * Body: { "agentId": 2 }
     */
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assignTicket(@PathVariable Long id,
                                          @RequestBody TicketAssignRequest request) {
        try {
            TicketResponse response = ticketService.assignTicket(id, request.getAgentId());
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket assigned successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Auto-assign ticket to least busy agent
     * PATCH /api/tickets/{id}/auto-assign
     */
    @PatchMapping("/{id}/auto-assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<?> autoAssignTicket(@PathVariable Long id) {
        try {
            TicketResponse response = ticketService.autoAssignTicket(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket auto-assigned successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Update ticket status
     * PATCH /api/tickets/{id}/status
     */
    @PatchMapping("/{id}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody TicketStatusRequest request) {
        try {
            TicketResponse response = ticketService.updateStatus(id, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket status updated", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Mark ticket as resolved
     * PATCH /api/tickets/{id}/resolve
     */
    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<?> resolveTicket(@PathVariable Long id) {
        try {
            TicketResponse response = ticketService.resolveTicket(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket marked as resolved", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Close ticket
     * PATCH /api/tickets/{id}/close
     */
    @PatchMapping("/{id}/close")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> closeTicket(@PathVariable Long id) {
        try {
            TicketResponse response = ticketService.closeTicket(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket closed", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }

    /**
     * Delete ticket (admin only)
     * DELETE /api/tickets/{id}
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id) {
        try {
            ticketService.deleteTicket(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Ticket deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, e.getMessage()));
        }
    }
}