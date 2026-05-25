package org.example.ticketingsystem.service;

import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.repository.TicketRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

// FIX: Explicit import of the inner static response object from TicketService
import org.example.ticketingsystem.service.TicketService.TicketStatsResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ReportingServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @InjectMocks
    private TicketService ticketService;

    private Ticket openTicket;
    private Ticket inProgressTicket;
    private Ticket resolvedTicket;
    private Ticket closedTicket;

    @BeforeEach
    public void setUp() {
        openTicket = new Ticket();
        openTicket.setId(1L);
        openTicket.setTitle("Open Ticket");
        openTicket.setStatus(TicketStatus.OPEN);
        openTicket.setCreatedAt(LocalDateTime.now());

        inProgressTicket = new Ticket();
        inProgressTicket.setId(2L);
        inProgressTicket.setTitle("In Progress Ticket");
        inProgressTicket.setStatus(TicketStatus.IN_PROGRESS);
        inProgressTicket.setCreatedAt(LocalDateTime.now());

        resolvedTicket = new Ticket();
        resolvedTicket.setId(3L);
        resolvedTicket.setTitle("Resolved Ticket");
        resolvedTicket.setStatus(TicketStatus.RESOLVED);
        resolvedTicket.setCreatedAt(LocalDateTime.now());
        resolvedTicket.setResolvedAt(LocalDateTime.now().plusHours(2));

        closedTicket = new Ticket();
        closedTicket.setId(4L);
        closedTicket.setTitle("Closed Ticket");
        closedTicket.setStatus(TicketStatus.CLOSED);
        closedTicket.setCreatedAt(LocalDateTime.now());
        closedTicket.setResolvedAt(LocalDateTime.now().plusHours(3));
    }

    @Test
    public void testGetTicketStatsSuccess() {
        when(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(5L);
        when(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(3L);
        when(ticketRepository.countByStatus(TicketStatus.RESOLVED)).thenReturn(8L);
        when(ticketRepository.countByStatus(TicketStatus.CLOSED)).thenReturn(12L);

        // Fixed type invocation using the explicit import mapping
        TicketStatsResponse stats = ticketService.getTicketStats();

        assertNotNull(stats);
        assertEquals(5L, stats.getOpenCount());
        assertEquals(3L, stats.getInProgressCount());
        assertEquals(8L, stats.getResolvedCount());
        assertEquals(12L, stats.getClosedCount());
    }

    @Test
    public void testGetTicketStatsEmptyDatabase() {
        when(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(0L);
        when(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(0L);
        when(ticketRepository.countByStatus(TicketStatus.RESOLVED)).thenReturn(0L);
        when(ticketRepository.countByStatus(TicketStatus.CLOSED)).thenReturn(0L);

        TicketStatsResponse stats = ticketService.getTicketStats();

        assertNotNull(stats);
        assertEquals(0L, stats.getOpenCount());
        assertEquals(0L, stats.getInProgressCount());
        assertEquals(0L, stats.getResolvedCount());
        assertEquals(0L, stats.getClosedCount());
    }

    @Test
    public void testGetTicketStatsWithHighNumbers() {
        when(ticketRepository.countByStatus(TicketStatus.OPEN)).thenReturn(1000L);
        when(ticketRepository.countByStatus(TicketStatus.IN_PROGRESS)).thenReturn(500L);
        when(ticketRepository.countByStatus(TicketStatus.RESOLVED)).thenReturn(2000L);
        when(ticketRepository.countByStatus(TicketStatus.CLOSED)).thenReturn(3000L);

        TicketStatsResponse stats = ticketService.getTicketStats();

        assertNotNull(stats);
        assertEquals(1000L, stats.getOpenCount());
        assertEquals(500L, stats.getInProgressCount());
        assertEquals(2000L, stats.getResolvedCount());
        assertEquals(3000L, stats.getClosedCount());

        long totalTickets = stats.getOpenCount() + stats.getInProgressCount()
                + stats.getResolvedCount() + stats.getClosedCount();
        assertEquals(6500L, totalTickets);
    }
}