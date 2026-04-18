import React, { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import { getPersonDetails, getPersonCredits, getPersonImages } from '../api/tmdbApi';
import { Play, Plus, X } from 'lucide-react';
import MediaRow from './MediaRow';
import './ActorDetailsPage.css';

const ActorDetailsPage = ({ actorId, onBack, onMediaClick }) => {
  const [details, setDetails] = useState(null);
  const [credits, setCredits] = useState(null);
  const [images, setImages] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchActorData = async () => {
      const [detailRes, credRes, imgRes] = await Promise.all([
        getPersonDetails(actorId),
        getPersonCredits(actorId),
        getPersonImages(actorId)
      ]);
      if (detailRes) setDetails(detailRes);
      if (credRes) setCredits(credRes);
      if (imgRes) setImages(imgRes);
    };

    if (actorId) {
      fetchActorData();
    }
  }, [actorId]);

  if (!details) return null;

  const profileUrl = details.profile_path 
    ? `https://image.tmdb.org/t/p/original${details.profile_path}`
    : 'https://via.placeholder.com/600x900?text=No+Photo';

  // Sort by date (descending)
  const combinedCast = credits?.cast 
    ? [...credits.cast]
        .filter(item => item.release_date || item.first_air_date) // Must have a date to sort
        .sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date);
          const dateB = new Date(b.release_date || b.first_air_date);
          return dateB - dateA;
        }) 
    : [];

  const profiles = images?.profiles || [];

  return (
    <div className="actor-page-container fade-in">
      <button className="actor-back-btn" onClick={onBack}>
        <ArrowLeft size={20} /> Back
      </button>

      <div className="actor-hero">
        <div className="actor-portrait-container">
          <img src={profileUrl} alt={details.name} className="actor-portrait" />
        </div>
        
        <div className="actor-info">
          <h1 className="actor-name">{details.name}</h1>
          <div className="actor-meta">
            {details.birthday && (
              <span><Calendar size={16} /> {details.birthday}</span>
            )}
            {details.place_of_birth && (
              <span><MapPin size={16} /> {details.place_of_birth}</span>
            )}
          </div>
          
          <div className="actor-bio">
            <h2 className="section-title">Biography</h2>
            <p className="bio-text">{details.biography || "We don't have a biography for this person."}</p>
          </div>
        </div>
      </div>

      <div className="actor-content-sections">
        {combinedCast.length > 0 && (
          <div className="actor-filmography">
            <h2 className="section-title" style={{ paddingLeft: '4%' }}>Known For</h2>
            <div className="filmography-grid">
              {combinedCast.map((item, index) => {
                 const year = (item.release_date || item.first_air_date || '').split('-')[0];
                 const title = item.title || item.name;
                 const poster = item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image';
                 return (
                   <div key={`${item.id}-${index}`} className="filmCard" onClick={() => onMediaClick(item)}>
                     <div className="filmCard-image-container">
                       <img src={poster} alt={title} className="filmCard-image" loading="lazy" />
                     </div>
                     <div className="filmCard-details">
                       <span className="filmCard-title">{title}</span>
                       <span className="filmCard-character">{item.character ? `as ${item.character}` : ''} {year ? `(${year})` : ''}</span>
                     </div>
                   </div>
                 );
              })}
            </div>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="actor-gallery-section" style={{ padding: '0 4%', marginTop: '40px' }}>
            <h2 className="section-title">Gallery</h2>
            <div className="actor-gallery-grid">
               {profiles.map((img, i) => (
                 <img 
                   key={i} 
                   src={`https://image.tmdb.org/t/p/w500${img.file_path}`} 
                   alt="Actor Gallery"
                   className="actor-gallery-image"
                   loading="lazy"
                   onClick={() => setLightboxImage(`https://image.tmdb.org/t/p/original${img.file_path}`)}
                 />
               ))}
            </div>
          </div>
        )}
      </div>

      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImage(null)}><X size={32}/></button>
          <img src={lightboxImage} alt="High Res Gallery" className="lightbox-image" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default ActorDetailsPage;
