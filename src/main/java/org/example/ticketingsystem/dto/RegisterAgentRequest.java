package org.example.ticketingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterAgentRequest {
    private String email;
    private String password;
    private String fullName;
    // role is always SUPPORT_AGENT, determined by backend
}