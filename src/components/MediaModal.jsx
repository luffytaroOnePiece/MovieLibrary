import React, { useEffect } from 'react';
import { X, Play, Plus, ThumbsUp, Info } from 'lucide-react';
import './MediaModal.css';

const MediaModal = ({ media, onClose, onShowFullDetails }) => {
  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!media) return null;

  const backdropUrl = media.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${media.backdrop_path}` 
    : '';
    
  const title = media.title || media.name;
  const releaseYear = (media.release_date || media.first_air_date || '').split('-')[0];
  const genres = media.genres ? media.genres.map(g => g.name).join(', ') : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="modal-hero">
          <div 
            className="modal-backdrop" 
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
          <div className="modal-gradient" />
          
          <div className="modal-hero-content">
            <h2 className="title-large modal-title">{title}</h2>
            <div className="modal-meta-actions">
              <button className="btn-primary">
                <Play size={20} fill="currentColor" /> Play
              </button>
              <button className="icon-btn-circle">
                <Plus size={24} />
              </button>
              <button className="icon-btn-circle">
                <ThumbsUp size={20} />
              </button>
              {onShowFullDetails && (
                <button className="icon-btn-circle" onClick={onShowFullDetails} title="Full Details">
                  <Info size={24} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-body">
          <div className="modal-info-main">
            <div className="modal-stats">
              <span className="match-score">{(media.vote_average * 10).toFixed(0)}% Match</span>
              <span className="release-year">{releaseYear}</span>
              {media.runtime && <span className="duration">{Math.floor(media.runtime / 60)}h {media.runtime % 60}m</span>}
              <span className="quality-badge">HD</span>
            </div>
            <p className="modal-overview text-regular">{media.overview}</p>
          </div>
          
          <div className="modal-info-side">
            {genres && (
              <div className="info-item">
                <span className="info-label">Genres: </span>
                <span className="info-value">{genres}</span>
              </div>
            )}
            {media.production_companies && media.production_companies.length > 0 && (
              <div className="info-item">
                <span className="info-label">Production: </span>
                <span className="info-value">{media.production_companies.map(c => c.name).slice(0, 3).join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaModal;
