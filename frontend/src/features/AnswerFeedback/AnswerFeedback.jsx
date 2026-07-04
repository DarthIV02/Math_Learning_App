import { useEffect } from 'react';
import './AnswerFeedback.css';

export default function AnswerFeedback({ feedback, onClear }) {
  useEffect(() => {
    if (!feedback) return;

    const timeout = setTimeout(() => {
      onClear?.();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [feedback, onClear]);

  if (!feedback) return null;

  let icon = ''; // Default to nothing

  if (feedback) {
    if (feedback.type === 'correct') {
      icon = '🎉';
    } else if (feedback.type === 'incorrect') {
      icon = '🤔';
    } else if (feedback.type === 'attempt') {
      icon = null;
    }
  }

  return (
    <div className={`answer-feedback-bubble answer-feedback-bubble--${feedback.type}`}>
      {icon && <span className="answer-feedback-bubble__icon">{icon}</span>}
      <span className="answer-feedback-bubble__text">{feedback.message}</span>
    </div>
  );
}