package org.example.ticketingsystem.service;

import org.example.ticketingsystem.model.Priority;
import org.example.ticketingsystem.model.Ticket;
import org.example.ticketingsystem.model.TicketStatus;
import org.example.ticketingsystem.model.User;
import org.example.ticketingsystem.model.UserRole;
import org.example.ticketingsystem.model.UserStatus;
import org.example.ticketingsystem.repository.TicketRepository;
import org.example.ticketingsystem.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WorkloadServiceTest {

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WorkloadService workloadService;

    private User agent1;
    private User agent2;
    private User adminUser;
    private User clientUser;

    @BeforeEach
    void setUp() {
        // Setup mock active support agents
        agent1 = new User();
        agent1.setId(1L);
        agent1.setEmail("agent1@example.com");
        agent1.setFullName("Support Agent One");
        agent1.setRole(UserRole.SUPPORT_AGENT);
        agent1.setStatus(UserStatus.ACTIVE);
        agent1.setIsDeleted(false);

        agent2 = new User();
        agent2.setId(2L);
        agent2.setEmail("agent2@example.com");
        agent2.setFullName("Support Agent Two");
        agent2.setRole(UserRole.SUPPORT_AGENT);
        agent2.setStatus(UserStatus.ACTIVE);
        agent2.setIsDeleted(false);

        // Setup mock admin user (should qualify for workload)
        adminUser = new User();
        adminUser.setId(3L);
        adminUser.setEmail("admin@example.com");
        adminUser.setFullName("Admin User");
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser.setIsDeleted(false);

        // Setup mock client user (should be filtered out)
        clientUser = new User();
        clientUser.setId(4L);
        clientUser.setEmail("client@example.com");
        clientUser.setFullName("Client User");
        clientUser.setRole(UserRole.CLIENT);
        clientUser.setStatus(UserStatus.ACTIVE);
        clientUser.setIsDeleted(false);
    }

    private Ticket createMockTicket(Priority priority) {
        Ticket ticket = new Ticket();
        ticket.setPriority(priority);
        return ticket;
    }

    @Test
    void testCalculateAgentWorkload_CalculatesPointsCorrectly() {
        Long agentId = 1L;
        Ticket ticketLow = createMockTicket(Priority.LOW);         // 1 point
        Ticket ticketMedium = createMockTicket(Priority.MEDIUM);   // 2 points
        Ticket ticketHigh = createMockTicket(Priority.HIGH);       // 3 points
        Ticket ticketCritical = createMockTicket(Priority.CRITICAL); // 5 points

        when(ticketRepository.findByAssignedToAndStatusIn(eq(agentId), anyList()))
                .thenReturn(List.of(ticketLow, ticketMedium, ticketHigh, ticketCritical));

        Integer expectedWorkload = 1 + 2 + 3 + 5; // 11
        Integer actualWorkload = workloadService.calculateAgentWorkload(agentId);

        assertEquals(expectedWorkload, actualWorkload);
        verify(ticketRepository, times(1)).findByAssignedToAndStatusIn(eq(agentId), anyList());
    }

    @Test
    void testCalculateAgentWorkload_EmptyTicketsReturnsZero() {
        Long agentId = 1L;
        when(ticketRepository.findByAssignedToAndStatusIn(eq(agentId), anyList()))
                .thenReturn(Collections.emptyList());

        Integer actualWorkload = workloadService.calculateAgentWorkload(agentId);

        assertEquals(0, actualWorkload);
    }

    @Test
    void testGetAgentWorkloads_FiltersAndCalculatesQualifyingAgents() {
        // Setup exceptional filter validation users
        User deletedAgent = new User();
        deletedAgent.setId(5L);
        deletedAgent.setRole(UserRole.SUPPORT_AGENT);
        deletedAgent.setStatus(UserStatus.ACTIVE);
        deletedAgent.setIsDeleted(true); // Filter out: Is deleted

        User suspendedAgent = new User();
        suspendedAgent.setId(6L);
        suspendedAgent.setRole(UserRole.SUPPORT_AGENT);
        suspendedAgent.setStatus(UserStatus.SUSPENDED); // Filter out: Suspended
        suspendedAgent.setIsDeleted(false);

        User nullDeletedAgent = new User(); // Should pass (null isDeleted -> defaults to true in safe check)
        nullDeletedAgent.setId(7L);
        nullDeletedAgent.setRole(UserRole.SUPPORT_AGENT);
        nullDeletedAgent.setStatus(UserStatus.ACTIVE);
        nullDeletedAgent.setIsDeleted(null);

        when(userRepository.findAll()).thenReturn(List.of(
                agent1, agent2, adminUser, clientUser, deletedAgent, suspendedAgent, nullDeletedAgent
        ));

        // Stub workload returns
        when(ticketRepository.findByAssignedToAndStatusIn(eq(1L), anyList())).thenReturn(List.of(createMockTicket(Priority.LOW))); // 1
        when(ticketRepository.findByAssignedToAndStatusIn(eq(2L), anyList())).thenReturn(List.of(createMockTicket(Priority.HIGH))); // 3
        when(ticketRepository.findByAssignedToAndStatusIn(eq(3L), anyList())).thenReturn(Collections.emptyList()); // 0
        when(ticketRepository.findByAssignedToAndStatusIn(eq(7L), anyList())).thenReturn(Collections.emptyList()); // 0

        Map<Long, Integer> workloads = workloadService.getAgentWorkloads();

        // 4 items should qualify: agent1, agent2, adminUser, nullDeletedAgent
        assertEquals(4, workloads.size());
        assertTrue(workloads.containsKey(1L));
        assertTrue(workloads.containsKey(2L));
        assertTrue(workloads.containsKey(3L));
        assertTrue(workloads.containsKey(7L));
        assertFalse(workloads.containsKey(4L)); // Client filtered out
        assertFalse(workloads.containsKey(5L)); // Deleted filtered out
        assertFalse(workloads.containsKey(6L)); // Suspended filtered out

        assertEquals(1, workloads.get(1L));
        assertEquals(3, workloads.get(2L));
        assertEquals(0, workloads.get(3L));
    }

    @Test
    void testAssignToLeastBusyAgent_SelectsCorrectAgent() {
        when(userRepository.findAll()).thenReturn(List.of(agent1, agent2));

        // Agent 1 has a heavy workload (5)
        when(ticketRepository.findByAssignedToAndStatusIn(eq(1L), anyList()))
                .thenReturn(List.of(createMockTicket(Priority.CRITICAL)));
        // Agent 2 has a low workload (1)
        when(ticketRepository.findByAssignedToAndStatusIn(eq(2L), anyList()))
                .thenReturn(List.of(createMockTicket(Priority.LOW)));

        Long assignedAgentId = workloadService.assignToLeastBusyAgent();

        assertEquals(2L, assignedAgentId); // Agent 2 is less busy
    }

    @Test
    void testAssignToLeastBusyAgent_NoAgentsAvailableReturnsNull() {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        Long assignedAgentId = workloadService.assignToLeastBusyAgent();

        assertNull(assignedAgentId);
    }

    @Test
    void testUpdateAgentWorkload_ExecutesWithoutException() {
        when(ticketRepository.findByAssignedToAndStatusIn(eq(1L), anyList()))
                .thenReturn(Collections.emptyList());

        assertDoesNotThrow(() -> workloadService.updateAgentWorkload(1L));
    }

    @Test
    void testGetLeastBusyAgentInfo_ReturnsCorrectMetrics() {
        when(userRepository.findAll()).thenReturn(List.of(agent1));
        when(userRepository.findById(1L)).thenReturn(Optional.of(agent1));
        when(ticketRepository.findByAssignedToAndStatusIn(eq(1L), anyList()))
                .thenReturn(List.of(createMockTicket(Priority.MEDIUM))); // Workload: 2
        when(ticketRepository.countByAssignedToAndStatus(1L, TicketStatus.OPEN)).thenReturn(1L);

        WorkloadService.AgentWorkloadInfo info = workloadService.getLeastBusyAgentInfo();

        assertNotNull(info);
        assertEquals(1L, info.getAgentId());
        assertEquals("Support Agent One", info.getAgentName());
        assertEquals(2, info.getTotalWorkload());
        assertEquals(1, info.getOpenTicketsCount());
        assertTrue(info.toString().contains("Support Agent One"));
    }

    @Test
    void testGetLeastBusyAgentInfo_NoAgentReturnsNull() {
        when(userRepository.findAll()).thenReturn(Collections.emptyList());

        WorkloadService.AgentWorkloadInfo info = workloadService.getLeastBusyAgentInfo();

        assertNull(info);
    }

    @Test
    void testGetAllAgentWorkloads_ReturnsSortedList() {
        when(userRepository.findAll()).thenReturn(List.of(agent1, agent2));
        when(userRepository.findById(1L)).thenReturn(Optional.of(agent1));
        when(userRepository.findById(2L)).thenReturn(Optional.of(agent2));

        // Agent 1 is busier than Agent 2
        when(ticketRepository.findByAssignedToAndStatusIn(eq(1L), anyList()))
                .thenReturn(List.of(createMockTicket(Priority.HIGH))); // 3 points
        when(ticketRepository.findByAssignedToAndStatusIn(eq(2L), anyList()))
                .thenReturn(List.of(createMockTicket(Priority.LOW)));  // 1 point

        when(ticketRepository.countByAssignedToAndStatus(anyLong(), eq(TicketStatus.OPEN))).thenReturn(2L);

        List<WorkloadService.AgentWorkloadInfo> allInfos = workloadService.getAllAgentWorkloads();

        assertEquals(2, allInfos.size());
        // Should be sorted by workload ascending (lowest workload first)
        assertEquals(2L, allInfos.get(0).getAgentId()); // Agent 2 (Workload 1)
        assertEquals(1L, allInfos.get(1).getAgentId()); // Agent 1 (Workload 3)
    }
}