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
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long ticketId,
            @RequestBody CommentCreateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("🚀 === POST /api/tickets/{}/comments ===", ticketId);
            log.info("📤 Adding comment to ticket {}...", ticketId);
            log.info("   Content length: {} chars",
                    request.getContent() != null ? request.getContent().length() : 0);
            log.info("   Content: '{}'", request.getContent());
            log.info("   Internal: {}", request.getIsInternal());

            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            log.info("   JWT Token extracted, User ID: {}", userId);

            if (userId == null) {
                log.error("❌ User ID is null! Token extraction failed");
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<CommentResponse>(false, "User not authenticated"));
            }

            log.info("✓ Calling commentService.addComment(ticketId={}, userId={})",
                    ticketId, userId);

            CommentResponse response = commentService.addComment(ticketId, userId, request);

            log.info("✅ SUCCESS: Comment added with ID: {}", response.getId());
            log.info("   Response comment content: {}", response.getContent());
            log.info("   Response comment userId: {}", response.getUserId());
            log.info("   Response comment ticketId: {}", response.getTicketId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(true, "Comment added successfully", response));
        } catch (IllegalArgumentException e) {
            log.error("❌ IllegalArgumentException: {}", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<CommentResponse>(false, e.getMessage()));
        } catch (Exception e) {
            log.error("❌ UNEXPECTED ERROR in addComment: {}", e.getMessage());
            log.error("Stack trace: ", e);
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<CommentResponse>(false,
                            "Failed to add comment: " + e.getMessage()));
        }
    }

    /**
     * Get all comments for a ticket
     * GET /api/tickets/{ticketId}/comments
     */
    @GetMapping("/{ticketId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getTicketComments(
            @PathVariable Long ticketId) {
        try {
            log.info("🚀 === GET /api/tickets/{}/comments ===", ticketId);
            log.info("📥 Fetching comments for ticket {}...", ticketId);

            List<CommentResponse> comments = commentService.getTicketComments(ticketId);

            log.info("✅ SUCCESS: Retrieved {} comments", comments.size());

            return ResponseEntity.ok(new ApiResponse<>(true, "Comments retrieved", comments));
        } catch (IllegalArgumentException e) {
            log.error("❌ IllegalArgumentException: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<List<CommentResponse>>(false, e.getMessage()));
        } catch (Exception e) {
            log.error("❌ UNEXPECTED ERROR in getTicketComments: {}", e.getMessage());
            log.error("Stack trace: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<List<CommentResponse>>(false,
                            "Failed to fetch comments: " + e.getMessage()));
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
            log.info("🚀 === GET /api/tickets/comments/{} ===", id);
            log.info("📥 Fetching comment {}...", id);

            CommentResponse comment = commentService.getComment(id);

            log.info("✅ SUCCESS: Retrieved comment {}", id);

            return ResponseEntity.ok(new ApiResponse<>(true, "Comment retrieved", comment));
        } catch (IllegalArgumentException e) {
            log.error("❌ IllegalArgumentException: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<CommentResponse>(false, e.getMessage()));
        } catch (Exception e) {
            log.error("❌ UNEXPECTED ERROR in getComment: {}", e.getMessage());
            log.error("Stack trace: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<CommentResponse>(false,
                            "Failed to fetch comment: " + e.getMessage()));
        }
    }

    /**
     * Update a comment (only by comment author)
     * PUT /api/tickets/comments/{id}
     */
    @PutMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CommentResponse>> updateComment(
            @PathVariable Long id,
            @RequestBody CommentCreateRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("🚀 === PUT /api/tickets/comments/{} ===", id);
            log.info("📝 Updating comment {}...", id);

            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            if (userId == null) {
                log.error("❌ User ID is null! Token extraction failed");
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<CommentResponse>(false, "User not authenticated"));
            }

            log.info("   User ID: {}", userId);

            CommentResponse response = commentService.updateComment(id, userId, request);

            log.info("✅ SUCCESS: Comment {} updated", id);

            return ResponseEntity.ok(new ApiResponse<>(true, "Comment updated successfully", response));
        } catch (IllegalArgumentException e) {
            log.error("❌ IllegalArgumentException: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<CommentResponse>(false, e.getMessage()));
        } catch (Exception e) {
            log.error("❌ UNEXPECTED ERROR in updateComment: {}", e.getMessage());
            log.error("Stack trace: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<CommentResponse>(false,
                            "Failed to update comment: " + e.getMessage()));
        }
    }

    /**
     * Delete a comment (only by comment author)
     * DELETE /api/tickets/comments/{id}
     */
    @DeleteMapping("/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long id,
            @RequestHeader("Authorization") String authHeader) {
        try {
            log.info("🚀 === DELETE /api/tickets/comments/{} ===", id);
            log.info("🗑️ Deleting comment {}...", id);

            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            if (userId == null) {
                log.error("❌ User ID is null! Token extraction failed");
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<Void>(false, "User not authenticated"));
            }

            log.info("   User ID: {}", userId);

            commentService.deleteComment(id, userId);

            log.info("✅ SUCCESS: Comment {} deleted", id);

            return ResponseEntity.ok(new ApiResponse<Void>(true, "Comment deleted successfully"));
        } catch (IllegalArgumentException e) {
            log.error("❌ IllegalArgumentException: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<Void>(false, e.getMessage()));
        } catch (Exception e) {
            log.error("❌ UNEXPECTED ERROR in deleteComment: {}", e.getMessage());
            log.error("Stack trace: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<Void>(false,
                            "Failed to delete comment: " + e.getMessage()));
        }
    }
}