import { useState, useEffect } from 'react';
import * as commentService from '../../services/commentService';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import './CommentSection.css';

export default function CommentSection({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadComments();
  }, [ticketId]);

  const loadComments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await commentService.getCommentsByTicket(ticketId);
      setComments(data || []);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async (content) => {
    try {
      const newComment = await commentService.addComment(ticketId, content);
      setComments([...comments, newComment]);
    } catch (err) {
      throw new Error('Failed to add comment');
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-title">Comments ({comments.length})</h3>

      <CommentForm onSubmit={handleAddComment} />

      {isLoading && <p className="comment-loading">Loading comments...</p>}
      {error && <p className="comment-error">{error}</p>}

      <div className="comments-list">
        {comments.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}