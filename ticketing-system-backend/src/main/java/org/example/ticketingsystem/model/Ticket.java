package org.example.ticketingsystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String description;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TicketStatus status = TicketStatus.OPEN;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Priority priority = Priority.MEDIUM;

    @Column(length = 100)
    private String category;

    // Foreign Keys
    @Column(nullable = false)
    private Long createdBy;

    @Column
    private Long assignedTo;

    // Timestamps
    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(nullable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column
    private LocalDateTime resolvedAt;

    // ============================================================================
    // Helper Methods
    // ============================================================================

    /**
     * Get workload points for this ticket based on priority
     * Used for calculating agent workload
     */
    public int getWorkloadPoints() {
        return switch (this.priority) {
            case LOW -> 1;
            case MEDIUM -> 2;
            case HIGH -> 3;
            case CRITICAL -> 5;
        };
    }

    /** Check if ticket is open **/
    public boolean isOpen() {
        return this.status == TicketStatus.OPEN;
    }

    /** Check if ticket is assigned **/
    public boolean isAssigned() {
        return this.assignedTo != null;
    }

    /** Assign ticket to an agent **/
    public void assignTo(Long agentId) {
        this.assignedTo = agentId;
        this.status = TicketStatus.IN_PROGRESS;
        this.updatedAt = LocalDateTime.now();
    }

    /** Mark ticket as resolved **/
    public void markResolved() {
        this.status = TicketStatus.RESOLVED;
        this.resolvedAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    /** Close the ticket **/
    public void close() {
        this.status = TicketStatus.CLOSED;
        this.updatedAt = LocalDateTime.now();
    }
}