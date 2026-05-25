package org.example.ticketingsystem.service;

import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    // FIX: Replaced non-existent UserRequest with actual system DTO
    private UserRegisterRequest userRegisterRequest;

    @BeforeEach
    public void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setPassword("hashedPassword123");
        testUser.setFullName("Test User");
        testUser.setRole(UserRole.CLIENT);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setIsDeleted(false);
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());

        // FIX: Instantiate the valid registration DTO
        userRegisterRequest = new UserRegisterRequest();
        userRegisterRequest.setEmail("test@example.com");
        userRegisterRequest.setPassword("Password@123");
        userRegisterRequest.setFullName("Test User");
    }

    @Test
    public void testRegisterUserSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = userService.registerUser(userRegisterRequest);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test User", response.getFullName());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUserEmailAlreadyExists() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(userRegisterRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testGetUserByIdSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponse response = userService.getUserById(1L);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
    }

    @Test
    public void testGetUserByIdNotFound() {
        lenient().when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> userService.getUserById(999L));

    }

    @Test
    public void testUpdateUserSuccess() {
        UserUpdateRequest updateRequest = new UserUpdateRequest();
        updateRequest.setEmail("updated@example.com");
        updateRequest.setPhone("123456789");
        updateRequest.setDepartment("IT");
        updateRequest.setStatus("ACTIVE");

        testUser.setEmail("updated@example.com");
        testUser.setPhone("123456789");
        testUser.setDepartment("IT");

        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = userService.updateUser(1L, updateRequest);

        assertNotNull(response);
        assertEquals("updated@example.com", response.getEmail());
        assertEquals("IT", response.getDepartment());
        verify(userRepository, times(1)).save(any(User.class));
    }



    @Test
    public void testRegisterSupportAgentSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = userService.registerSupportAgent(userRegisterRequest);

        assertNotNull(response);
        verify(userRepository, times(1)).save(any(User.class));
    }
}