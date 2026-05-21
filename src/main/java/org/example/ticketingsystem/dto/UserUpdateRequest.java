package org.example.ticketingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserUpdateRequest {
    private String fullName;
    private String phone;
    private String department;
    private String notificationPreferences;
    private String newPassword;
}