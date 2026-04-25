import React, { useEffect, useState } from 'react';
import { X, Play, Info, Star, Calendar, Check, Loader2 } from 'lucide-react';
import { getVideos, toggleWatchlist } from '../api/tmdbApi';
import './MediaModal.css';

const MediaModal = ({ media, onClose, onShowFullDetails, watchedIds = new Set(), accountId, onToggleWatched }) => {
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);

  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';

    const fetchTrailer = async () => {
      const type = media?.media_type || (media?.name ? 'tv' : 'movie');
      if (!media || !media.id) return;
      const res = await getVideos(media.id, type);
      if (res && res.results) {
        const t = res.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || res.results[0];
        if (t && t.site === 'YouTube') {
          setTrailerKey(t.key);
        }
      }
    };
    fetchTrailer();

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [media]);

  if (!media) return null;

  const isWatched = watchedIds.has(media.id);

  const handleToggleWatched = async (e) => {
    e.stopPropagation();
    if (!accountId || isTogglingWatched) return;
    setIsTogglingWatched(true);
    try {
      const mediaType = media.media_type || (media.name ? 'tv' : 'movie');
      const newState = !isWatched;
      const res = await toggleWatchlist(accountId, mediaType, media.id, newState);
      const isSuccess = res && (res.success || [1, 12, 13].includes(res.status_code));
      if (isSuccess && onToggleWatched) {
        onToggleWatched(media.id, newState);
      } else if (!isSuccess) {
        console.error('Failed to toggle watchlist:', res);
      }
    } catch (err) {
      console.error('Toggle watched error:', err);
    } finally {
      setIsTogglingWatched(false);
    }
  };

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
            <div className="modal-meta-actions" style={{ flexWrap: 'wrap', gap: '12px', width: '100%' }}>
              {trailerKey && (
                <button className="btn-primary" onClick={() => setShowTrailer(true)}>
                  <Play size={20} fill="currentColor" /> Play Trailer
                </button>
              )}
              {onShowFullDetails && (
                <button
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '40px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: '#fff', fontSize: '1.1rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)' }}
                  onClick={onShowFullDetails}
                >
                  <Info size={20} /> Full Details
                </button>
              )}
              {accountId && (
                <button
                  onClick={handleToggleWatched}
                  disabled={isTogglingWatched}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '14px 28px', borderRadius: '40px',
                    background: isWatched ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    color: isWatched ? '#10b981' : '#fff',
                    fontSize: '1.05rem', fontWeight: 600,
                    border: isWatched ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.15)',
                    cursor: isTogglingWatched ? 'not-allowed' : 'pointer',
                    opacity: isTogglingWatched ? 0.6 : 1,
                    transition: 'all 0.3s ease'
                  }}
                >
                  {isTogglingWatched ? <Loader2 size={18} className="spinner-icon" /> : <Check size={18} />}
                  {isWatched ? 'Watched' : 'Mark as Watched'}
                </button>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto', fontSize: '1rem', color: '#fff', background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '30px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill="currentColor" /> {(media.vote_average * 10).toFixed(0)}% Match
                </span>
                {releaseYear && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> {releaseYear}</span>}
              </div>
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

      {showTrailer && trailerKey && (
        <div className="lightbox-overlay" style={{ zIndex: 3000 }} onClick={(e) => { e.stopPropagation(); setShowTrailer(false); }}>
          <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); setShowTrailer(false); }}><X size={32} /></button>
          <div className="video-container" onClick={e => e.stopPropagation()}>
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Trailer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaModal;
