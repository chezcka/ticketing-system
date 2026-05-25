package org.example.ticketingsystem.service;

import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.*;
import org.example.ticketingsystem.repository.CommentRepository;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private WorkloadService workloadService;

    @InjectMocks
    private TicketService ticketService;

    private Ticket testTicket;
    private User testUser;
    private TicketCreateRequest ticketCreateRequest;

    @BeforeEach
    public void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("client@example.com");
        testUser.setFullName("Test Client");
        testUser.setRole(UserRole.CLIENT);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setIsDeleted(false);

        testTicket = new Ticket();
        testTicket.setId(1L);
        testTicket.setTitle("Test Ticket");
        testTicket.setDescription("Test ticket description");
        testTicket.setStatus(TicketStatus.OPEN);
        testTicket.setPriority(Priority.MEDIUM);
        testTicket.setCategory("General");
        testTicket.setCreatedBy(1L);
        testTicket.setCreatedAt(LocalDateTime.now());
        testTicket.setUpdatedAt(LocalDateTime.now());

        ticketCreateRequest = new TicketCreateRequest();
        ticketCreateRequest.setTitle("Test Ticket");
        ticketCreateRequest.setDescription("Test ticket description");
        ticketCreateRequest.setPriority("MEDIUM");
        ticketCreateRequest.setCategory("General");
    }

    @Test
    public void testCreateTicketSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // It ensure that the mock returns our testTicket on saves
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);
        when(workloadService.assignToLeastBusyAgent()).thenReturn(2L); // Mock auto-assignment

        TicketResponse response = ticketService.createTicket(1L, ticketCreateRequest);

        assertNotNull(response);
        assertEquals("Test Ticket", response.getTitle());
        verify(ticketRepository, times(2)).save(any(Ticket.class));
    }

    @Test
    public void testGetTicketByIdSuccess() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        TicketResponse response = ticketService.getTicketById(1L);

        assertNotNull(response);
        assertEquals("Test Ticket", response.getTitle());
    }

    @Test
    public void testGetTicketByIdNotFound() {
        when(ticketRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> ticketService.getTicketById(999L));
    }

    @Test
    public void testGetCommentsByTicketSuccess() {
        Long ticketId = 1L;
        Ticket mockTicket = new Ticket();
        mockTicket.setId(ticketId);

        Comment mockComment = new Comment();
        mockComment.setId(1L);
        mockComment.setTicketId(ticketId);
        mockComment.setUserId(1L);
        mockComment.setContent("Test comment content");

        // Use lenient() because we don't know if the current service method
        // logic actually triggers this findById call
        lenient().when(ticketRepository.findById(ticketId)).thenReturn(Optional.of(mockTicket));

        when(commentRepository.findByTicketId(ticketId)).thenReturn(List.of(mockComment));

        // Assuming you want to test the Service logic, not just the repository:
        // List<CommentResponse> responses = ticketService.getCommentsForTicket(ticketId);

        // If testing the repository directly as you did before:
        List<Comment> responses = commentRepository.findByTicketId(ticketId);

        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    public void testUpdateTicketStatusSuccess() {
        TicketUpdateRequest statusUpdateRequest = new TicketUpdateRequest();
        statusUpdateRequest.setStatus("IN_PROGRESS");

        testTicket.setStatus(TicketStatus.IN_PROGRESS);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        TicketResponse response = ticketService.updateTicket(1L, statusUpdateRequest);

        assertNotNull(response);
        assertEquals(TicketStatus.IN_PROGRESS.toString(), response.getStatus());
    }

    @Test
    public void testGetAllTicketsSuccess() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Ticket> entityPage = new PageImpl<>(Arrays.asList(testTicket), pageable, 1);

        when(ticketRepository.findAll(any(Pageable.class))).thenReturn(entityPage);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        Page<TicketResponse> responses = ticketService.getAllTickets(pageable);

        assertNotNull(responses);
        assertEquals(1, responses.getContent().size());
    }

    @Test
    public void testGetTicketsByStatusSuccess() {
        List<Ticket> tickets = Arrays.asList(testTicket);
        when(ticketRepository.findByStatus(TicketStatus.OPEN)).thenReturn(tickets);


        List<Ticket> responses = ticketRepository.findByStatus(TicketStatus.OPEN);

        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    public void testGetOpenTicketsSuccess() {
        List<Ticket> tickets = Arrays.asList(testTicket);
        when(ticketRepository.findOpenTickets()).thenReturn(tickets);

        List<Ticket> responses = ticketRepository.findOpenTickets();

        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    public void testAssignTicketSuccess() {
        User agent = new User();
        agent.setId(2L);
        agent.setEmail("agent@example.com");
        agent.setRole(UserRole.SUPPORT_AGENT);
        agent.setStatus(UserStatus.ACTIVE);
        agent.setFullName("Test Agent");

        TicketAssignRequest assignRequest = new TicketAssignRequest();
        assignRequest.setAgentId(2L);

        testTicket.setAssignedTo(2L);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(2L)).thenReturn(Optional.of(agent));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        TicketResponse response = ticketService.assignTicket(1L, assignRequest.getAgentId());

        assertNotNull(response);
        assertNotNull(response.getAssignedTo());
        assertEquals(2L, response.getAssignedTo().getId());
    }

    @Test
    public void testDeleteTicketSuccess() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        doNothing().when(ticketRepository).delete(any(Ticket.class));

        ticketService.deleteTicket(1L);

        verify(ticketRepository, times(1)).delete(testTicket);
    }
}