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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;
    private UserRegisterRequest registerRequest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setPassword("hashed");
        user.setFullName("Test User");
        user.setRole(UserRole.CLIENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setIsDeleted(false);

        registerRequest = new UserRegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password");
        registerRequest.setFullName("Test User");
    }

    // ---------------- REGISTER ----------------

    @Test
    void registerUser_success() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.registerUser(registerRequest);

        assertNotNull(res);
        assertEquals("test@example.com", res.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerUser_duplicateEmail() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.registerUser(registerRequest));

        verify(userRepository, never()).save(any());
    }

    // ---------------- LOGIN ----------------

    @Test
    void loginUser_success() {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        LoginResponse res = userService.loginUser(req);

        assertNotNull(res);
        assertEquals("test@example.com", res.getEmail());
    }

    @Test
    void loginUser_wrongPassword() {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("wrong");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUser(req));
    }

    @Test
    void loginUser_inactiveUser() {
        user.setStatus(UserStatus.INACTIVE);

        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUser(req));
    }

    // ---------------- GET USER ----------------

    @Test
    void getUserById_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse res = userService.getUserById(1L);

        assertNotNull(res);
        assertEquals("test@example.com", res.getEmail());
    }

    @Test
    void getUserById_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.getUserById(1L));
    }

    // ---------------- UPDATE USER ----------------

    @Test
    void updateUser_success() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setFirstName("New");
        req.setLastName("Name");
        req.setPhone("123");
        req.setDepartment("IT");
        req.setStatus("ACTIVE");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.updateUser(1L, req);

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_invalidStatus() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setStatus("INVALID");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.updateUser(1L, req));
    }

    // ---------------- ROLE UPDATE ----------------

    @Test
    void updateUserRole_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.updateUserRole(1L, "ADMIN");

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUserRole_invalidRole() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.updateUserRole(1L, "HACKER"));
    }

    // ---------------- SOFT DELETE / RESTORE ----------------

    @Test
    void softDeleteUser_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.softDeleteUser(1L);

        assertTrue(user.getIsDeleted());
        verify(userRepository).save(user);
    }

    @Test
    void restoreUser_success() {
        user.setIsDeleted(true);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.restoreUser(1L);

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }

    // ---------------- STATUS CHANGE ----------------

    @Test
    void deactivateUser_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.deactivateUser(1L);

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void reactivateUser_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.reactivateUser(1L);

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }

    // ---------------- SUPPORT AGENT ----------------

    @Test
    void registerSupportAgent_success() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.registerSupportAgent(registerRequest);

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_firstNameOnly() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setFirstName("John");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        userService.updateUser(1L, req);

        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_lastNameOnly() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setLastName("Doe");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        userService.updateUser(1L, req);

        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUser_passwordUpdate() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setNewPassword("newpass123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any())).thenReturn(user);

        userService.updateUser(1L, req);

        verify(passwordEncoder).encode("newpass123");
    }

    @Test
    void updateUser_notificationPreferences() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setNotificationPreferences("EMAIL");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        userService.updateUser(1L, req);

        verify(userRepository).save(any(User.class));
    }

    @Test
    void getAllUsers_filtersDeletedUsers() {
        User deleted = new User();
        deleted.setIsDeleted(true);

        User active = new User();
        active.setIsDeleted(false);

        when(userRepository.findAll()).thenReturn(List.of(deleted, active));

        List<UserResponse> result = userService.getAllUsers();

        assertEquals(1, result.size());
    }


    @Test
    void updateUser_fullBranchCoverage() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setFirstName("John");
        req.setLastName("Doe");
        req.setPhone("12345");
        req.setDepartment("IT");
        req.setStatus("ACTIVE");
        req.setNotificationPreferences("EMAIL");
        req.setNewPassword("newpass");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newpass")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserResponse res = userService.updateUser(1L, req);

        assertNotNull(res);

        verify(passwordEncoder).encode("newpass");
        verify(userRepository, times(1)).save(any(User.class));
    }


    @Test
    void updateUser_emptyNameBranches() {
        UserUpdateRequest req = new UserUpdateRequest();
        req.setFirstName("");
        req.setLastName("");
        req.setPhone("123");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenReturn(user);

        UserResponse res = userService.updateUser(1L, req);

        assertNotNull(res);
        verify(userRepository).save(any(User.class));
    }


    @Test
    void mapToUserResponse_nullRoleAndStatus() {
        user.setRole(null);
        user.setStatus(null);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserResponse res = userService.getUserById(1L);

        assertEquals("CLIENT", res.getRole());
        assertEquals("ACTIVE", res.getStatus());
    }

    @Test
    void registerSupportAgent_duplicateEmail() {
        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.registerSupportAgent(registerRequest));

        verify(userRepository, never()).save(any());
    }

    @Test
    void loginUserReturnEntity_inactiveUser() {
        user.setStatus(UserStatus.INACTIVE);

        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUserReturnEntity(req));
    }
    @Test
    void registerUserReturnEntity_success() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(user);

        User result = userService.registerUserReturnEntity(registerRequest);

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void registerUserReturnEntity_duplicateEmail() {
        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.registerUserReturnEntity(registerRequest));
    }

    @Test
    void loginUser_userNotFound() {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("missing@test.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUser(req));
    }

    @Test
    void loginUser_deletedUser() {
        user.setIsDeleted(true);

        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUser(req));
    }

    @Test
    void loginUserReturnEntity_success() {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(true);

        User result = userService.loginUserReturnEntity(req);

        assertNotNull(result);
        assertEquals("test@example.com", result.getEmail());
    }

    @Test
    void loginUserReturnEntity_userNotFound() {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("missing@test.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUserReturnEntity(req));
    }

    @Test
    void loginUserReturnEntity_wrongPassword() {
        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("wrong");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        when(passwordEncoder.matches(anyString(), anyString()))
                .thenReturn(false);

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUserReturnEntity(req));
    }

    @Test
    void loginUserReturnEntity_deletedUser() {
        user.setIsDeleted(true);

        UserLoginRequest req = new UserLoginRequest();
        req.setEmail("test@example.com");
        req.setPassword("pass");

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.of(user));

        assertThrows(IllegalArgumentException.class,
                () -> userService.loginUserReturnEntity(req));
    }

    @Test
    void updateUser_userNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.updateUser(1L, new UserUpdateRequest()));
    }

    @Test
    void deactivateUser_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.deactivateUser(1L));
    }

    @Test
    void reactivateUser_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.reactivateUser(1L));
    }

    @Test
    void restoreUser_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.restoreUser(1L));
    }

    @Test
    void softDeleteUser_notFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.softDeleteUser(1L));
    }

    @Test
    void updateUserRole_userNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> userService.updateUserRole(1L, "ADMIN"));
    }

    @Test
    void registerSupportAgent_defaultPasswordBranch() {
        registerRequest.setPassword(null);

        when(userRepository.findByEmail(anyString()))
                .thenReturn(Optional.empty());

        when(passwordEncoder.encode(anyString()))
                .thenReturn("encoded");

        when(userRepository.save(any(User.class)))
                .thenReturn(user);

        UserResponse response =
                userService.registerSupportAgent(registerRequest);

        assertNotNull(response);

        verify(passwordEncoder)
                .encode("Agent@123456");
    }



}