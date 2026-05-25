package org.example.ticketingsystem.service;

import lombok.extern.slf4j.Slf4j;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class WorkloadService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public WorkloadService(TicketRepository ticketRepository, UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Integer calculateAgentWorkload(Long agentId) {
        List<Ticket> openTickets = ticketRepository.findByAssignedToAndStatusIn(agentId,
                List.of(TicketStatus.OPEN, TicketStatus.IN_PROGRESS));

        return openTickets.stream()
                .mapToInt(Ticket::getWorkloadPoints)
                .sum();
    }

    @Transactional(readOnly = true)
    public Map<Long, Integer> getAgentWorkloads() {
        Map<Long, Integer> workloads = new HashMap<>();

        // ⭐ FIX: Use UserStatus enum instead of active boolean
        // Only count agents that are:
        // 1. Not deleted (isDeleted = false)
        // 2. Status = ACTIVE (can login and receive assignments)
        // 3. Role = SUPPORT_AGENT or ADMIN
        userRepository.findAll().stream()
                .peek(user -> log.debug("Checking user: {} (deleted: {}, status: {}, role: {})",
                        user.getEmail(), user.getIsDeleted(), user.getStatus(), user.getRole()))
                .filter(user -> {
                    Boolean isDeleted = user.getIsDeleted();
                    UserStatus status = user.getStatus();

                    // ✅ Safe checks:
                    boolean notDeleted = isDeleted == null || !isDeleted;  // NULL → not deleted
                    boolean isActive = status == UserStatus.ACTIVE;        // Only ACTIVE users can receive tickets
                    boolean isAgent = user.getRole() == UserRole.SUPPORT_AGENT || user.getRole() == UserRole.ADMIN;

                    boolean passes = notDeleted && isActive && isAgent;

                    if (passes) {
                        log.info("✅ Agent QUALIFIES: {} (ID: {}, deleted: {}, status: {}, role: {})",
                                user.getFullName(), user.getId(), isDeleted, status, user.getRole());
                    } else {
                        log.debug("❌ Agent FILTERED OUT: {} - notDeleted:{} status:{} isAgent:{}",
                                user.getEmail(), notDeleted, status, isAgent);
                    }

                    return passes;
                })
                .forEach(agent -> {
                    Integer workload = calculateAgentWorkload(agent.getId());
                    log.info("Agent {} (ID: {}) has workload: {}", agent.getFullName(), agent.getId(), workload);
                    workloads.put(agent.getId(), workload);
                });

        log.info("Total agents found for assignment: {}", workloads.size());
        return workloads;
    }

    public Long assignToLeastBusyAgent() {
        Map<Long, Integer> workloads = getAgentWorkloads();

        if (workloads.isEmpty()) {
            log.error("❌ NO AGENTS AVAILABLE for ticket assignment!");
            return null;
        }

        // Find agent with minimum workload
        Long agentId = workloads.entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        if (agentId != null) {
            log.info("✅ Selected agent {} for assignment (workload: {})", agentId, workloads.get(agentId));
        }

        return agentId;
    }

    public void updateAgentWorkload(Long agentId) {
        Integer workload = calculateAgentWorkload(agentId);
        log.debug("Agent {} workload updated to: {}", agentId, workload);
    }

    @Transactional(readOnly = true)
    public AgentWorkloadInfo getLeastBusyAgentInfo() {
        Long agentId = assignToLeastBusyAgent();

        if (agentId == null) {
            return null;
        }

        Integer workload = calculateAgentWorkload(agentId);

        return new AgentWorkloadInfo(
                agentId,
                userRepository.findById(agentId).map(u -> u.getFullName()).orElse("Unknown"),
                workload,
                Math.toIntExact(ticketRepository.countByAssignedToAndStatus(agentId, TicketStatus.OPEN))
        );
    }

    @Transactional(readOnly = true)
    public List<AgentWorkloadInfo> getAllAgentWorkloads() {
        return getAgentWorkloads().entrySet().stream()
                .map(entry -> new AgentWorkloadInfo(
                        entry.getKey(),
                        userRepository.findById(entry.getKey()).map(u -> u.getFullName()).orElse("Unknown"),
                        entry.getValue(),
                        Math.toIntExact(ticketRepository.countByAssignedToAndStatus(entry.getKey(), TicketStatus.OPEN))
                ))
                .sorted((a, b) -> Integer.compare(a.getTotalWorkload(), b.getTotalWorkload()))
                .toList();
    }

    public static class AgentWorkloadInfo {
        private Long agentId;
        private String agentName;
        private Integer totalWorkload;
        private Integer openTicketsCount;

        public AgentWorkloadInfo(Long agentId, String agentName, Integer totalWorkload, Integer openTicketsCount) {
            this.agentId = agentId;
            this.agentName = agentName;
            this.totalWorkload = totalWorkload;
            this.openTicketsCount = openTicketsCount;
        }

        // Getters
        public Long getAgentId() { return agentId; }
        public String getAgentName() { return agentName; }
        public Integer getTotalWorkload() { return totalWorkload; }
        public Integer getOpenTicketsCount() { return openTicketsCount; }

        @Override
        public String toString() {
            return "AgentWorkloadInfo{" +
                    "agentId=" + agentId +
                    ", agentName='" + agentName + '\'' +
                    ", totalWorkload=" + totalWorkload +
                    ", openTicketsCount=" + openTicketsCount +
                    '}';
        }
    }
}