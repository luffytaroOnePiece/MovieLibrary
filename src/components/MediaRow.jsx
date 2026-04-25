import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MediaRow.css';

const MediaRow = ({ title, items, onMediaClick, mediaType, watchedIds = new Set() }) => {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollTo = direction === 'left'
        ? scrollLeft - clientWidth + 100
        : scrollLeft + clientWidth - 100;

      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="media-row-container padded-container">
      <h2 className="title-medium row-title">{title}</h2>

      <div className="row-wrapper">
        <button className="slider-arrow left" onClick={() => scroll('left')}>
          <ChevronLeft size={32} />
        </button>

        <div className="row-posters" ref={rowRef}>
          {items.map((item) => {
            // Include mediaType so the click handler knows what it is even if not explicit in search results
            const enhancedItem = { ...item, media_type: item.media_type || mediaType };
            return (
              <div
                key={item.id}
                className="row-poster-wrap"
                onClick={() => onMediaClick(enhancedItem)}
              >
                <img
                  className={`row-poster ${item.backdrop_path ? 'backdrop' : 'portrait'}`}
                  src={
                    item.backdrop_path
                      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                      : item.poster_path
                        ? `https://image.tmdb.org/t/p/original${item.poster_path}`
                        : 'https://via.placeholder.com/500x281?text=No+Image'
                  }
                  alt={item.title || item.name}
                  loading="lazy"
                />
                <div className="poster-overlay">
                  <p className="poster-title">{item.title || item.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        <button className="slider-arrow right" onClick={() => scroll('right')}>
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
};

export default MediaRow;
