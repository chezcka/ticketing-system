package org.example.ticketingsystem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long ticketId;
    private Long userId;
    private String userName;
    private String content;
    private Boolean isInternal;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String authorRole;
    private Long authorId;
}