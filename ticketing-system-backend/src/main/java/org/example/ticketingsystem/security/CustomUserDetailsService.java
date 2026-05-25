package org.example.ticketingsystem.security;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Custom implementation of UserDetailsService for Spring Security
 * Loads user details from database
 */
@Slf4j
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Load user by email (username field)
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", email);
                    return new UsernameNotFoundException("User not found with email: " + email);
                });

        // ✅ Check if user is deleted
        if (user.getIsDeleted()) {
            log.warn("Attempted login with deleted user: {}", email);
            throw new UsernameNotFoundException("User account has been deleted");
        }

        // ✅ Check if user status is ACTIVE (not INACTIVE or SUSPENDED)
        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Attempted login with inactive user: {} (status: {})", email, user.getStatus());
            throw new UsernameNotFoundException("User account is inactive");
        }

        log.debug("Loading user details for: {}", email);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                true,  // enabled
                true,  // accountNonExpired
                true,  // credentialsNonExpired
                true,  // accountNonLocked
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().toString()))
        );
    }
}