import { useState } from 'react';
import { validateCommentForm } from '../../utils/validators';
import Alert from '../Common/Alert';
import './CommentForm.css';

export default function CommentForm({ onSubmit }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateCommentForm(content);
    if (Object.keys(errors).length > 0) {
      setError(errors.content);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      <div className="form-group">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          className="comment-input"
        />
      </div>

      <button 
        type="submit" 
        className="btn-comment"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Posting...' : 'Post Comment'}
      </button>
    </form>
  );
}