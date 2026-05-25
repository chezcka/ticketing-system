package org.example.ticketingsystem.security;

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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = new User();
        activeUser.setId(1L);
        activeUser.setEmail("test@example.com");
        activeUser.setPassword("encoded-password");
        activeUser.setRole(UserRole.CLIENT);
        activeUser.setStatus(UserStatus.ACTIVE);
        activeUser.setIsDeleted(false);
    }

    @Test
    void loadUserByUsername_success() {
        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(activeUser));

        UserDetails userDetails =
                customUserDetailsService.loadUserByUsername("test@example.com");

        assertNotNull(userDetails);
        assertEquals("test@example.com", userDetails.getUsername());
        assertEquals("encoded-password", userDetails.getPassword());

        assertTrue(userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_CLIENT")));
    }

    @Test
    void loadUserByUsername_userNotFound() {
        when(userRepository.findByEmail("missing@example.com"))
                .thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("missing@example.com"));
    }

    @Test
    void loadUserByUsername_deletedUser() {
        activeUser.setIsDeleted(true);

        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(activeUser));

        UsernameNotFoundException ex = assertThrows(
                UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("test@example.com")
        );

        assertEquals("User account has been deleted", ex.getMessage());
    }

    @Test
    void loadUserByUsername_inactiveUser() {
        activeUser.setStatus(UserStatus.INACTIVE);

        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(activeUser));

        UsernameNotFoundException ex = assertThrows(
                UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("test@example.com")
        );

        assertEquals("User account is inactive", ex.getMessage());
    }

    @Test
    void loadUserByUsername_suspendedUserStatus() {
        activeUser.setStatus(UserStatus.SUSPENDED);

        when(userRepository.findByEmail("test@example.com"))
                .thenReturn(Optional.of(activeUser));

        assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("test@example.com"));
    }
}