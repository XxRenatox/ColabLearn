import React, { useState } from 'react';
import { X, Star, MessageSquare } from 'lucide-react';
import { useToast } from '../../ui/Toast';

const SessionFeedbackModal = ({ isOpen, onClose, sessionData, onSubmitFeedback }) => {
  const { addToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  if (!isOpen || !sessionData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rating === 0) {
      addToast('Por favor selecciona una calificación antes de enviar', 'warning');
      return;
    }

    onSubmitFeedback({
      sessionId: sessionData.id,
      rating,
      comment: comment.trim(),
      sessionType: sessionData.type,
      duration: sessionData.duration
    });

    // Reset form
    setRating(0);
    setComment('');
    onClose();
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Muy mala',
      2: 'Mala',
      3: 'Regular',
      4: 'Buena',
      5: 'Excelente'
    };
    return texts[rating] || '';
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Feedback de Sesión</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Session Info */}
          <div className="text-center">
            <h3 className="font-medium text-gray-900">{sessionData.title}</h3>
            <p className="text-sm text-gray-600">
              {sessionData.duration} minutos • {sessionData.group}
            </p>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 text-center">
              ¿Cómo calificarías esta sesión?
            </label>

            <div className="flex justify-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {rating > 0 && (
              <p className="text-sm text-center text-gray-600">
                {getRatingText(rating)}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te pareció la sesión? ¿Qué podríamos mejorar?"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Omitir
            </button>
            <button
              type="submit"
              disabled={rating === 0}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Enviar Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionFeedbackModal;
