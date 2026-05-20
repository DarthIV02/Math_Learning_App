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

  const icon = feedback.type === 'correct' ? '🎉' : '🤔';

  return (
    <div className={`answer-feedback-bubble answer-feedback-bubble--${feedback.type}`}>
      <span className="answer-feedback-bubble__icon">{icon}</span>
      <span className="answer-feedback-bubble__text">{feedback.message}</span>
    </div>
  );
}