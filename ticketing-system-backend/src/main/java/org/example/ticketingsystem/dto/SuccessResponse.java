package org.example.ticketingsystem.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SuccessResponse {
    private String message;
    private boolean success = true;
}