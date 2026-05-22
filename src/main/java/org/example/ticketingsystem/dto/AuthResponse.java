package org.example.ticketingsystem.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String token;
    private String message;
}