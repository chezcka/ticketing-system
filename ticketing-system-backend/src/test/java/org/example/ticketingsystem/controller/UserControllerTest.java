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

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {

    @MockBean
    private UserService userService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private UserRegisterRequest userRegisterRequest;
    private UserLoginRequest userLoginRequest;
    private UserResponse userResponse;
    private User mockUser;

    @BeforeEach
    public void setUp() {

        userRegisterRequest = new UserRegisterRequest();
        userRegisterRequest.setEmail("test@example.com");
        userRegisterRequest.setPassword("Password@123");
        userRegisterRequest.setFullName("Test User");
        userRegisterRequest.setDepartment("IT");

        userLoginRequest = new UserLoginRequest();
        userLoginRequest.setEmail("test@example.com");
        userLoginRequest.setPassword("Password@123");

        userResponse = new UserResponse();
        userResponse.setId(1L);
        userResponse.setEmail("test@example.com");
        userResponse.setFullName("Test User");
        userResponse.setRole(UserRole.CLIENT.toString());
        userResponse.setStatus(UserStatus.ACTIVE.toString());

        mockUser = new User();
        mockUser.setId(1L);
        mockUser.setEmail("test@example.com");
        mockUser.setFullName("Test User");
        mockUser.setRole(UserRole.CLIENT);
    }

    // ---------------- REGISTER ----------------

    @Test
    public void testRegisterUserSuccess() throws Exception {

        when(userService.registerUserReturnEntity(any(UserRegisterRequest.class)))
                .thenReturn(mockUser);

        when(jwtTokenProvider.generateToken(any(User.class)))
                .thenReturn("mock-jwt-token");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegisterRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    // ---------------- LOGIN ----------------

    @Test
    public void testLoginUserSuccess() throws Exception {

        when(userService.loginUserReturnEntity(any(UserLoginRequest.class)))
                .thenReturn(mockUser);

        when(jwtTokenProvider.generateToken(any(User.class)))
                .thenReturn("mock-jwt-token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userLoginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock-jwt-token"));
    }

    // ---------------- GET ALL USERS ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testGetAllUsersSuccess() throws Exception {

        List<UserResponse> users = Arrays.asList(userResponse);

        when(userService.getAllUsers()).thenReturn(users);

        mockMvc.perform(get("/api/auth/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1));
    }

    // ---------------- GET BY ID ----------------

    @Test
    @WithMockUser
    public void testGetUserByIdSuccess() throws Exception {

        when(userService.getUserById(1L)).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    @WithMockUser
    public void testGetUserByIdNotFound() throws Exception {

        when(userService.getUserById(999L))
                .thenThrow(new IllegalArgumentException("User not found"));

        mockMvc.perform(get("/api/auth/users/999"))
                .andExpect(status().isNotFound());
    }

    // ---------------- UPDATE ----------------

    @Test
    @WithMockUser
    public void testUpdateUserSuccess() throws Exception {

        UserUpdateRequest updateRequest = new UserUpdateRequest();
        updateRequest.setEmail("test@example.com");

        when(userService.updateUser(eq(1L), any(UserUpdateRequest.class)))
                .thenReturn(userResponse);

        mockMvc.perform(put("/api/auth/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk());
    }

    // ---------------- DEACTIVATE ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testDeactivateUserSuccess() throws Exception {

        userResponse.setStatus(UserStatus.INACTIVE.toString());

        when(userService.deactivateUser(1L)).thenReturn(userResponse);

        mockMvc.perform(put("/api/auth/users/1/deactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value(UserStatus.INACTIVE.toString()));
    }

    // ---------------- REACTIVATE ----------------

    @Test
    @WithMockUser(roles = "ADMIN")
    public void testReactivateUserSuccess() throws Exception {

        userResponse.setStatus(UserStatus.ACTIVE.toString());

        when(userService.reactivateUser(1L)).thenReturn(userResponse);

        mockMvc.perform(put("/api/auth/users/1/reactivate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value(UserStatus.ACTIVE.toString()));
    }
}