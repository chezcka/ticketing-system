package org.example.ticketingsystem.service;

import org.example.ticketingsystem.dto.CommentCreateRequest;
import org.example.ticketingsystem.dto.CommentResponse;
import org.example.ticketingsystem.model.Comment;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.CommentRepository;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private CommentService commentService;

    private Ticket testTicket;
    private User testUser;
    private Comment testComment;
    private CommentCreateRequest commentRequest;

    @BeforeEach
    public void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("client@example.com");
        testUser.setFullName("Test User");
        testUser.setRole(UserRole.CLIENT);
        testUser.setStatus(UserStatus.ACTIVE);

        testTicket = new Ticket();
        testTicket.setId(1L);
        testTicket.setTitle("Test Ticket");
        testTicket.setDescription("Test ticket description");
        testTicket.setStatus(TicketStatus.OPEN);
        testTicket.setCreatedBy(1L);
        testTicket.setCreatedAt(LocalDateTime.now());

        testComment = new Comment();
        testComment.setId(1L);
        testComment.setTicketId(1L);
        testComment.setUserId(1L);
        testComment.setContent("This is a test comment");
        testComment.setIsInternal(false);
        testComment.setCreatedAt(LocalDateTime.now());

        commentRequest = new CommentCreateRequest();
        commentRequest.setContent("This is a test comment");
        commentRequest.setIsInternal(false);
    }

    @Test
    public void testAddCommentSuccess() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(commentRepository.save(any(Comment.class))).thenReturn(testComment);
        doNothing().when(commentRepository).flush();
        doNothing().when(notificationService).notifyNewComment(any(Ticket.class), any(Comment.class), any(User.class));

        CommentResponse response = commentService.addComment(1L, 1L, commentRequest);

        assertNotNull(response);
        assertEquals("This is a test comment", response.getContent());
        verify(commentRepository, times(1)).save(any(Comment.class));
        verify(notificationService, times(1)).notifyNewComment(any(Ticket.class), any(Comment.class), any(User.class));
    }

    @Test
    public void testAddCommentTicketNotFound() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> commentService.addComment(999L, 1L, commentRequest));
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    public void testAddCommentUserNotFound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> commentService.addComment(1L, 999L, commentRequest));
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    public void testAddCommentEmptyContent() {
        CommentCreateRequest emptyRequest = new CommentCreateRequest();
        emptyRequest.setContent("");
        emptyRequest.setIsInternal(false);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () -> commentService.addComment(1L, 1L, emptyRequest));
        verify(commentRepository, never()).save(any(Comment.class));
    }

    @Test
    public void testAddInternalCommentSuccess() {
        CommentCreateRequest internalRequest = new CommentCreateRequest();
        internalRequest.setContent("Internal note for support team");
        internalRequest.setIsInternal(true);

        Comment internalComment = new Comment();
        internalComment.setId(2L);
        internalComment.setTicketId(1L);
        internalComment.setUserId(1L);
        internalComment.setContent("Internal note for support team");
        internalComment.setIsInternal(true);
        internalComment.setCreatedAt(LocalDateTime.now());

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(commentRepository.save(any(Comment.class))).thenReturn(internalComment);
        doNothing().when(commentRepository).flush();

        CommentResponse response = commentService.addComment(1L, 1L, internalRequest);

        assertNotNull(response);
        assertTrue(response.getIsInternal());
        assertEquals("Internal note for support team", response.getContent());
    }

    @Test
    public void testGetCommentsByTicketSuccess() {
        List<Comment> comments = Arrays.asList(testComment);
        when(commentRepository.findByTicketId(1L)).thenReturn(comments);

        List<CommentResponse> responses = commentService.getCommentsByTicket(1L);

        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    public void testDeleteCommentSuccess() {
        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        doNothing().when(commentRepository).delete(any(Comment.class));

        commentService.deleteComment(1L);

        verify(commentRepository, times(1)).delete(testComment);
    }

    @Test
    public void testUpdateCommentSuccess() {
        CommentCreateRequest updateRequest = new CommentCreateRequest();
        updateRequest.setContent("Updated comment content");
        updateRequest.setIsInternal(false);

        testComment.setContent("Updated comment content");

        when(commentRepository.findById(1L)).thenReturn(Optional.of(testComment));
        when(commentRepository.save(any(Comment.class))).thenReturn(testComment);

        CommentResponse response = commentService.updateComment(1L, updateRequest);

        assertNotNull(response);
        assertEquals("Updated comment content", response.getContent());
        verify(commentRepository, times(1)).save(any(Comment.class));
    }
}
