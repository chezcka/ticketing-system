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

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new IllegalArgumentException("Comment content cannot be empty");
        }

        // Build comment
        Comment comment = new Comment();
        comment.setTicketId(ticketId);
        comment.setUserId(userId);
        comment.setContent(request.getContent());
        comment.setIsInternal(request.getIsInternal() != null ? request.getIsInternal() : false);

        Comment saved = commentRepository.save(comment);
        log.info("Comment added to ticket {}: {}", ticketId, saved.getId());

        // Build response DTO (used for both WS push and return value)
        CommentResponse response = convertToResponse(saved);

        // ── 1. WebSocket push — real-time update to all subscribers ──────────
        // Frontend hook listens on /topic/ticket/{id}
        // Clients automatically ignore isInternal=true via the hook filter
        messagingTemplate.convertAndSend("/topic/ticket/" + ticketId, response);
        log.debug("WebSocket push sent to /topic/ticket/{}", ticketId);

        // ── 2. Email notification (async, non-blocking) ───────────────────────
        notificationService.notifyNewComment(ticket, saved, user);
        log.debug("Notification triggered for comment {} on ticket {}", saved.getId(), ticketId);

        return response;
    }

    // ── Get comments for a ticket ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getTicketComments(Long ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        return commentRepository.findByTicketId(ticketId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // ── Get comments for a ticket — client view (no internal notes) ───────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getTicketCommentsForClient(Long ticketId) {
        ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Ticket not found"));

        return commentRepository.findByTicketId(ticketId).stream()
                .filter(c -> !Boolean.TRUE.equals(c.getIsInternal()))
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // ── Get single comment ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CommentResponse getComment(Long id) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        return convertToResponse(comment);
    }

    // ── Update comment ────────────────────────────────────────────────────────

    public CommentResponse updateComment(Long id, Long userId, CommentCreateRequest request) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }

        if (request.getContent() != null && !request.getContent().isBlank()) {
            comment.setContent(request.getContent());
        }

        Comment updated = commentRepository.save(comment);
        log.info("Comment {} updated", id);
        return convertToResponse(updated);
    }

    // ── Delete comment ────────────────────────────────────────────────────────

    public void deleteComment(Long id, Long userId) {
        Comment comment = commentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
        log.info("Comment {} deleted", id);
    }

    // ── Get all comments by a user ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommentResponse> getUserComments(Long userId) {
        return commentRepository.findByUserId(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
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
            // authorRole lets the frontend know if the bubble came from an agent or a client
            // Adjust getRoleAsString() to match however your User model exposes the role
            if (user.getRole() != null) {
                response.setAuthorRole(user.getRole().name());
            }
        });

        return response;
    }
}