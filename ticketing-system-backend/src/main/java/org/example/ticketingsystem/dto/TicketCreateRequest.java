package org.example.ticketingsystem.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCreateRequest {
    private String title;
    private String description;
    private String priority;
    private String category;
}