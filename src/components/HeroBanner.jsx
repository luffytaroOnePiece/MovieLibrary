import React from 'react';
import { Play, Info } from 'lucide-react';
import './HeroBanner.css';

const HeroBanner = ({ movie, onClick }) => {
  if (!movie) return null;

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` 
    : '';

  const title = movie.title || movie.name;
  const description = movie.overview;

  return (
    <div className="hero-banner">
      <div 
        className="hero-backdrop" 
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />
      <div className="hero-gradient-overlay" />
      
      <div className="hero-content padded-container">
        <h1 className="title-large hero-title">{title}</h1>
        <p className="text-regular hero-desc">
          {description?.length > 150 ? description.substring(0, 150) + '...' : description}
        </p>
        
        <div className="hero-actions">
          <button className="btn-primary" onClick={onClick}>
            <Play size={20} fill="currentColor" />
            <span>Play</span>
          </button>
          <button className="btn-secondary" onClick={onClick}>
            <Info size={20} />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner;
