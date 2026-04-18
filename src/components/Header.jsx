import React, { useState, useEffect } from 'react';
import { Search, Film, User, Bell } from 'lucide-react';
import './Header.css';

const Header = ({ searchQuery, setSearchQuery, activeTab, setActiveTab }) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simple quick clear
  const handleClear = () => setSearchQuery('');

  const handleNavClick = (e, tab) => {
    e.preventDefault();
    setActiveTab(tab);
    setSearchQuery(''); // clear search when navigating
  };

  return (
    <header className={`header glass-panel ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-content padded-container">
        
        <div className="logo-section" style={{cursor: 'pointer'}} onClick={(e) => handleNavClick(e, 'Home')}>
          <Film className="logo-icon" size={28} />
          <h1 className="logo-text"> MovieHub</h1>
        </div>

        <nav className="nav-links">
          <a href="#" className={`nav-link ${activeTab === 'Home' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'Home')}>Home</a>
          <a href="#" className={`nav-link ${activeTab === 'Movies' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'Movies')}>Movies</a>
          <a href="#" className={`nav-link ${activeTab === 'TV Shows' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'TV Shows')}>TV Shows</a>
          <a href="#" className={`nav-link ${activeTab === 'My List' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'My List')}>My List</a>
        </nav>

        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search movies, TV shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-btn" onClick={handleClear}>&times;</button>
            )}
          </div>
          
          <button className="icon-btn">
            <Bell size={20} />
          </button>
          
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;
