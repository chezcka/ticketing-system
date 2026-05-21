package org.example.ticketingsystem.controller;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.dto.*;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.service.UserService;
import org.example.ticketingsystem.util.JwtTokenProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class UserController {

    private final UserService userService;
    private final JwtTokenProvider jwtTokenProvider;

    public UserController(UserService userService,
                          JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    /**
     * Register new CLIENT user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(
            @RequestBody UserRegisterRequest request) {

        try {
            log.info("Registering new user with email: {}", request.getEmail());

            User user = userService.registerUserReturnEntity(request);

            String token = jwtTokenProvider.generateToken(user);

            LoginResponse response = new LoginResponse();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFullName(user.getFullName());
            response.setRole(user.getRole().toString());
            response.setToken(token);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(
                            true,
                            "User registered successfully",
                            response
                    ));

        } catch (IllegalArgumentException e) {

            log.error("Registration error: {}", e.getMessage());

            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));

        } catch (Exception e) {

            log.error("Unexpected registration error: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            false,
                            "Registration failed"
                    ));
        }
    }

    /**
     * Login user
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @RequestBody UserLoginRequest request) {

        try {
            log.info("Attempting login for user: {}", request.getEmail());

            User user = userService.loginUserReturnEntity(request);

            String token = jwtTokenProvider.generateToken(user);

            LoginResponse response = new LoginResponse();
            response.setId(user.getId());
            response.setEmail(user.getEmail());
            response.setFullName(user.getFullName());
            response.setRole(user.getRole().toString());
            response.setToken(token);

            log.info("User logged in successfully: {}", request.getEmail());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "Login successful",
                            response
                    )
            );

        } catch (IllegalArgumentException e) {

            log.error("Login error: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));

        } catch (Exception e) {

            log.error("Unexpected login error: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(
                            false,
                            "Login failed"
                    ));
        }
    }

    /**
     * Get current logged-in user
     * GET /api/auth/me
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            @RequestHeader("Authorization") String authHeader) {

        try {

            String token = authHeader.replace("Bearer ", "");

            Long userId = jwtTokenProvider.getUserIdFromToken(token);

            UserResponse user = userService.getUserById(userId);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "User retrieved successfully",
                            user
                    )
            );

        } catch (Exception e) {

            log.error("Error getting current user: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>(
                            false,
                            "Invalid token"
                    ));
        }
    }

    /**
     * Logout user
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout() {

        return ResponseEntity.ok(
                new ApiResponse<>(
                        true,
                        "Logged out successfully"
                )
        );
    }

    /**
     * Get all users
     * GET /api/auth/users
     */
    @GetMapping("/users")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {

        try {

            List<UserResponse> users = userService.getAllUsers();

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "Users retrieved successfully",
                            users
                    )
            );

        } catch (Exception e) {

            log.error("Error fetching users: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>(
                            false,
                            "Failed to fetch users"
                    ));
        }
    }

    /**
     * Get user by ID
     * GET /api/auth/users/{id}
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @PathVariable Long id) {

        try {

            UserResponse user = userService.getUserById(id);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "User retrieved successfully",
                            user
                    )
            );

        } catch (IllegalArgumentException e) {

            log.error("User not found: {}", id);

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));
        }
    }

    /**
     * Update user
     * PUT /api/auth/users/{id}
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @RequestBody UserUpdateRequest request) {

        try {

            UserResponse updatedUser = userService.updateUser(id, request);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "User updated successfully",
                            updatedUser
                    )
            );

        } catch (IllegalArgumentException e) {

            log.error("Error updating user: {}", e.getMessage());

            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));
        }
    }

    /**
     * Soft delete user
     * DELETE /api/auth/users/{id}
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id) {

        try {

            userService.softDeleteUser(id);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "User deleted successfully"
                    )
            );

        } catch (IllegalArgumentException e) {

            log.error("Error deleting user: {}", e.getMessage());

            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));
        }
    }

    /**
     * Restore soft deleted user
     * POST /api/auth/users/{id}/restore
     */
    @PostMapping("/users/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> restoreUser(
            @PathVariable Long id) {

        try {

            UserResponse restoredUser = userService.restoreUser(id);

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "User restored successfully",
                            restoredUser
                    )
            );

        } catch (IllegalArgumentException e) {

            log.error("Error restoring user: {}", e.getMessage());

            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));
        }
    }

    /**
     * Update user role
     * PUT /api/auth/users/{id}/role
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @RequestBody UserRoleRequest request) {

        try {

            UserResponse updatedUser =
                    userService.updateUserRole(id, request.getRole());

            return ResponseEntity.ok(
                    new ApiResponse<>(
                            true,
                            "User role updated",
                            updatedUser
                    )
            );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));
        }
    }

    /**
     * Register SUPPORT_AGENT
     * POST /api/auth/register-agent
     */
    @PostMapping("/register-agent")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPORT_AGENT')")
    public ResponseEntity<ApiResponse<UserResponse>> registerAgent(
            @RequestBody RegisterAgentRequest request) {

        try {

            log.info("Creating support agent: {}", request.getEmail());

            UserRegisterRequest registerRequest = new UserRegisterRequest();
            registerRequest.setEmail(request.getEmail());
            registerRequest.setPassword(request.getPassword());
            registerRequest.setFullName(request.getFullName());

            UserResponse createdUser =
                    userService.registerSupportAgent(registerRequest);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>(
                            true,
                            "Support agent created successfully",
                            createdUser
                    ));

        } catch (IllegalArgumentException e) {

            log.error("Error creating support agent: {}", e.getMessage());

            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>(
                            false,
                            e.getMessage()
                    ));
        }
    }
}