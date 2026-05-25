package org.example.ticketingsystem.controller;

import org.example.ticketingsystem.dto.CommentCreateRequest;
import org.example.ticketingsystem.dto.CommentResponse;
import org.example.ticketingsystem.service.CommentService;
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

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doNothing;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CommentService commentService;

    @Autowired
    private ObjectMapper objectMapper;

    private CommentCreateRequest commentRequest;
    private CommentResponse commentResponse;

    @BeforeEach
    public void setUp() {
        commentRequest = new CommentCreateRequest();
        commentRequest.setContent("This is a test comment");
        commentRequest.setIsInternal(false);

        commentResponse = new CommentResponse();
        commentResponse.setId(1L);
        commentResponse.setTicketId(1L);
        commentResponse.setUserId(1L);
        commentResponse.setContent("This is a test comment");
        commentResponse.setIsInternal(false);
        commentResponse.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @WithMockUser
    public void testAddCommentSuccess() throws Exception {
        when(commentService.addComment(anyLong(), anyLong(), any(CommentCreateRequest.class)))
                .thenReturn(commentResponse);

        mockMvc.perform(post("/api/tickets/1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("This is a test comment"));
    }

    @Test
    @WithMockUser
    public void testGetCommentsByTicketSuccess() throws Exception {
        List<CommentResponse> comments = Arrays.asList(commentResponse);
        when(commentService.getCommentsByTicket(1L)).thenReturn(comments);

        mockMvc.perform(get("/api/tickets/1/comments")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @WithMockUser
    public void testGetCommentByIdSuccess() throws Exception {
        when(commentService.getCommentById(1L)).thenReturn(commentResponse);

        mockMvc.perform(get("/api/comments/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("This is a test comment"));
    }

    @Test
    @WithMockUser
    public void testUpdateCommentSuccess() throws Exception {
        when(commentService.updateComment(eq(1L), any(CommentCreateRequest.class)))
                .thenReturn(commentResponse);

        mockMvc.perform(put("/api/comments/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(commentRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    public void testDeleteCommentSuccess() throws Exception {
        doNothing().when(commentService).deleteComment(1L);

        mockMvc.perform(delete("/api/comments/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser
    public void testAddInternalCommentSuccess() throws Exception {
        CommentCreateRequest internalRequest = new CommentCreateRequest();
        internalRequest.setContent("Internal note for support team");
        internalRequest.setIsInternal(true);

        commentResponse.setIsInternal(true);
        commentResponse.setContent("Internal note for support team");

        when(commentService.addComment(anyLong(), anyLong(), any(CommentCreateRequest.class)))
                .thenReturn(commentResponse);

        mockMvc.perform(post("/api/tickets/1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(internalRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isInternal").value(true));
    }

    @Test
    @WithMockUser
    public void testAddCommentEmptyContent() throws Exception {
        CommentCreateRequest emptyRequest = new CommentCreateRequest();
        emptyRequest.setContent("");
        emptyRequest.setIsInternal(false);

        when(commentService.addComment(anyLong(), anyLong(), any(CommentCreateRequest.class)))
                .thenThrow(new IllegalArgumentException("Comment content cannot be empty"));

        mockMvc.perform(post("/api/tickets/1/comments")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest());
    }
}
