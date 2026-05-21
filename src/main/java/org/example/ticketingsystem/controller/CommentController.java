package org.example.ticketingsystem.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.dto.ApiResponse;
import org.example.ticketingsystem.dto.CommentCreateRequest;
import org.example.ticketingsystem.dto.CommentResponse;
import org.example.ticketingsystem.service.CommentService;
import org.example.ticketingsystem.util.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class CommentController {

    private final CommentService commentService;
    private final JwtTokenProvider jwtTokenProvider;

    public CommentController(CommentService commentService, JwtTokenProvider jwtTokenProvider) {
        this.commentService = commentService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Add a comment to a ticket
     * POST /api/tickets/{ticketId}/comments
     */
    @PostMapping("/{ticketId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(@PathVariable Long ticketId,
                                                                   @RequestBody CommentCreateRequest request,
                                                                   @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            CommentResponse response = commentService.addComment(ticketId, userId, request);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Comment added successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<CommentResponse>(false, e.getMessage()));
        }
    }

    /**
     * Get all comments for a ticket
     * GET /api/tickets/{ticketId}/comments
     */
    @GetMapping("/{ticketId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getTicketComments(@PathVariable Long ticketId) {
        try {
            List<CommentResponse> comments = commentService.getTicketComments(ticketId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Comments retrieved", comments));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<List<CommentResponse>>(false, e.getMessage()));
        }
    }

    /**
     * Get a specific comment
     * GET /api/tickets/comments/{id}
     */
    @GetMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponse>> getComment(@PathVariable Long id) {
        try {
            CommentResponse comment = commentService.getComment(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Comment retrieved", comment));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<CommentResponse>(false, e.getMessage()));
        }
    }

    /**
     * Update a comment (only by comment author)
     * PUT /api/tickets/comments/{id}
     */
    @PutMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(@PathVariable Long id,
                                                                      @RequestBody CommentCreateRequest request,
                                                                      @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            CommentResponse response = commentService.updateComment(id, userId, request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Comment updated successfully", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<CommentResponse>(false, e.getMessage()));
        }
    }

    /**
     * Delete a comment (only by comment author)
     * DELETE /api/tickets/comments/{id}
     */
    @DeleteMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteComment(@PathVariable Long id,
                                                           @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            commentService.deleteComment(id, userId);
            return ResponseEntity.ok(new ApiResponse<Void>(true, "Comment deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<Void>(false, e.getMessage()));
        }
    }
}