package org.example.ticketingsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        log.info("UserService initialized");
    }

    /**
     * Register a new user - returns UserResponse
     */
    public UserResponse registerUser(UserRegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("User with email {} already exists", request.getEmail());
            throw new IllegalArgumentException("User with this email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(UserRole.CLIENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setIsDeleted(false);

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        return mapToUserResponse(savedUser);
    }

    /**
     * Register user and return User entity - for token generation
     */
    public User registerUserReturnEntity(UserRegisterRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("User with email {} already exists", request.getEmail());
            throw new IllegalArgumentException("User with this email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setRole(UserRole.CLIENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setIsDeleted(false);

        User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        return savedUser;
    }

    /**
     * Login user and return authentication response
     */
    public LoginResponse loginUser(UserLoginRequest request) {
        log.info("Attempting login for user: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", request.getEmail());
                    return new IllegalArgumentException("Invalid email or password");
                });

        if (user.getStatus() != UserStatus.ACTIVE || user.getIsDeleted()) {
            log.warn("User account is inactive or deleted: {}", request.getEmail());
            throw new IllegalArgumentException("User account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password for user: {}", request.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
        }

        log.info("User logged in successfully: {}", request.getEmail());

        LoginResponse response = new LoginResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole().toString());
        response.setMessage("Login successful");

        return response;
    }

    /**
     * Login user and return User entity - for token generation
     */
    public User loginUserReturnEntity(UserLoginRequest request) {
        log.info("Attempting login for user: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("User not found with email: {}", request.getEmail());
                    return new IllegalArgumentException("Invalid email or password");
                });

        if (user.getStatus() != UserStatus.ACTIVE || user.getIsDeleted()) {
            log.warn("User account is inactive or deleted: {}", request.getEmail());
            throw new IllegalArgumentException("User account is inactive");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            log.warn("Invalid password for user: {}", request.getEmail());
            throw new IllegalArgumentException("Invalid email or password");
        }

        log.info("User logged in successfully: {}", request.getEmail());

        return user;
    }

    /**
     * Get user by ID
     */
    public UserResponse getUserById(Long id) {
        log.info("Fetching user with id: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return mapToUserResponse(user);
    }

    /**
     * Get all users
     */
    public List<UserResponse> getAllUsers() {
        log.info("Fetching all users");
        return userRepository.findAll()
                .stream()
                .filter(user -> !user.getIsDeleted())
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update user information
     */
    public UserResponse updateUser(Long id, UserUpdateRequest request) {
        log.info("Updating user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (request.getFirstName() != null && !request.getFirstName().isEmpty()) {
            user.setFullName(request.getFirstName() + " " + request.getLastName());
        }

        if (request.getLastName() != null && !request.getLastName().isEmpty()) {
            user.setFullName(request.getFirstName() + " " + request.getLastName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getDepartment() != null) {
            user.setDepartment(request.getDepartment());
        }

        if (request.getStatus() != null && !request.getStatus().isEmpty()) {
            try {
                UserStatus newStatus = UserStatus.valueOf(request.getStatus());
                user.setStatus(newStatus);
                log.info("User {} status changed to {}", id, newStatus);
            } catch (IllegalArgumentException e) {
                log.error("Invalid status: {}", request.getStatus());
                throw new IllegalArgumentException("Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED");
            }
        }

        if (request.getNotificationPreferences() != null) {
            user.setNotificationPreferences(request.getNotificationPreferences());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        log.info("User updated successfully with id: {}", id);

        return mapToUserResponse(updatedUser);
    }

    /**
     * Deactivate user - sets status to INACTIVE
     */
    public UserResponse deactivateUser(Long id) {
        log.info("Deactivating user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setStatus(UserStatus.INACTIVE);
        User updatedUser = userRepository.save(user);
        log.info("User deactivated successfully with id: {}", id);

        return mapToUserResponse(updatedUser);
    }

    /**
     * Reactivate user - sets status back to ACTIVE
     */
    public UserResponse reactivateUser(Long id) {
        log.info("Reactivating user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setStatus(UserStatus.ACTIVE);
        User updatedUser = userRepository.save(user);
        log.info("User reactivated successfully with id: {}", id);

        return mapToUserResponse(updatedUser);
    }

    /**
     * Soft delete user (mark as deleted)
     */
    public void softDeleteUser(Long id) {
        log.info("Soft deleting user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsDeleted(true);
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);
        log.info("User soft deleted successfully with id: {}", id);
    }

    /**
     * Restore soft-deleted user
     */
    public UserResponse restoreUser(Long id) {
        log.info("Restoring user with id: {}", id);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setIsDeleted(false);
        user.setStatus(UserStatus.ACTIVE);
        User restoredUser = userRepository.save(user);
        log.info("User restored successfully with id: {}", id);

        return mapToUserResponse(restoredUser);
    }

    /**
     * Map User entity to UserResponse DTO
     */
    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setPhone(user.getPhone());
        response.setDepartment(user.getDepartment());
        response.setRole(user.getRole() != null ? user.getRole().toString() : "CLIENT");
        response.setStatus(user.getStatus() != null ? user.getStatus().toString() : "ACTIVE");
        response.setNotificationPreferences(user.getNotificationPreferences());
        return response;
    }

    /**
     * Update user role (admin only)
     */
    public UserResponse updateUserRole(Long id, String role) {
        log.info("Updating role for user {}: {}", id, role);

        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        try {
            user.setRole(UserRole.valueOf(role.toUpperCase()));
            User updated = userRepository.save(user);
            log.info("Role updated successfully for user {}", id);
            return mapToUserResponse(updated);
        } catch (IllegalArgumentException e) {
            log.error("Invalid role: {}", role);
            throw new IllegalArgumentException("Invalid role. Must be ADMIN, SUPPORT_AGENT, or CLIENT");
        }
    }

    /**
     * Register support agent
     */
    public UserResponse registerSupportAgent(UserRegisterRequest request) {
        log.info("Registering support agent with email: {}", request.getEmail());

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        // Guarantee password is never null before encoding
        String rawPassword = (request.getPassword() != null && !request.getPassword().isEmpty())
                ? request.getPassword()
                : "Agent@123456";

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setFullName(request.getFullName());
        user.setDepartment(request.getDepartment());
        user.setRole(UserRole.SUPPORT_AGENT);
        user.setStatus(UserStatus.ACTIVE);
        user.setIsDeleted(false);

        User savedUser = userRepository.save(user);
        log.info("Support agent registered successfully with id: {}", savedUser.getId());

        return mapToUserResponse(savedUser);
    }
}