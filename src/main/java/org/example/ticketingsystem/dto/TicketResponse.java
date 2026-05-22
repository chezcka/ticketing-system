package org.example.ticketingsystem.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {
    private Long id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private String category;
    private Long createdBy;
    private String createdByName;
    private Long assignedTo;
    private String assignedToName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private Integer commentCount;
}