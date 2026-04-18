import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import MediaRow from './components/MediaRow';
import MediaModal from './components/MediaModal';
import MediaDetailsPage from './components/MediaDetailsPage';
import { Loader2 } from 'lucide-react';
import { getAccountDetails, getAccountWatchlist, getAccountLists, getListDetails, searchMulti, getDetails } from './api/tmdbApi';
import './App.css';

// Using fetchTmdb wrapper indirectly, we need endpoint helpers for trending, etc.
// Since tmdbApi has some built-ins but no getTrending, let's just make a simple fetch for the ones we need here or use existing


// A tiny helper to fetch generic endpoints not covered by tmdbApi.js but using its TMDB_READ_ACCESS_TOKEN
const fetchCustom = async (endpoint) => {
  const token = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;
  const res = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`
    }
  });
  return res.json();
};

function App() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [topRatedTv, setTopRatedTv] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularTv, setPopularTv] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [activeTab, setActiveTab] = useState('Home');
  const [accountId, setAccountId] = useState(null);
  const [myListMovies, setMyListMovies] = useState([]);
  const [myListTv, setMyListTv] = useState([]);
  const [customLists, setCustomLists] = useState([]);
  const [selectedCustomList, setSelectedCustomList] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [fullPageMedia, setFullPageMedia] = useState(null);

  useEffect(() => {
    // Fetch initial data
    const loadHomeData = async () => {
      try {
        const trendingRes = await fetchCustom('/trending/movie/week?language=en-US');
        if (trendingRes && trendingRes.results) setTrendingMovies(trendingRes.results);

        const tvRes = await fetchCustom('/tv/top_rated?language=en-US&page=1');
        if (tvRes && tvRes.results) setTopRatedTv(tvRes.results);

        const popMoviesRes = await fetchCustom('/movie/popular?language=en-US&page=1');
        if (popMoviesRes && popMoviesRes.results) setPopularMovies(popMoviesRes.results);

        const popTvRes = await fetchCustom('/tv/popular?language=en-US&page=1');
        if (popTvRes && popTvRes.results) setPopularTv(popTvRes.results);
      } catch (err) {
        console.error("Failed to load home data:", err);
      }
    };

    const fetchAccountData = async () => {
      try {
        const accountInfo = await getAccountDetails();
        if (accountInfo && accountInfo.id) {
          setAccountId(accountInfo.id);
          
          const movies = await getAccountWatchlist(accountInfo.id, 1, 'movies');
          if (movies && movies.results) setMyListMovies(movies.results);
          
          const tv = await getAccountWatchlist(accountInfo.id, 1, 'tv');
          if (tv && tv.results) setMyListTv(tv.results);

          const listsRes = await getAccountLists(accountInfo.id, 1);
          if (listsRes && listsRes.results) {
            const enrichedLists = await Promise.all(
              listsRes.results.map(async (list) => {
                const details = await getListDetails(list.id, 1);
                const items = details?.items || details?.results || [];
                const latestItem = items.length > 0 ? items[0] : null;
                return {
                  ...list,
                  latest_backdrop: latestItem ? (latestItem.backdrop_path || latestItem.poster_path) : null
                };
              })
            );
            setCustomLists(enrichedLists);
          }
        }
      } catch (err) {
        console.error("Failed to load account watchlist:", err);
      }
    };

    loadHomeData();
    fetchAccountData();
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim().length === 0) {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const res = await searchMulti(searchQuery);
      if (res && res.results) {
        // Filter out people, keep movies and tv
        setSearchResults(res.results.filter(item => item.media_type !== 'person'));
      }
    };
    
    // Debounce search
    const timeoutId = setTimeout(handleSearch, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchFullListDetails = async (list) => {
    setIsLoadingList(true);
    let allItems = [];
    let page = 1;
    let totalPages = 1;
    let combinedDetails = null;

    try {
      do {
        const details = await getListDetails(list.id, page);
        if (!details) break;

        if (!combinedDetails) combinedDetails = { ...details };
        
        const pageItems = details.items || details.results || [];
        allItems = [...allItems, ...pageItems];
        totalPages = details.total_pages || 1;
        page++;
      } while (page <= totalPages && page <= 50);

      if (combinedDetails) {
        combinedDetails.items = allItems;
        setSelectedCustomList(combinedDetails);
      }
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleMediaClick = async (media) => {
    // Fetch full details before showing modal
    const type = media.media_type || (media.name ? 'tv' : 'movie');
    const details = await getDetails(media.id, type);
    setSelectedMedia({ ...media, ...details, media_type: type });
  };

  const closeMenu = () => setSelectedMedia(null);

  const heroMovie = trendingMovies.length > 0 ? trendingMovies[0] : null;

  const renderContent = () => {
    if (isSearching) {
      return (
        <div className="search-results-section padded-container">
          <h2 className="title-medium search-title">Results for "{searchQuery}"</h2>
          <div className="media-grid">
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <div key={item.id} className="grid-item" onClick={() => handleMediaClick(item)}>
                  <img 
                    src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                    alt={item.title || item.name} 
                    className="grid-poster"
                    loading="lazy"
                  />
                  <div className="grid-info">
                    <p className="grid-title">{item.title || item.name}</p>
                    <p className="grid-year">{((item.release_date || item.first_air_date) || '').split('-')[0]}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-results">No results found.</p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'Movies') {
      return (
        <>
          {popularMovies.length > 0 && <HeroBanner movie={popularMovies[0]} onClick={() => handleMediaClick({ ...popularMovies[0], media_type: 'movie' })} />}
          <div className="rows-container">
            <MediaRow title="Trending Movies" items={trendingMovies} onMediaClick={handleMediaClick} mediaType="movie" />
            <MediaRow title="Popular Movies" items={popularMovies.slice(1)} onMediaClick={handleMediaClick} mediaType="movie" />
          </div>
        </>
      );
    }

    if (activeTab === 'TV Shows') {
      return (
        <>
          {popularTv.length > 0 && <HeroBanner movie={popularTv[0]} onClick={() => handleMediaClick({ ...popularTv[0], media_type: 'tv' })} />}
          <div className="rows-container">
            <MediaRow title="Popular TV Shows" items={popularTv.slice(1)} onMediaClick={handleMediaClick} mediaType="tv" />
            <MediaRow title="Top Rated TV Shows" items={topRatedTv} onMediaClick={handleMediaClick} mediaType="tv" />
          </div>
        </>
      );
    }

    if (activeTab === 'My List') {
      if (isLoadingList) {
        return (
          <div className="search-results-section padded-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={48} className="spinner-icon" />
            <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '18px' }}>Loading your list...</p>
          </div>
        );
      }

      if (selectedCustomList) {
        return (
          <div className="search-results-section padded-container" style={{ paddingTop: '100px' }}>
            <button 
              onClick={() => setSelectedCustomList(null)}
              style={{ background: 'var(--glass-bg)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '16px', border: '1px solid var(--glass-border)', marginBottom: '20px', cursor: 'pointer' }}
            >
              &larr; Back to Lists
            </button>
            <h2 className="title-medium search-title">{selectedCustomList.name}</h2>
            {(()=>{
              const listItems = selectedCustomList.items || selectedCustomList.results || [];
              return listItems.length > 0 ? (
                <div className="media-grid">
                  {listItems.map(item => (
                    <div key={item.id} className="grid-item" onClick={() => handleMediaClick(item)}>
                      <img 
                        src={item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Image'} 
                        alt={item.title || item.name} 
                        className="grid-poster"
                        loading="lazy"
                      />
                      <div className="grid-info">
                        <p className="grid-title">{item.title || item.name}</p>
                        <p className="grid-year">{((item.release_date || item.first_air_date) || '').split('-')[0]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-results">This list is empty.</p>
              )
            })()}
          </div>
        );
      }

      const hasCustomLists = customLists.length > 0;

      if (!hasCustomLists) {
        return (
          <div className="search-results-section padded-container" style={{ minHeight: '60vh' }}>
            <h2 className="title-medium search-title">My List</h2>
            <p className="no-results">Your list is currently empty.</p>
          </div>
        );
      }

      return (
        <div style={{ paddingTop: '100px' }} className="padded-container">
          {hasCustomLists && (
            <div style={{ marginBottom: '40px' }}>
              <div className="custom-lists-grid">
                {customLists.map(list => {
                  const imagePath = list.latest_backdrop || list.backdrop_path || list.poster_path;
                  const imageUrl = imagePath 
                    ? `https://image.tmdb.org/t/p/original${imagePath}` 
                    : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop';
                  return (
                    <div 
                      key={list.id} 
                      className="custom-list-card"
                      onClick={() => fetchFullListDetails(list)}
                    >
                      <img src={imageUrl} alt={list.name} className="custom-list-bg" loading="lazy" />
                      <div className="custom-list-overlay" />
                      <div className="custom-list-content">
                        <h3 className="custom-list-name">{list.name}</h3>
                        <p className="custom-list-count">{list.item_count} Items</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default Home Tab
    return (
      <>
        {heroMovie && <HeroBanner movie={heroMovie} onClick={() => handleMediaClick({ ...heroMovie, media_type: 'movie' })} />}
        <div className="rows-container">
          <MediaRow title="Trending Movies" items={trendingMovies.slice(1)} onMediaClick={handleMediaClick} mediaType="movie" />
          <MediaRow title="Top Rated TV Shows" items={topRatedTv} onMediaClick={handleMediaClick} mediaType="tv" />
        </div>
      </>
    );
  };

  return (
    <div className="app-container">
      {fullPageMedia ? (
        <MediaDetailsPage 
          media={fullPageMedia} 
          onBack={() => setFullPageMedia(null)}
          onMediaClick={(m) => setFullPageMedia(m)}
        />
      ) : (
        <>
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="main-content">
            {renderContent()}
          </main>
          {selectedMedia && <MediaModal media={selectedMedia} onClose={closeMenu} onShowFullDetails={() => { setFullPageMedia(selectedMedia); closeMenu(); }} />}
        </>
      )}
    </div>
  );
}

export default App;
