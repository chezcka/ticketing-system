package org.example.ticketingsystem.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketUpdateRequest {
    private String title;
    private String description;
    private String status;
    private String priority;
    private String category;
}