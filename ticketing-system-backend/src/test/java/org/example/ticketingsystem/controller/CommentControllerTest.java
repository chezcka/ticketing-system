package org.example.ticketingsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.ticketingsystem.dto.CommentCreateRequest;
import org.example.ticketingsystem.dto.CommentResponse;
import org.example.ticketingsystem.service.CommentService;
import org.example.ticketingsystem.util.JwtTokenProvider;
import org.example.ticketingsystem.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CommentController.class)
@AutoConfigureMockMvc(addFilters = false)
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CommentService commentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    // 🔥 THIS IS THE MISSING PIECE (CRITICAL)
    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private static final String AUTH = "Bearer token";

    private CommentCreateRequest request;
    private CommentResponse response;

    @BeforeEach
    void setup() {
        request = new CommentCreateRequest();
        request.setContent("Test comment");
        request.setIsInternal(false);

        response = new CommentResponse();
        response.setId(1L);
        response.setTicketId(1L);
        response.setUserId(100L);
        response.setContent("Test comment");
        response.setIsInternal(false);
        response.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void addComment_success() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken(anyString())).thenReturn(100L);
        when(commentService.addComment(anyLong(), anyLong(), any()))
                .thenReturn(response);

        mockMvc.perform(post("/api/tickets/1/comments")
                        .header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void getComments_success() throws Exception {
        when(commentService.getTicketComments(1L)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/tickets/1/comments"))
                .andExpect(status().isOk());
    }

    @Test
    void getComment_success() throws Exception {
        when(commentService.getComment(1L)).thenReturn(response);

        mockMvc.perform(get("/api/tickets/comments/1"))
                .andExpect(status().isOk());
    }

    @Test
    void updateComment_success() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken(anyString())).thenReturn(100L);
        when(commentService.updateComment(anyLong(), anyLong(), any()))
                .thenReturn(response);

        mockMvc.perform(put("/api/tickets/comments/1")
                        .header("Authorization", AUTH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void deleteComment_success() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken(anyString())).thenReturn(100L);
        doNothing().when(commentService).deleteComment(anyLong(), anyLong());

        mockMvc.perform(delete("/api/tickets/comments/1")
                        .header("Authorization", AUTH))
                .andExpect(status().isOk());
    }
}