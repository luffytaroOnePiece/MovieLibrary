import React, { useEffect, useState } from 'react';
import { ArrowLeft, Play, Plus, Star, Calendar, Clock, X } from 'lucide-react';
import { getCredits, getImages, getDetails, getVideos } from '../api/tmdbApi';
import './MediaDetailsPage.css';

const MediaDetailsPage = ({ media, onBack }) => {
  const [credits, setCredits] = useState(null);
  const [images, setImages] = useState(null);
  const [fullDetails, setFullDetails] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

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

    if (media && media.id) {
        fetchDetailedData();
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
          <div className="details-meta">
             <span className="details-rating"><Star size={16} fill="currentColor" /> {(displayData.vote_average * 10).toFixed(0)}% Match</span>
             {releaseYear && <span><Calendar size={16} /> {releaseYear}</span>}
             {runtime && <span><Clock size={16} /> {Math.floor(runtime / 60)}h {runtime % 60}m</span>}
             {genres && <span>{genres}</span>}
          </div>
          <p className="details-overview">{displayData.overview}</p>
          <div className="details-actions">
             {trailerKey && (
               <button className="btn-primary" onClick={() => setShowTrailer(true)}>
                  <Play size={20} fill="currentColor" /> Play Trailer
               </button>
             )}
             <button className="icon-btn-circle" style={{ background: 'rgba(255,255,255,0.2)', width: 'auto', padding: '0 24px', borderRadius: '30px', display: 'flex', gap: '8px' }}>
                <Plus size={20} /> Add to List
             </button>
          </div>
        </div>
      </div>

      <div className="details-sections">
        {topCast.length > 0 && (
          <div className="section-block">
            <h2 className="section-title">Top Cast</h2>
            <div className="cast-row">
              {topCast.map(actor => (
                <div key={actor.cast_id || actor.id} className="cast-card">
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
          <button className="lightbox-close" onClick={() => setShowTrailer(false)}><X size={32}/></button>
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
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}><X size={32}/></button>
          <img src={lightboxImage} alt="High Res Gallery" className="lightbox-image" onClick={e => e.stopPropagation()} />
        </div>
      )}

    </div>
  );
};

export default MediaDetailsPage;
