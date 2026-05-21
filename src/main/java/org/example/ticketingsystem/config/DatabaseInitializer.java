package org.example.ticketingsystem.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Slf4j
@Configuration
public class DatabaseInitializer {

    @Bean
    public CommandLineRunner initializeDatabase(JdbcTemplate jdbcTemplate, BCryptPasswordEncoder passwordEncoder) {
        return args -> {
            try {
                log.info("🔄 Initializing database with test users...");

                // Generate fresh BCrypt hashes
                String adminPassword = passwordEncoder.encode("Admin@123456");
                String agentPassword = passwordEncoder.encode("Agent@123456");
                String clientPassword = passwordEncoder.encode("Client@123456");

                log.info("Generated password hashes:");
                log.info("Admin: {}", adminPassword);
                log.info("Agent: {}", agentPassword);
                log.info("Client: {}", clientPassword);

                // Insert ADMIN user
                int adminRows = jdbcTemplate.update(
                        "INSERT IGNORE INTO users (id, email, password, full_name, role, active, is_deleted, created_at, updated_at) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                        1, "admin@ticketing.com", adminPassword,
                        "Administrator", "ADMIN", true, false
                );
                if (adminRows > 0) {
                    log.info("✅ Created ADMIN: admin@ticketing.com / Admin@123456");
                }

                // Insert SUPPORT_AGENT user
                int agentRows = jdbcTemplate.update(
                        "INSERT IGNORE INTO users (id, email, password, full_name, role, active, is_deleted, created_at, updated_at) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                        2, "agent@ticketing.com", agentPassword,
                        "Support Agent", "SUPPORT_AGENT", true, false
                );
                if (agentRows > 0) {
                    log.info("✅ Created AGENT: agent@ticketing.com / Agent@123456");
                }

                // Insert CLIENT user
                int clientRows = jdbcTemplate.update(
                        "INSERT IGNORE INTO users (id, email, password, full_name, role, active, is_deleted, created_at, updated_at) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                        3, "client@ticketing.com", clientPassword,
                        "Client User", "CLIENT", true, false
                );
                if (clientRows > 0) {
                    log.info("✅ Created CLIENT: client@ticketing.com / Client@123456");
                }

                if (adminRows == 0 && agentRows == 0 && clientRows == 0) {
                    log.info("✅ Database already initialized with users");
                } else {
                    log.info("✅ Test users initialized successfully!");
                }

            } catch (Exception e) {
                log.error("❌ Error initializing database: {}", e.getMessage(), e);
            }
        };
    }
}