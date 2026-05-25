package org.example.ticketingsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.dto.CommentCreateRequest;
import org.example.ticketingsystem.dto.CommentResponse;
import org.example.ticketingsystem.model.Comment;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.repository.CommentRepository;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class CommentService {

    private final CommentRepository      commentRepository;
    private final TicketRepository       ticketRepository;
    private final UserRepository         userRepository;
    private final SimpMessagingTemplate  messagingTemplate;
    private final NotificationService    notificationService;

    public CommentService(
            CommentRepository commentRepository,
            TicketRepository ticketRepository,
            UserRepository userRepository,
            SimpMessagingTemplate messagingTemplate,
            NotificationService notificationService) {
        this.commentRepository   = commentRepository;
        this.ticketRepository    = ticketRepository;
        this.userRepository      = userRepository;
        this.messagingTemplate   = messagingTemplate;
        this.notificationService = notificationService;
    }

    // ── Add comment ───────────────────────────────────────────────────────────

    public CommentResponse addComment(Long ticketId, Long userId, CommentCreateRequest request) {
        log.info("🔵 === CommentService.addComment() START ===");
        log.info("   ticketId: {}", ticketId);
        log.info("   userId: {}", userId);
        log.info("   content: '{}'", request.getContent());
        log.info("   isInternal: {}", request.getIsInternal());

        // Validate ticket exists
        log.info("1️⃣ Checking if ticket {} exists...", ticketId);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> {
                    log.error("❌ Ticket {} not found!", ticketId);
                    return new IllegalArgumentException("Ticket not found");
                });
        log.info("✅ Ticket found: {}", ticket.getTitle());

        // Validate user exists
        log.info("2️⃣ Checking if user {} exists...", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("❌ User {} not found!", userId);
                    return new IllegalArgumentException("User not found");
                });
        log.info("✅ User found: {}", user.getFullName());

        // Validate content
        log.info("3️⃣ Validating comment content...");
        if (request.getContent() == null || request.getContent().isBlank()) {
            log.error("❌ Comment content is empty or null!");
            throw new IllegalArgumentException("Comment content cannot be empty");
        }
        log.info("✅ Content is valid");

        // Build comment object
        log.info("4️⃣ Creating comment object...");
        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setUserId(userId);
        comment.setContent(request.getContent());
        comment.setIsInternal(request.getIsInternal() != null ? request.getIsInternal() : false);
        log.info("✅ Comment object created");

        // Save to database
        log.info("5️⃣ SAVING comment to database...");
        Comment saved = commentRepository.save(comment);
        log.info("   Saved with ID: {}", saved.getId());

        // ✅ CRITICAL FIX: Flush to force immediate write to database
        try {
            commentRepository.flush();
            log.info("✅✅✅ FLUSHED TO DATABASE ✅✅✅");
        } catch (Exception e) {
            log.error("❌ FLUSH FAILED: {}", e.getMessage());
            throw new RuntimeException("Failed to persist comment to database", e);
        }

        log.info("   Saved comment ID: {}", saved.getId());
        log.info("   Saved comment createdAt: {}", saved.getCreatedAt());
        log.info("   Saved comment ticketId: {}", saved.getTicketId());
        log.info("   Saved comment userId: {}", saved.getUserId());

        // Build response DTO
        log.info("6️⃣ Converting to CommentResponse...");
        CommentResponse response = convertToResponse(saved);
        log.info("✅ Response created");

        // WebSocket push
        log.info("7️⃣ Sending WebSocket push to /topic/ticket/{}...", ticketId);
        try {
            messagingTemplate.convertAndSend("/topic/ticket/" + ticketId, response);
            log.info("✅ WebSocket push sent");
        } catch (Exception e) {
            log.warn("⚠️ WebSocket push failed (non-critical): {}", e.getMessage());
        }

        // Email notification
        log.info("8️⃣ Triggering email notification...");
        try {
            notificationService.notifyNewComment(ticket, saved, user);
            log.info("✅ Notification triggered");
        } catch (Exception e) {
            log.warn("⚠️ Notification failed (non-critical): {}", e.getMessage());
        }

        log.info("🟢 === CommentService.addComment() SUCCESS ===");
        return response;
    }

    // ── Get comments for a ticket ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getTicketComments(Long ticketId) {
        log.info("📥 === CommentService.getTicketComments() START ===");
        log.info("   ticketId: {}", ticketId);

        // Validate ticket exists
        log.info("1️⃣ Checking if ticket {} exists...", ticketId);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> {
                    log.error("❌ Ticket {} not found!", ticketId);
                    return new IllegalArgumentException("Ticket not found");
                });
        log.info("✅ Ticket found");

        // Fetch comments
        log.info("2️⃣ Querying comments from database for ticket {}...", ticketId);
        List<Comment> comments = commentRepository.findByTicketId(ticketId);
        log.info("✅ Query returned {} comments", comments.size());

        if (comments.isEmpty()) {
            log.warn("⚠️ No comments found for ticket {}", ticketId);
        }

        // Convert to responses
        log.info("3️⃣ Converting {} comments to response objects...", comments.size());
        List<CommentResponse> responses = comments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        log.info("✅ Converted to {} response objects", responses.size());

        log.info("🟢 === CommentService.getTicketComments() SUCCESS ===");
        return responses;
    }

    // ── Get comments for a ticket — client view (no internal notes) ───────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getTicketCommentsForClient(Long ticketId) {
        log.info("📥 === CommentService.getTicketCommentsForClient() START ===");
        log.info("   ticketId: {}", ticketId);

        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        List<CommentResponse> responses = commentRepository.findByTicketId(ticketId).stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsInternal()))
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        log.info("✅ Returned {} public comments (filtered out internal)", responses.size());
        return responses;
    }

    // ── Get single comment ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CommentResponse getComment(Long id) {
        log.info("📥 === CommentService.getComment() START ===");
        log.info("   commentId: {}", id);

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Comment {} not found!", id);
                    return new IllegalArgumentException("Comment not found");
                });

        CommentResponse response = convertToResponse(comment);
        log.info("✅ Comment retrieved: {}", comment.getId());
        return response;
    }

    // ── Update comment ────────────────────────────────────────────────────────

    public CommentResponse updateComment(Long id, Long userId, CommentCreateRequest request) {
        log.info("📝 === CommentService.updateComment() START ===");
        log.info("   commentId: {}", id);
        log.info("   userId: {}", userId);

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Comment {} not found!", id);
                    return new IllegalArgumentException("Comment not found");
                });

        if (!comment.getUserId().equals(userId)) {
            log.error("❌ User {} not authorized to edit comment {} (owner is {})",
                    userId, id, comment.getUserId());
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        if (request.getContent() != null && !request.getContent().isBlank()) {
            comment.setContent(request.getContent());
        }

        Comment updated = commentRepository.save(comment);
        commentRepository.flush();
        log.info("✅ Comment {} updated", id);
        return convertToResponse(updated);
    }

    // ── Delete comment ────────────────────────────────────────────────────────

    public void deleteComment(Long id, Long userId) {
        log.info("🗑️ === CommentService.deleteComment() START ===");
        log.info("   commentId: {}", id);
        log.info("   userId: {}", userId);

        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Comment {} not found!", id);
                    return new IllegalArgumentException("Comment not found");
                });

        if (!comment.getUserId().equals(userId)) {
            log.error("❌ User {} not authorized to delete comment {} (owner is {})",
                    userId, id, comment.getUserId());
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
        commentRepository.flush();
        log.info("✅ Comment {} deleted", id);
    }

    // ── Get all comments by a user ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getUserComments(Long userId) {
        log.info("📥 === CommentService.getUserComments() START ===");
        log.info("   userId: {}", userId);

        List<CommentResponse> responses = commentRepository.findByUserId(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        log.info("✅ Retrieved {} comments by user {}", responses.size(), userId);
        return responses;
    }

    // ── Mapping ───────────────────────────────────────────────────────────────

    private CommentResponse convertToResponse(Comment comment) {
        CommentResponse response = new CommentResponse();
        response.setId(comment.getId());
        response.setTicketId(comment.getTicketId());
        response.setUserId(comment.getUserId());
        response.setContent(comment.getContent());
        response.setIsInternal(comment.getIsInternal());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());

        userRepository.findById(comment.getUserId()).ifPresent(user -> {
            response.setUserName(user.getFullName());
            if (user.getRole() != null) {
                response.setAuthorRole(user.getRole().name());
            }
        });

        return response;
    }
}