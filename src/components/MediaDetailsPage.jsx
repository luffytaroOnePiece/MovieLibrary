import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Check, Star, Calendar, Clock, X, Loader2 } from 'lucide-react';
import { getCredits, getImages, getDetails, getVideos, toggleWatchlist } from '../api/tmdbApi';
import { getCustomYouTubeVideos } from '../api/youtubeApi';
import ActorDetailsPage from './ActorDetailsPage';
import './MediaDetailsPage.css';

const MediaDetailsPage = ({ media, onBack, onMediaClick, watchedIds = new Set(), accountId, onToggleWatched }) => {
  const [credits, setCredits] = useState(null);
  const [images, setImages] = useState(null);
  const [fullDetails, setFullDetails] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [customYtVideos, setCustomYtVideos] = useState([]);
  const [isTogglingWatched, setIsTogglingWatched] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetailedData = async () => {
      const type = media.media_type || (media.name ? 'tv' : 'movie');

      const [credRes, imgRes, detailRes, vidRes] = await Promise.all([
        getCredits(media.id, type),
        getImages(media.id, type),
        getDetails(media.id, type),
        getVideos(media.id, type)
      ]);

      if (credRes) setCredits(credRes);
      if (imgRes) setImages(imgRes);
      if (detailRes) setFullDetails(detailRes);

      if (vidRes && vidRes.results) {
        const trailer = vidRes.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vidRes.results[0];
        if (trailer && trailer.site === 'YouTube') {
          setTrailerKey(trailer.key);
        }
      }
    };

    const fetchCustomVideos = async () => {
      const movieTitle = (media?.title || media?.name || media?.original_title || '').toLowerCase().trim();
      if (!movieTitle) return;

      const allYtVideos = await getCustomYouTubeVideos();
      const matchedVideos = allYtVideos.filter(v => v.title.toLowerCase().includes(movieTitle));
      setCustomYtVideos(matchedVideos);
    };

    if (media && media.id) {
      fetchDetailedData();
      fetchCustomVideos();
    }
  }, [media]);

  if (!media) return null;

  const displayData = fullDetails || media;
  const title = displayData.title || displayData.name;
  const backdropUrl = displayData.backdrop_path
    ? `https://image.tmdb.org/t/p/original${displayData.backdrop_path}`
    : '';

  const releaseYear = (displayData.release_date || displayData.first_air_date || '').split('-')[0];
  const genres = displayData.genres ? displayData.genres.map(g => g.name).join(', ') : '';
  const runtime = displayData.runtime;

  const isWatched = watchedIds.has(media.id);

  const handleToggleWatched = async () => {
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

  const topCast = credits?.cast ? credits.cast.slice(0, 15) : [];
  const backdrops = images?.backdrops ? images.backdrops : [];

  return (
    <div className="details-page-container fade-in">
      <div className="details-hero" style={{ backgroundImage: `url(${backdropUrl})` }}>
        <div className="details-hero-overlay" />

        <button className="details-back-btn" onClick={onBack}>
          <ArrowLeft size={20} /> Back
        </button>

        <div className="details-hero-content">
          <h1 className="details-title">{title}</h1>
          <div className="details-meta-redesigned">
            {/* ── Rating Block ── */}
            <div className="meta-group meta-group--rating">
              <div className="rating-card">
                <span className="rating-ring-lg">
                  <svg width="52" height="52" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.5" fill="none"
                      stroke={displayData.vote_average >= 7 ? '#10b981' : displayData.vote_average >= 5 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="2.5"
                      strokeDasharray={`${(displayData.vote_average / 10) * 97.4} 97.4`}
                      strokeLinecap="round"
                      transform="rotate(-90 18 18)"
                      style={{ transition: 'stroke-dasharray 1s ease' }}
                    />
                  </svg>
                  <span className="rating-number-lg">{displayData.vote_average.toFixed(1)}</span>
                </span>
                <div className="rating-text">
                  <span className="rating-score" style={{ color: displayData.vote_average >= 7 ? '#10b981' : displayData.vote_average >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {(displayData.vote_average * 10).toFixed(0)}%
                  </span>
                  <span className="rating-sublabel">TMDB Score</span>
                </div>
              </div>
              {displayData.vote_count > 0 && (
                <span className="vote-count">{displayData.vote_count.toLocaleString()} votes</span>
              )}
            </div>

            {/* ── Quick Facts ── */}
            <div className="meta-group meta-group--facts">
              {releaseYear && (
                <div className="fact-item">
                  <span className="fact-label">Year</span>
                  <span className="fact-value">{releaseYear}</span>
                </div>
              )}
              {runtime && (
                <>
                  <span className="fact-divider" />
                  <div className="fact-item">
                    <span className="fact-label">Runtime</span>
                    <span className="fact-value">{Math.floor(runtime / 60)}h {runtime % 60}m</span>
                  </div>
                </>
              )}
              {displayData.number_of_seasons && (
                <>
                  <span className="fact-divider" />
                  <div className="fact-item">
                    <span className="fact-label">Seasons</span>
                    <span className="fact-value">{displayData.number_of_seasons}</span>
                  </div>
                </>
              )}
              {displayData.status && (
                <>
                  <span className="fact-divider" />
                  <div className="fact-item">
                    <span className="fact-label">Status</span>
                    <span className="fact-value">{displayData.status}</span>
                  </div>
                </>
              )}
              {displayData.original_language && (
                <>
                  <span className="fact-divider" />
                  <div className="fact-item">
                    <span className="fact-label">Language</span>
                    <span className="fact-value">{displayData.original_language.toUpperCase()}</span>
                  </div>
                </>
              )}
            </div>

            {/* ── Genres ── */}
            {genres && (
              <div className="meta-group meta-group--genres">
                {displayData.genres.map(g => (
                  <span key={g.id} className="genre-pill">{g.name}</span>
                ))}
              </div>
            )}
          </div>
          <p className="details-overview">{displayData.overview}</p>
          <div className="details-actions">
            {trailerKey && (
              <button className="btn-primary" onClick={() => setShowTrailer(true)}>
                <Play size={20} fill="currentColor" /> Play Trailer
              </button>
            )}
            {accountId && (
              <button
                onClick={handleToggleWatched}
                disabled={isTogglingWatched}
                className="icon-btn-circle"
                style={{
                  background: isWatched ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.2)',
                  width: 'auto',
                  padding: '0 24px',
                  borderRadius: '30px',
                  display: 'flex',
                  gap: '8px',
                  color: isWatched ? '#10b981' : '#fff',
                  border: isWatched ? '1px solid #10b981' : '1px solid transparent',
                  cursor: isTogglingWatched ? 'not-allowed' : 'pointer',
                  opacity: isTogglingWatched ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {isTogglingWatched ? <Loader2 size={20} className="spinner-icon" /> : <Check size={20} />}
                {isWatched ? 'Watched' : 'Mark as Watched'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="details-sections">
        {topCast.length > 0 && (
          <div className="section-block">
            <h2 className="section-title">Top Cast</h2>
            <div className="cast-row">
              {topCast.map(actor => (
                <div
                  key={actor.cast_id || actor.id}
                  className="cast-card"
                  onClick={() => setSelectedActor(actor.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : 'https://via.placeholder.com/200x200?text=No+Photo'}
                    alt={actor.name}
                    className="cast-image"
                    loading="lazy"
                  />
                  <h4 className="cast-name">{actor.name}</h4>
                  <p className="cast-character">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {customYtVideos.length > 0 && (
          <div className="custom-youtube-section" style={{ padding: '0', marginTop: '40px' }}>
            <h2 className="section-title">Soundtrack & Videos</h2>
            <div className="custom-youtube-row">
              {customYtVideos.map((vid, idx) => (
                <div key={idx} className="yt-card" onClick={() => { setTrailerKey(vid.youtubeLinkID); setShowTrailer(true); }}>
                  <div className="yt-thumbnail-wrapper">
                    <img src={vid.thumbnail} alt={vid.title} className="yt-thumbnail" loading="lazy" />
                    <div className="yt-play-overlay"><Play size={32} fill="currentColor" /></div>
                    {vid.resolution && <span className="yt-resolution-badge">{vid.resolution}</span>}
                  </div>
                  <span className="yt-title">{vid.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {backdrops.length > 0 && (
          <div className="section-block" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Gallery</h2>
            <div className="gallery-grid">
              {backdrops.map((img, i) => (
                <img
                  key={i}
                  src={`https://image.tmdb.org/t/p/original${img.file_path}`}
                  alt="Gallery Item"
                  className="gallery-image"
                  loading="lazy"
                  onClick={() => setLightboxImage(`https://image.tmdb.org/t/p/original${img.file_path}`)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {showTrailer && trailerKey && (
        <div className="lightbox-overlay" onClick={() => setShowTrailer(false)}>
          <button className="lightbox-close" onClick={() => setShowTrailer(false)}><X size={32} /></button>
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

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}><X size={32} /></button>
          <img src={lightboxImage} alt="High Res Gallery" className="lightbox-image" onClick={e => e.stopPropagation()} />
        </div>
      )}

      {selectedActor && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', minHeight: '100vh', zIndex: 1000, background: 'var(--bg-primary)' }}>
          <ActorDetailsPage
            actorId={selectedActor}
            onBack={() => setSelectedActor(null)}
            onMediaClick={(m) => {
              setSelectedActor(null);
              if (onMediaClick) onMediaClick(m);
            }}
          />
        </div>
      )}

    </div>
  );
};

export default MediaDetailsPage;
