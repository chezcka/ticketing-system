package org.example.ticketingsystem.service;

import org.example.ticketingsystem.dto.TicketRequest;
import org.example.ticketingsystem.dto.TicketResponse;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TicketServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TicketService ticketService;

    private Ticket testTicket;
    private TicketRequest ticketRequest;
    private User testUser;

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
        testTicket.setPriority("MEDIUM");
        testTicket.setCategory("General");
        testTicket.setCreatedBy(1L);
        testTicket.setCreatedAt(LocalDateTime.now());
        testTicket.setUpdatedAt(LocalDateTime.now());

        ticketRequest = new TicketRequest();
        ticketRequest.setTitle("Test Ticket");
        ticketRequest.setDescription("Test ticket description");
        ticketRequest.setPriority("MEDIUM");
        ticketRequest.setCategory("General");
    }

    @Test
    public void testCreateTicketSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse response = ticketService.createTicket(ticketRequest, 1L);

        assertNotNull(response);
        assertEquals("Test Ticket", response.getTitle());
        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    public void testGetTicketByIdSuccess() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

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
    public void testUpdateTicketSuccess() {
        TicketRequest updateRequest = new TicketRequest();
        updateRequest.setTitle("Updated Ticket");
        updateRequest.setDescription("Updated description");
        updateRequest.setPriority("HIGH");

        testTicket.setTitle("Updated Ticket");
        testTicket.setDescription("Updated description");
        testTicket.setPriority("HIGH");

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse response = ticketService.updateTicket(1L, updateRequest);

        assertNotNull(response);
        assertEquals("Updated Ticket", response.getTitle());
        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    public void testUpdateTicketStatusSuccess() {
        TicketRequest statusRequest = new TicketRequest();
        statusRequest.setStatus("IN_PROGRESS");

        testTicket.setStatus(TicketStatus.IN_PROGRESS);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse response = ticketService.updateStatus(1L, statusRequest);

        assertNotNull(response);
        assertEquals(TicketStatus.IN_PROGRESS.toString(), response.getStatus());
    }

    @Test
    public void testGetAllTicketsSuccess() {
        List<Ticket> tickets = Arrays.asList(testTicket);
        when(ticketRepository.findAll()).thenReturn(tickets);

        List<TicketResponse> responses = ticketService.getAllTickets();

        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    public void testGetTicketsByStatusSuccess() {
        List<Ticket> tickets = Arrays.asList(testTicket);
        when(ticketRepository.findByStatus(TicketStatus.OPEN)).thenReturn(tickets);

        List<TicketResponse> responses = ticketService.getTicketsByStatus(TicketStatus.OPEN);

        assertNotNull(responses);
        assertEquals(1, responses.size());
    }

    @Test
    public void testGetOpenAndInProgressTicketsSuccess() {
        List<Ticket> tickets = Arrays.asList(testTicket);
        when(ticketRepository.findOpenAndInProgressTickets()).thenReturn(tickets);

        List<TicketResponse> responses = ticketService.getOpenAndInProgressTickets();

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

        testTicket.setAssignedTo(2L);

        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));
        when(userRepository.findById(2L)).thenReturn(Optional.of(agent));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(testTicket);

        TicketResponse response = ticketService.assignTicket(1L, 2L);

        assertNotNull(response);
        assertEquals(2L, response.getAssignedToId());
    }

    @Test
    public void testDeleteTicketSuccess() {
        when(ticketRepository.findById(1L)).thenReturn(Optional.of(testTicket));

        ticketService.deleteTicket(1L);

        verify(ticketRepository, times(1)).delete(testTicket);
    }
}
