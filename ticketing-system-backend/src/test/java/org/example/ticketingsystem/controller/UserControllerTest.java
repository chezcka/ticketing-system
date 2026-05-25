package org.example.ticketingsystem.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.service.UserService;
import org.example.ticketingsystem.util.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
class UserControllerTest {

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private UserRegisterRequest registerRequest;
    private UserLoginRequest loginRequest;
    private UserResponse userResponse;
    private User user;

    @BeforeEach
    void setUp() {

        registerRequest = new UserRegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password@123");
        registerRequest.setFullName("Test User");

        loginRequest = new UserLoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password@123");

        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setFullName("Test User");
        user.setRole(UserRole.CLIENT);

        userResponse = new UserResponse();
        userResponse.setId(1L);
        userResponse.setEmail("test@example.com");
        userResponse.setFullName("Test User");
        userResponse.setRole(UserRole.CLIENT.toString());
        userResponse.setStatus(UserStatus.ACTIVE.toString());
    }

    // ---------------- REGISTER ----------------

    @Test
    void register_success() throws Exception {
        when(userService.registerUserReturnEntity(any())).thenReturn(user);
        when(jwtTokenProvider.generateToken(any())).thenReturn("token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("token"));
    }

    @Test
    void register_failure_illegalArgument() throws Exception {
        when(userService.registerUserReturnEntity(any()))
                .thenThrow(new IllegalArgumentException("Email exists"));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isBadRequest());
    }

    // ---------------- LOGIN ----------------

    @Test
    void login_success() throws Exception {
        when(userService.loginUserReturnEntity(any())).thenReturn(user);
        when(jwtTokenProvider.generateToken(any())).thenReturn("token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("token"));
    }

    @Test
    void login_failure() throws Exception {
        when(userService.loginUserReturnEntity(any()))
                .thenThrow(new IllegalArgumentException("Invalid"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- ME ----------------

    @Test
    @WithMockUser
    void getCurrentUser_success() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken(anyString())).thenReturn(1L);
        when(userService.getUserById(1L)).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    @WithMockUser
    void getCurrentUser_failure() throws Exception {
        when(jwtTokenProvider.getUserIdFromToken(anyString()))
                .thenThrow(new RuntimeException("bad token"));

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isUnauthorized());
    }

    // ---------------- USERS LIST ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_success() throws Exception {
        when(userService.getAllUsers()).thenReturn(List.of(userResponse));

        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_failure() throws Exception {
        when(userService.getAllUsers())
                .thenThrow(new RuntimeException("db error"));

        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isInternalServerError());
    }

    // ---------------- GET BY ID ----------------

    @Test
    @WithMockUser
    void getUserById_success() throws Exception {
        when(userService.getUserById(1L)).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/users/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void getUserById_notFound() throws Exception {
        when(userService.getUserById(99L))
                .thenThrow(new IllegalArgumentException("not found"));

        mockMvc.perform(get("/api/auth/users/99"))
                .andExpect(status().isNotFound());
    }

    // ---------------- UPDATE ----------------

    @Test
    @WithMockUser
    void updateUser_success() throws Exception {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setEmail("updated@test.com");

        when(userService.updateUser(eq(1L), any())).thenReturn(userResponse);

        mockMvc.perform(put("/api/auth/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void updateUser_failure() throws Exception {
        when(userService.updateUser(eq(1L), any()))
                .thenThrow(new IllegalArgumentException("bad update"));

        mockMvc.perform(put("/api/auth/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    // ---------------- DELETE ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_success() throws Exception {
        mockMvc.perform(delete("/api/auth/users/1"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_failure() throws Exception {
        org.mockito.Mockito.doThrow(new IllegalArgumentException("fail"))
                .when(userService).softDeleteUser(1L);

        mockMvc.perform(delete("/api/auth/users/1"))
                .andExpect(status().isBadRequest());
    }

    // ---------------- RESTORE ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void restoreUser_success() throws Exception {
        when(userService.restoreUser(1L)).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/users/1/restore"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void restoreUser_failure() throws Exception {
        when(userService.restoreUser(1L))
                .thenThrow(new IllegalArgumentException("fail"));

        mockMvc.perform(post("/api/auth/users/1/restore"))
                .andExpect(status().isBadRequest());
    }

    // ---------------- ROLE UPDATE ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateRole_success() throws Exception {
        UserRoleRequest req = new UserRoleRequest();
        req.setRole("ADMIN");

        when(userService.updateUserRole(eq(1L), anyString()))
                .thenReturn(userResponse);

        mockMvc.perform(put("/api/auth/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateRole_failure() throws Exception {
        UserRoleRequest req = new UserRoleRequest();
        req.setRole("INVALID");

        when(userService.updateUserRole(eq(1L), anyString()))
                .thenThrow(new IllegalArgumentException("bad role"));

        mockMvc.perform(put("/api/auth/users/1/role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    // ---------------- REGISTER AGENT ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void registerAgent_success() throws Exception {
        RegisterAgentRequest req = new RegisterAgentRequest();
        req.setEmail("agent@test.com");
        req.setFullName("Agent");

        when(userService.registerSupportAgent(any())).thenReturn(userResponse);

        mockMvc.perform(post("/api/auth/register-agent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void registerAgent_failure() throws Exception {
        when(userService.registerSupportAgent(any()))
                .thenThrow(new IllegalArgumentException("fail"));

        mockMvc.perform(post("/api/auth/register-agent")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}