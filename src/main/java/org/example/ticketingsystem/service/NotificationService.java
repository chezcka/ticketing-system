package org.example.ticketingsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.model.Comment;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class NotificationService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public NotificationService(JavaMailSender mailSender, UserRepository userRepository) {
        this.mailSender     = mailSender;
        this.userRepository = userRepository;
    }

    // ── New comment notification ──────────────────────────────────────────────
    //
    // Called from CommentService.addComment() after the comment is saved.
    // author = the User who just posted the comment.
    // ticket = the Ticket the comment belongs to.
    //
    // Logic:
    //   Agent posted  → email the client who opened the ticket
    //   Client posted → email the assigned agent (if any)
    //
    // Internal notes are never emailed to the client.

    @Async
    public void notifyNewComment(Ticket ticket, Comment comment, User author) {
        try {
            if (Boolean.TRUE.equals(comment.getIsInternal())) {
                // Internal note — never notify the client
                return;
            }

            boolean authorIsAgent = isAgentOrAdmin(author);

            if (authorIsAgent) {
                // Agent replied → notify the client
                notifyClientOfAgentReply(ticket, comment, author);
            } else {
                // Client replied → notify the assigned agent
                notifyAgentOfClientReply(ticket, comment, author);
            }

        } catch (Exception e) {
            // Email must never crash the main request
            log.error("Failed to send comment notification for ticket {}: {}", ticket.getId(), e.getMessage());
        }
    }

    // ── Status change notification ────────────────────────────────────────────
    //
    // Call this from TicketService whenever a ticket's status is updated.
    // Example:
    //   notificationService.notifyStatusChange(ticket, "OPEN");

    @Async
    public void notifyStatusChange(Ticket ticket, String oldStatus) {
        try {
            // Find the client who opened the ticket
            userRepository.findById(ticket.getCreatedBy()).ifPresent(client -> {
                String email = client.getEmail();
                if (email == null || email.isBlank()) return;

                sendEmail(
                        email,
                        "Your ticket #" + ticket.getId() + " status has changed",
                        "Hi " + client.getFullName() + ",\n\n" +
                                "Your ticket \"" + ticket.getTitle() + "\" has been updated:\n\n" +
                                "  Status: " + formatStatus(oldStatus) + " → " + formatStatus(ticket.getStatus().name()) + "\n\n" +
                                "View your ticket: " + frontendUrl + "/tickets\n\n" +
                                "— Support Team"
                );
            });
        } catch (Exception e) {
            log.error("Failed to send status change notification for ticket {}: {}", ticket.getId(), e.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private void notifyClientOfAgentReply(Ticket ticket, Comment comment, User agent) {
        // ticket.getCreatedBy() — adjust if your Ticket stores the creator id differently
        userRepository.findById(ticket.getCreatedBy()).ifPresent(client -> {
            String email = client.getEmail();
            if (email == null || email.isBlank()) return;

            sendEmail(
                    email,
                    "New reply on your Ticket #" + ticket.getId() + " — " + ticket.getTitle(),
                    "Hi " + client.getFullName() + ",\n\n" +
                            agent.getFullName() + " replied to your support ticket:\n\n" +
                            "\"" + comment.getContent() + "\"\n\n" +
                            "View and reply here: " + frontendUrl + "/tickets\n\n" +
                            "— Support Team"
            );
        });
    }

    private void notifyAgentOfClientReply(Ticket ticket, Comment comment, User client) {
        // ticket.getAssignedTo() — adjust if your Ticket stores the agent id differently
        if (ticket.getAssignedTo() == null) return;

        userRepository.findById(ticket.getAssignedTo()).ifPresent(agent -> {
            String email = agent.getEmail();
            if (email == null || email.isBlank()) return;

            sendEmail(
                    email,
                    "Client replied on Ticket #" + ticket.getId() + " — " + ticket.getTitle(),
                    "Hi " + agent.getFullName() + ",\n\n" +
                            client.getFullName() + " replied on ticket #" + ticket.getId() + ":\n\n" +
                            "\"" + comment.getContent() + "\"\n\n" +
                            "Open ticket in dashboard: " + frontendUrl + "/dashboard\n\n" +
                            "— Ticketing System"
            );
        });
    }

    private boolean isAgentOrAdmin(User user) {
        if (user.getRole() == null) return false;
        String role = user.getRole().name();
        return role.equals("SUPPORT_AGENT") || role.equals("ADMIN");
    }

    private void sendEmail(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent → {} | {}", to, subject);
        } catch (Exception e) {
            log.error("sendEmail failed to {}: {}", to, e.getMessage());
        }
    }

    private String formatStatus(String status) {
        return status == null ? "—" : status.replace("_", " ");
    }
}