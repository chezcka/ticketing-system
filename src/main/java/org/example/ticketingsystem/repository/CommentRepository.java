package org.example.ticketingsystem.repository;

import org.example.ticketingsystem.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    /** Find all comments for a specific ticket **/
    List<Comment> findByTicketId(Long ticketId);

    /** Find all comments by a specific user **/
    List<Comment> findByUserId(Long userId);

    /** Count comments on a ticket **/
    Long countByTicketId(Long ticketId);

    /** Delete all comments for a ticket (when ticket is deleted) **/
    void deleteByTicketId(Long ticketId);
}