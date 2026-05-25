package org.example.ticketingsystem.service;

import org.example.ticketingsystem.dto.UserRequest;
import org.example.ticketingsystem.dto.UserResponse;
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
    private UserRequest userRequest;

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

        userRequest = new UserRequest();
        userRequest.setEmail("test@example.com");
        userRequest.setPassword("Password@123");
        userRequest.setFullName("Test User");
    }

    @Test
    public void testRegisterUserSuccess() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        UserResponse response = userService.registerUser(userRequest);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
        assertEquals("Test User", response.getFullName());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testRegisterUserEmailAlreadyExists() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));

        assertThrows(IllegalArgumentException.class, () -> userService.registerUser(userRequest));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    public void testLoginUserSuccess() {
        UserRequest loginRequest = new UserRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password@123");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        UserResponse response = userService.loginUser(loginRequest);

        assertNotNull(response);
        assertEquals("test@example.com", response.getEmail());
    }

    @Test
    public void testLoginUserInvalidPassword() {
        UserRequest loginRequest = new UserRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("WrongPassword@123");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(IllegalArgumentException.class, () -> userService.loginUser(loginRequest));
    }

    @Test
    public void testLoginUserNotFound() {
        UserRequest loginRequest = new UserRequest();
        loginRequest.setEmail("nonexistent@example.com");
        loginRequest.setPassword("Password@123");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> userService.loginUser(loginRequest));
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
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> userService.getUserById(999L));
    }

    @Test
    public void testDeactivateUserSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        testUser.setStatus(UserStatus.INACTIVE);
        UserResponse response = userService.deactivateUser(1L);

        assertNotNull(response);
        assertEquals(UserStatus.INACTIVE.toString(), response.getStatus());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testUpdateUserRoleSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        testUser.setRole(UserRole.SUPPORT_AGENT);
        UserResponse response = userService.updateUserRole(1L, "SUPPORT_AGENT");

        assertNotNull(response);
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    public void testSoftDeleteUserSuccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        testUser.setIsDeleted(true);
        testUser.setDeletedAt(LocalDateTime.now());
        userService.softDeleteUser(1L);

        assertTrue(testUser.getIsDeleted());
        assertNotNull(testUser.getDeletedAt());
        verify(userRepository, times(1)).save(any(User.class));
    }
}
