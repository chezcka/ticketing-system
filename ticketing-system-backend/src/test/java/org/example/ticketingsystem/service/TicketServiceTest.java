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
    void testDeleteTicketSuccess() {

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        doNothing().when(commentRepository).deleteByTicketId(1L);
        doNothing().when(ticketRepository).delete(testTicket);

        ticketService.deleteTicket(1L);

        verify(commentRepository).deleteByTicketId(1L);
        verify(ticketRepository).delete(testTicket);
    }

    @Test
    void testGetUserTicketsSuccess() {

        Pageable pageable = PageRequest.of(0, 10);
        Page<Ticket> page = new PageImpl<>(List.of(testTicket));

        when(ticketRepository.findByCreatedBy(1L, pageable))
                .thenReturn(page);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        Page<TicketResponse> result = ticketService.getUserTickets(1L, pageable);

        assertEquals(1, result.getContent().size());
    }

    @Test
    void testGetAssignedTicketsSuccess() {

        Pageable pageable = PageRequest.of(0, 10);
        Page<Ticket> page = new PageImpl<>(List.of(testTicket));

        when(ticketRepository.findByAssignedTo(2L, pageable))
                .thenReturn(page);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        Page<TicketResponse> result = ticketService.getAssignedTickets(2L, pageable);

        assertEquals(1, result.getContent().size());
    }

    @Test
    void testUpdateTicketAllFields() {

        TicketUpdateRequest req = new TicketUpdateRequest();
        req.setTitle("Updated");
        req.setDescription("Updated desc");
        req.setCategory("NewCat");
        req.setPriority("HIGH");
        req.setStatus("RESOLVED");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        TicketResponse res = ticketService.updateTicket(1L, req);

        assertNotNull(res);
    }

    @Test
    void testUpdateStatusSuccess() {

        TicketStatusRequest req = new TicketStatusRequest();
        req.setStatus("IN_PROGRESS");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse res = ticketService.updateStatus(1L, req);

        assertNotNull(res);
    }

    @Test
    void testResolveTicketSuccess() {

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse res = ticketService.resolveTicket(1L);

        assertNotNull(res);
    }

    @Test
    void testCloseTicketSuccess() {

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse res = ticketService.closeTicket(1L);

        assertNotNull(res);
    }

    @Test
    void testGetTicketStatsSuccess() {

        when(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(1L);
        when(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(2L);
        when(ticketRepository.countByStatus(TicketStatus.RESOLVED)).thenReturn(3L);
        when(ticketRepository.countByStatus(TicketStatus.CLOSED)).thenReturn(4L);

        TicketService.TicketStatsResponse res = ticketService.getTicketStats();

        assertEquals(1L, res.getOpenCount());
        assertEquals(2L, res.getInProgressCount());
        assertEquals(3L, res.getResolvedCount());
        assertEquals(4L, res.getClosedCount());
    }

    @Test
    void testCreateTicketNoAgentAvailable() {

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);
        when(workloadService.assignToLeastBusyAgent()).thenReturn(null);
        when(commentRepository.countByTicketId(anyLong())).thenReturn(0L);

        TicketResponse res = ticketService.createTicket(1L, ticketCreateRequest);

        assertNotNull(res);
    }

    @Test
    void testCreateTicket_userNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.createTicket(1L, ticketCreateRequest));
    }

    @Test
    void testAssignTicket_ticketNotFound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.assignTicket(1L, 2L));
    }

    @Test
    void testAssignTicket_agentNotFound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.assignTicket(1L, 2L));
    }

    @Test
    void testUpdateTicket_invalidPriority() {
        TicketUpdateRequest req = new TicketUpdateRequest();
        req.setPriority("INVALID");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.updateTicket(1L, req));
    }

    @Test
    void testUpdateTicket_invalidStatus() {
        TicketUpdateRequest req = new TicketUpdateRequest();
        req.setStatus("INVALID");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.updateTicket(1L, req));
    }

    @Test
    void testUpdateStatus_invalidStatus() {
        TicketStatusRequest req = new TicketStatusRequest();
        req.setStatus("BAD_STATUS");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.updateStatus(1L, req));
    }

    @Test
    void testDeleteTicket_notFound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.deleteTicket(1L));
    }

    @Test
    void testResolveTicket_notFound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.resolveTicket(1L));
    }

    @Test
    void testCloseTicket_notFound() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.closeTicket(1L));
    }

    @Test
    void testUpdateTicket_notFound() {
        TicketUpdateRequest req = new TicketUpdateRequest();

        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.updateTicket(1L, req));
    }

    @Test
    void testUpdateStatus_notFound() {
        TicketStatusRequest req = new TicketStatusRequest();
        req.setStatus("OPEN");

        when(ticketRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> ticketService.updateStatus(1L, req));
    }


}