package org.example.ticketingsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.service.TicketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TicketControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TicketService ticketService;

    @Autowired
    private ObjectMapper objectMapper;

    private TicketCreateRequest ticketCreateRequest;
    private TicketResponse ticketResponse;

    @BeforeEach
    void setUp() {
        ticketCreateRequest = new TicketCreateRequest();
        ticketCreateRequest.setTitle("Test Ticket");
        ticketCreateRequest.setDescription("Test ticket description");
        ticketCreateRequest.setPriority("MEDIUM");
        ticketCreateRequest.setCategory("General");

        ticketResponse = new TicketResponse();
        ticketResponse.setId(1L);
        ticketResponse.setTitle("Test Ticket");
        ticketResponse.setDescription("Test ticket description");
        ticketResponse.setStatus(TicketStatus.OPEN.toString());
        ticketResponse.setPriority("MEDIUM");
    }

    @Test
    @WithMockUser
    void testCreateTicketSuccess() throws Exception {
        when(ticketService.createTicket(anyLong(), any(TicketCreateRequest.class)))
                .thenReturn(ticketResponse);

        mockMvc.perform(post("/api/tickets")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("Authorization", "Bearer dummy-token")
                        .content(objectMapper.writeValueAsString(ticketCreateRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").value("Ticket created successfully"));
    }

    @Test
    @WithMockUser
    void testGetTicketByIdSuccess() throws Exception {
        when(ticketService.getTicketById(1L)).thenReturn(ticketResponse);

        mockMvc.perform(get("/api/tickets/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Test Ticket"));
    }

    @Test
    @WithMockUser
    void testGetTicketByIdNotFound() throws Exception {
        when(ticketService.getTicketById(999L))
                .thenThrow(new IllegalArgumentException("Ticket not found"));

        mockMvc.perform(get("/api/tickets/999"))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void testGetAllTicketsSuccess() throws Exception {
        Page<TicketResponse> page = new PageImpl<>(List.of(ticketResponse));

        when(ticketService.getAllTickets(any(Pageable.class)))
                .thenReturn(page);

        mockMvc.perform(get("/api/tickets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1));
    }

    @Test
    @WithMockUser
    void testUpdateTicketSuccess() throws Exception {
        TicketUpdateRequest req = new TicketUpdateRequest();
        req.setTitle("Test Ticket");
        req.setDescription("Test ticket description");
        req.setPriority("MEDIUM");
        req.setCategory("General");
        req.setStatus(TicketStatus.OPEN.toString());

        when(ticketService.updateTicket(eq(1L), any(TicketUpdateRequest.class)))
                .thenReturn(ticketResponse);

        mockMvc.perform(put("/api/tickets/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Test Ticket"));
    }

    @Test
    @WithMockUser
    void testUpdateTicketStatusSuccess() throws Exception {
        TicketStatusRequest req = new TicketStatusRequest();
        req.setStatus("IN_PROGRESS");

        ticketResponse.setStatus(TicketStatus.IN_PROGRESS.toString());

        when(ticketService.updateStatus(eq(1L), any(TicketStatusRequest.class)))
                .thenReturn(ticketResponse);

        mockMvc.perform(patch("/api/tickets/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testAssignTicketSuccess() throws Exception {
        UserResponse agent = new UserResponse();
        agent.setId(2L);
        ticketResponse.setAssignedTo(agent);

        when(ticketService.assignTicket(1L, 2L)).thenReturn(ticketResponse);

        TicketAssignRequest req = new TicketAssignRequest();
        req.setAgentId(2L);

        mockMvc.perform(patch("/api/tickets/1/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetTicketStatsSuccess() throws Exception {
        TicketService.TicketStatsResponse stats =
                new TicketService.TicketStatsResponse(5L, 3L, 8L, 12L);

        when(ticketService.getTicketStats()).thenReturn(stats);

        mockMvc.perform(get("/api/tickets/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.openCount").value(5));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testDeleteTicketSuccess() throws Exception {
        doNothing().when(ticketService).deleteTicket(1L);

        mockMvc.perform(delete("/api/tickets/1"))
                .andExpect(status().isOk());
    }
}