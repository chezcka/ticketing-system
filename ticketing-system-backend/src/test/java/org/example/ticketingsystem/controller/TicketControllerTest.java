package org.example.ticketingsystem.controller;

import org.example.ticketingsystem.dto.TicketRequest;
import org.example.ticketingsystem.dto.TicketResponse;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TicketService ticketService;

    @Autowired
    private ObjectMapper objectMapper;

    private TicketRequest ticketRequest;
    private TicketResponse ticketResponse;

    @BeforeEach
    public void setUp() {
        ticketRequest = new TicketRequest();
        ticketRequest.setTitle("Test Ticket");
        ticketRequest.setDescription("Test ticket description");
        ticketRequest.setPriority("MEDIUM");
        ticketRequest.setCategory("General");

        ticketResponse = new TicketResponse();
        ticketResponse.setId(1L);
        ticketResponse.setTitle("Test Ticket");
        ticketResponse.setDescription("Test ticket description");
        ticketResponse.setStatus(TicketStatus.OPEN.toString());
        ticketResponse.setPriority("MEDIUM");
    }

    @Test
    @WithMockUser
    public void testCreateTicketSuccess() throws Exception {
        when(ticketService.createTicket(any(TicketRequest.class), anyLong())).thenReturn(ticketResponse);

        mockMvc.perform(post("/api/tickets")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ticketRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Ticket"));
    }

    @Test
    @WithMockUser
    public void testGetTicketByIdSuccess() throws Exception {
        when(ticketService.getTicketById(1L)).thenReturn(ticketResponse);

        mockMvc.perform(get("/api/tickets/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Ticket"));
    }

    @Test
    @WithMockUser
    public void testGetTicketByIdNotFound() throws Exception {
        when(ticketService.getTicketById(999L)).thenThrow(new IllegalArgumentException("Ticket not found"));

        mockMvc.perform(get("/api/tickets/999")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    public void testGetAllTicketsSuccess() throws Exception {
        List<TicketResponse> tickets = Arrays.asList(ticketResponse);
        when(ticketService.getAllTickets()).thenReturn(tickets);

        mockMvc.perform(get("/api/tickets")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @WithMockUser
    public void testUpdateTicketSuccess() throws Exception {
        when(ticketService.updateTicket(eq(1L), any(TicketRequest.class))).thenReturn(ticketResponse);

        mockMvc.perform(put("/api/tickets/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(ticketRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    public void testUpdateTicketStatusSuccess() throws Exception {
        TicketRequest statusRequest = new TicketRequest();
        statusRequest.setStatus("IN_PROGRESS");

        ticketResponse.setStatus(TicketStatus.IN_PROGRESS.toString());
        when(ticketService.updateStatus(eq(1L), any(TicketRequest.class))).thenReturn(ticketResponse);

        mockMvc.perform(patch("/api/tickets/1/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(statusRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value(TicketStatus.IN_PROGRESS.toString()));
    }

    @Test
    @WithMockUser(roles = "SUPPORT_AGENT")
    public void testAssignTicketSuccess() throws Exception {
        ticketResponse.setAssignedToId(2L);
        when(ticketService.assignTicket(1L, 2L)).thenReturn(ticketResponse);

        mockMvc.perform(put("/api/tickets/1/assign/2")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    public void testDeleteTicketSuccess() throws Exception {
        doNothing().when(ticketService).deleteTicket(1L);

        mockMvc.perform(delete("/api/tickets/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    public void testGetTicketsByStatusSuccess() throws Exception {
        List<TicketResponse> tickets = Arrays.asList(ticketResponse);
        when(ticketService.getTicketsByStatus(TicketStatus.OPEN)).thenReturn(tickets);

        mockMvc.perform(get("/api/tickets/status/OPEN")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testGetTicketStatsSuccess() throws Exception {
        TicketService.TicketStatsResponse stats = new TicketService.TicketStatsResponse(5L, 3L, 8L, 12L);
        when(ticketService.getTicketStats()).thenReturn(stats);

        mockMvc.perform(get("/api/tickets/stats")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.openCount").value(5))
                .andExpect(jsonPath("$.data.inProgressCount").value(3))
                .andExpect(jsonPath("$.data.resolvedCount").value(8))
                .andExpect(jsonPath("$.data.closedCount").value(12));
    }
}
