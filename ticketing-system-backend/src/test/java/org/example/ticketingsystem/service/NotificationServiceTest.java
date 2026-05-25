package org.example.ticketingsystem.service;

import org.example.ticketingsystem.model.*;
import org.example.ticketingsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private Ticket testTicket;
    private User clientUser;
    private User agentUser;
    private Comment testComment;

    @BeforeEach
    public void setUp() {

        ReflectionTestUtils.setField(notificationService, "frontendUrl", "http://localhost:5173");

        clientUser = new User();
        clientUser.setId(1L);
        clientUser.setEmail("client@example.com");
        clientUser.setFullName("Test Client");
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setStatus(UserStatus.ACTIVE);

        agentUser = new User();
        agentUser.setId(2L);
        agentUser.setEmail("agent@example.com");
        agentUser.setFullName("Support Agent");
        agentUser.setRole(UserRole.SUPPORT_AGENT);
        agentUser.setStatus(UserStatus.ACTIVE);

        testTicket = new Ticket();
        testTicket.setId(1L);
        testTicket.setTitle("Test Ticket");
        testTicket.setDescription("Test ticket description");
        testTicket.setStatus(TicketStatus.OPEN);
        testTicket.setCreatedBy(1L);
        testTicket.setAssignedTo(2L);
        testTicket.setCreatedAt(LocalDateTime.now());

        testComment = new Comment();
        testComment.setId(1L);
        testComment.setTicketId(1L);
        testComment.setUserId(2L);
        testComment.setContent("This is a test comment from agent");
        testComment.setIsInternal(false);
        testComment.setCreatedAt(LocalDateTime.now());
    }

    // ---------------- NEW COMMENT ----------------

    @Test
    public void testNotifyNewCommentAgentReplyToClient() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        notificationService.notifyNewComment(testTicket, testComment, agentUser);

        verify(mailSender, timeout(1000).atLeastOnce())
                .send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyNewCommentClientReplyToAgent() {

        testComment.setUserId(1L);

        when(userRepository.findById(2L)).thenReturn(Optional.of(agentUser));
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        notificationService.notifyNewComment(testTicket, testComment, clientUser);

        verify(mailSender, timeout(1000).atLeastOnce())
                .send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyNewCommentInternalNoteNotSent() {

        testComment.setIsInternal(true);

        lenient().when(userRepository.findById(anyLong()))
                .thenReturn(Optional.of(clientUser));

        lenient().doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        notificationService.notifyNewComment(testTicket, testComment, agentUser);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyNewCommentWithNullEmail() {

        clientUser.setEmail(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));

        notificationService.notifyNewComment(testTicket, testComment, agentUser);

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    // ---------------- STATUS CHANGE ----------------

    @Test
    public void testNotifyStatusChangeSuccess() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        testTicket.setStatus(TicketStatus.IN_PROGRESS);

        notificationService.notifyStatusChange(testTicket, TicketStatus.OPEN.name());

        verify(mailSender, timeout(1000).atLeastOnce())
                .send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyStatusChangeClientNotFound() {

        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        lenient().doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        testTicket.setStatus(TicketStatus.IN_PROGRESS);

        notificationService.notifyStatusChange(testTicket, TicketStatus.OPEN.name());

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyStatusChangeWithoutEmail() {

        clientUser.setEmail(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));

        testTicket.setStatus(TicketStatus.IN_PROGRESS);

        notificationService.notifyStatusChange(testTicket, TicketStatus.OPEN.name());

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyStatusChangeFromOpenToResolved() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        testTicket.setStatus(TicketStatus.RESOLVED);

        notificationService.notifyStatusChange(testTicket, TicketStatus.OPEN.name());

        verify(mailSender, timeout(1000).atLeastOnce())
                .send(any(SimpleMailMessage.class));
    }

    @Test
    public void testNotifyStatusChangeFromResolvedToClosed() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(clientUser));
        doNothing().when(mailSender).send(any(SimpleMailMessage.class));

        testTicket.setStatus(TicketStatus.CLOSED);

        notificationService.notifyStatusChange(testTicket, TicketStatus.RESOLVED.name());

        verify(mailSender, timeout(1000).atLeastOnce())
                .send(any(SimpleMailMessage.class));
    }
}