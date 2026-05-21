package org.example.ticketingsystem.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private String message;
    private String error;
    private int status;
    private String path;
    private LocalDateTime timestamp;

    // Simple constructor for just message and success
    public ErrorResponse(String message) {
        this.message = message;
        this.error = "Error";
        this.status = 400;
        this.timestamp = LocalDateTime.now();
    }

    // Constructor for message and error type
    public ErrorResponse(String message, String error) {
        this.message = message;
        this.error = error;
        this.status = 400;
        this.timestamp = LocalDateTime.now();
    }

    public boolean isSuccess() {
        return false;
    }
}