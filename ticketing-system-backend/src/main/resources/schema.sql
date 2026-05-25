-- ============================================================================
-- Ticketing System Database Schema
-- UPDATED: Uses status VARCHAR instead of active BOOLEAN
-- This preserves existing users when applied as a migration
-- ============================================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ticketing_system;

-- Use the database
USE ticketing_system;

-- ============================================================================
-- Users Table - UPDATED WITH STATUS COLUMN
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                     email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(50),
    notification_preferences JSON,
    role VARCHAR(50) NOT NULL DEFAULT 'CLIENT',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @user_status_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'status'
);
SET @status_stmt = IF(
    @user_status_exists = 0,
    'ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''ACTIVE''',
    'SELECT 1'
);
PREPARE stmt FROM @status_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- Tickets Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tickets (
                                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       title VARCHAR(255) NOT NULL,
    description LONGTEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    category VARCHAR(100),
    created_by BIGINT NOT NULL,
    assigned_to BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,

    -- Foreign Keys
    CONSTRAINT fk_ticket_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_ticket_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,

    -- Indexes for performance
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_by (created_by),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Comments Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
                                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        ticket_id BIGINT NOT NULL,
                                        user_id BIGINT NOT NULL,
                                        content LONGTEXT NOT NULL,
                                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
                                        CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,

    -- Indexes for performance
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Ticket Attachments Table (Optional - for future use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_attachments (
                                                  id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                  ticket_id BIGINT NOT NULL,
                                                  file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    uploaded_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_attachment_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachment_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE RESTRICT,

    -- Indexes
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_uploaded_by (uploaded_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- User Workload Table (for tracking agent workload)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_workload (
                                             id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             user_id BIGINT NOT NULL UNIQUE,
                                             open_tickets_count INT NOT NULL DEFAULT 0,
                                             high_priority_weight DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_workload_score DECIMAL(10, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Key
    CONSTRAINT fk_workload_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Index
    INDEX idx_total_workload (total_workload_score)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Ticket History Table (for audit trail and analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ticket_history (
                                              id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              ticket_id BIGINT NOT NULL,
                                              changed_by BIGINT NOT NULL,
                                              field_name VARCHAR(100) NOT NULL,
    old_value VARCHAR(500),
    new_value VARCHAR(500),
    changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,

    -- Indexes
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Email Notifications Table (for tracking sent emails)
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_notifications (
                                                   id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                   recipient_id BIGINT NOT NULL,
                                                   ticket_id BIGINT,
                                                   subject VARCHAR(255) NOT NULL,
    email_type VARCHAR(100) NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT',

    -- Foreign Keys
    CONSTRAINT fk_notification_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_recipient_id (recipient_id),
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_sent_at (sent_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INSERT DEFAULT TEST USERS (3 USERS: ADMIN, SUPPORT_AGENT, CLIENT)
-- ============================================================================
-- NOTE: All passwords are BCrypt hashed with workFactor 10
-- Password for all test users: "Demo@123456"
-- Hash: $2a$10$3fuJL/qZq7qPbDEQHo9zGuE8NjHVSKfDvNVVDLl0A6X8YGgVVL4oO
--
-- TEST CREDENTIALS:
-- 1. ADMIN:
--    Email: admin@ticketing.com
--    Password: Admin@123456
--    Hash: $2a$10$slYQmyNdGzin7olVN4yYyOj/iHEZVHV.W4xLlvBfzX7vN5Dqv2pAm
--
-- 2. SUPPORT AGENT:
--    Email: agent@ticketing.com
--    Password: Demo@123456
--    Hash: $2a$10$3fuJL/qZq7qPbDEQHo9zGuE8NjHVSKfDvNVVDLl0A6X8YGgVVL4oO
--
-- 3. CLIENT:
--    Email: client@ticketing.com
--    Password: Demo@123456
--    Hash: $2a$10$3fuJL/qZq7qPbDEQHo9zGuE8NjHVSKfDvNVVDLl0A6X8YGgVVL4oO

INSERT IGNORE INTO users (id, email, password, full_name, role, status, is_deleted, created_at, updated_at) VALUES
(1, 'admin@ticketing.com', '$2a$10$slYQmyNdGzin7olVN4yYyOj/iHEZVHV.W4xLlvBfzX7vN5Dqv2pAm', 'Administrator', 'ADMIN', 'ACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'agent@ticketing.com', '$2a$10$3fuJL/qZq7qPbDEQHo9zGuE8NjHVSKfDvNVVDLl0A6X8YGgVVL4oO', 'Support Agent', 'SUPPORT_AGENT', 'ACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'client@ticketing.com', '$2a$10$3fuJL/qZq7qPbDEQHo9zGuE8NjHVSKfDvNVVDLl0A6X8YGgVVL4oO', 'Client User', 'CLIENT', 'ACTIVE', FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
--
-- SUMMARY OF TEST USERS:
-- ============================================================================
--
-- 1. ADMIN (Full Control)
--    Email: admin@ticketing.com
--    Password: Admin@123456
--    Role: ADMIN
--    Status: ACTIVE
--    Dashboard: AdminDashboard - Create tickets, assign to agents, view all
--
-- 2. SUPPORT AGENT (Resolve Tickets)
--    Email: agent@ticketing.com
--    Password: Demo@123456
--    Role: SUPPORT_AGENT
--    Status: ACTIVE
--    Dashboard: AgentDashboard - View assigned tickets, resolve issues
--
-- 3. CLIENT (Submit Tickets)
--    Email: client@ticketing.com
--    Password: Demo@123456
--    Role: CLIENT
--    Status: ACTIVE
--    Dashboard: ClientDashboard - Submit tickets, track status
--
-- ============================================================================