import { timeAgo } from '../../utils/formatters';
import './CommentItem.css';

export default function CommentItem({ comment }) {
  return (
    <div className="comment-item">
      <div className="comment-avatar">
        {comment.author?.[0]?.toUpperCase() || 'U'}
      </div>
      
      <div className="comment-content">
        <div className="comment-header">
          <strong className="comment-author">{comment.author || 'Unknown'}</strong>
          <span className="comment-time">{timeAgo(comment.createdAt)}</span>
        </div>
        
        <p className="comment-text">{comment.content}</p>
      </div>
    </div>
  );
}