package org.example.ticketingsystem.model;

/**
 * User account status
 * - ACTIVE: User can access the system
 * - INACTIVE: User cannot access (soft deleted/deactivated)
 * - SUSPENDED: User suspended by admin
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    SUSPENDED
}