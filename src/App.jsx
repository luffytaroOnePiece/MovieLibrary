import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import MediaRow from './components/MediaRow';
import MediaModal from './components/MediaModal';
import MediaDetailsPage from './components/MediaDetailsPage';
import AppleSelect from './components/AppleSelect';
import { Loader2 } from 'lucide-react';
import { getAccountDetails, getAccountWatchlist, getAccountLists, getListDetails, searchMulti, getDetails, batchToggleWatchlist } from './api/tmdbApi';
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
  const [isLoadingMyLists, setIsLoadingMyLists] = useState(true);
  const [fullPageMedia, setFullPageMedia] = useState(null);
  const [watchedIds, setWatchedIds] = useState(new Set());
  const [listSort, setListSort] = useState('default');
  const [listFilter, setListFilter] = useState('all');
  const [listSearchQuery, setListSearchQuery] = useState('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBulkIds, setSelectedBulkIds] = useState(new Set());
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

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
      setIsLoadingMyLists(true);
      try {
        const accountInfo = await getAccountDetails();
        if (accountInfo && accountInfo.id) {
          setAccountId(accountInfo.id);

          // Fetch ALL pages of watchlist movies
          let allWatchlistMovies = [];
          const moviesPage1 = await getAccountWatchlist(accountInfo.id, 1, 'movies');
          if (moviesPage1 && moviesPage1.results) {
            allWatchlistMovies = [...moviesPage1.results];
            if (moviesPage1.total_pages > 1) {
              const moviePagePromises = [];
              for (let p = 2; p <= Math.min(moviesPage1.total_pages, 50); p++) {
                moviePagePromises.push(getAccountWatchlist(accountInfo.id, p, 'movies'));
              }
              const moviePages = await Promise.all(moviePagePromises);
              moviePages.forEach(page => {
                if (page && page.results) allWatchlistMovies = allWatchlistMovies.concat(page.results);
              });
            }
          }
          setMyListMovies(allWatchlistMovies);

          // Fetch ALL pages of watchlist TV
          let allWatchlistTv = [];
          const tvPage1 = await getAccountWatchlist(accountInfo.id, 1, 'tv');
          if (tvPage1 && tvPage1.results) {
            allWatchlistTv = [...tvPage1.results];
            if (tvPage1.total_pages > 1) {
              const tvPagePromises = [];
              for (let p = 2; p <= Math.min(tvPage1.total_pages, 50); p++) {
                tvPagePromises.push(getAccountWatchlist(accountInfo.id, p, 'tv'));
              }
              const tvPages = await Promise.all(tvPagePromises);
              tvPages.forEach(page => {
                if (page && page.results) allWatchlistTv = allWatchlistTv.concat(page.results);
              });
            }
          }
          setMyListTv(allWatchlistTv);

          const listsRes = await getAccountLists(accountInfo.id, 1);
          if (listsRes && listsRes.results) {
            const tempWatched = new Set();

            // Treat ALL native TMDB Watchlist items as 'Watched'
            allWatchlistMovies.forEach(m => tempWatched.add(m.id));
            allWatchlistTv.forEach(t => tempWatched.add(t.id));

            const enrichedLists = await Promise.all(
              listsRes.results.map(async (list) => {
                const details = await getListDetails(list.id, 1);
                let items = details?.items || details?.results || [];

                // Fetch ALL pages of the list to ensure full tracking
                if (details && details.total_pages > 1) {
                  const pagePromises = [];
                  for (let p = 2; p <= Math.min(details.total_pages, 20); p++) {
                    pagePromises.push(getListDetails(list.id, p));
                  }
                  const pagesRes = await Promise.all(pagePromises);
                  pagesRes.forEach(page => {
                    if (page && (page.items || page.results)) {
                      items = items.concat(page.items || page.results);
                    }
                  });
                }

                const latestItem = items.length > 0 ? items[0] : null;

                if (list.name.toLowerCase() === 'watched' || list.name.toLowerCase() === 'watched list' || list.name.toLowerCase() === 'watch list') {
                  items.forEach(i => tempWatched.add(i.id));
                }

                return {
                  ...list,
                  latest_backdrop: latestItem ? (latestItem.backdrop_path || latestItem.poster_path) : null,
                  items
                };
              })
            );
            setWatchedIds(tempWatched);
            setCustomLists(enrichedLists);
          }
        }
      } catch (err) {
        console.error("Failed to load account watchlist:", err);
      } finally {
        setIsLoadingMyLists(false);
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
    if (isSelectionMode) {
      setSelectedBulkIds(prev => {
        const next = new Set(prev);
        if (next.has(media.id)) next.delete(media.id);
        else next.add(media.id);
        return next;
      });
      return;
    }

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
            <MediaRow title="Trending Movies" items={trendingMovies} onMediaClick={handleMediaClick} mediaType="movie" watchedIds={watchedIds} />
            <MediaRow title="Popular Movies" items={popularMovies.slice(1)} onMediaClick={handleMediaClick} mediaType="movie" watchedIds={watchedIds} />
          </div>
        </>
      );
    }

    if (activeTab === 'TV Shows') {
      return (
        <>
          {popularTv.length > 0 && <HeroBanner movie={popularTv[0]} onClick={() => handleMediaClick({ ...popularTv[0], media_type: 'tv' })} />}
          <div className="rows-container">
            <MediaRow title="Popular TV Shows" items={popularTv.slice(1)} onMediaClick={handleMediaClick} mediaType="tv" watchedIds={watchedIds} />
            <MediaRow title="Top Rated TV Shows" items={topRatedTv} onMediaClick={handleMediaClick} mediaType="tv" watchedIds={watchedIds} />
          </div>
        </>
      );
    }

    if (activeTab === 'My List') {
      if (isLoadingList || isLoadingMyLists) {
        return (
          <div className="search-results-section padded-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={48} className="spinner-icon" />
            <p style={{ marginTop: '20px', color: 'var(--text-secondary)', fontSize: '18px' }}>Loading your lists...</p>
          </div>
        );
      }

      if (selectedCustomList) {
        return (
          <div className="search-results-section padded-container" style={{ paddingTop: '100px', position: 'relative' }}>
            <button
              onClick={() => { setSelectedCustomList(null); setListSearchQuery(''); setIsSelectionMode(false); setSelectedBulkIds(new Set()); }}
              style={{ background: 'transparent', color: 'var(--text-secondary)', fontSize: '0.9rem', border: 'none', marginBottom: '20px', cursor: 'pointer', padding: 0 }}
            >
              &larr; Back to Lists
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <h2 className="title-medium search-title" style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '-0.5px' }}>{selectedCustomList.name}</h2>
              <div className="list-controls" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedBulkIds(new Set());
                  }}
                  style={{
                    background: isSelectionMode ? '#e50914' : 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff',
                    padding: '6px 16px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isSelectionMode ? 'Cancel Selection' : 'Select'}
                </button>
                )}
                <input
                  type="text"
                  placeholder="Search list..."
                  value={listSearchQuery}
                  onChange={(e) => setListSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)', color: '#fff', outline: 'none', padding: '8px 4px', fontSize: '1.05rem', width: '180px', transition: 'border 0.2s', placeholder: 'rgba(255,255,255,0.5)' }}
                  onFocus={(e) => e.target.style.borderBottom = '1px solid #fff'}
                  onBlur={(e) => e.target.style.borderBottom = '1px solid rgba(255,255,255,0.3)'}
                />
                <AppleSelect
                  value={listFilter}
                  onChange={setListFilter}
                  options={[
                    { value: 'all', label: 'All Default' },
                    { value: 'watched', label: 'Watched' },
                    { value: 'unwatched', label: 'Unwatched' }
                  ]}
                />
                <AppleSelect
                  value={listSort}
                  onChange={setListSort}
                  options={[
                    { value: 'default', label: 'Default Sort' },
                    { value: 'date', label: 'Release Date' },
                    { value: 'name', label: 'Name (A-Z)' },
                    { value: 'tmdb_rating', label: 'TMDB Rating' }
                  ]}
                />
              </div>
            </div>
            {(() => {
              let listItems = selectedCustomList.items || selectedCustomList.results || [];

              if (listSearchQuery) {
                const q = listSearchQuery.toLowerCase();
                listItems = listItems.filter(i => (i.title || i.name || '').toLowerCase().includes(q));
              }

              if (listFilter === 'watched') listItems = listItems.filter(i => watchedIds.has(i.id));
              if (listFilter === 'unwatched') listItems = listItems.filter(i => !watchedIds.has(i.id));
              if (listSort === 'name') listItems = [...listItems].sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name));
              if (listSort === 'date') listItems = [...listItems].sort((a, b) => new Date(b.release_date || b.first_air_date) - new Date(a.release_date || a.first_air_date));
              if (listSort === 'tmdb_rating') listItems = [...listItems].sort((a, b) => b.vote_average - a.vote_average);

              return listItems.length > 0 ? (
                <div className={`media-grid ${isSelectionMode ? 'selection-active' : ''}`}>
                  {listItems.map(item => {
                    const isSelected = selectedBulkIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        className="grid-item"
                        onClick={() => handleMediaClick(item)}
                        style={{
                          transform: isSelectionMode && !isSelected ? 'scale(0.95)' : 'scale(1)',
                          opacity: isSelectionMode && !isSelected ? 0.6 : 1,
                          border: isSelected ? '3px solid #e50914' : '3px solid transparent',
                          borderRadius: '16px',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {isSelected && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#e50914', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}><span style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold' }}>✓</span></div>}

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
                    )
                  })}
                </div>
              ) : (
                <p className="no-results">This list is empty or your search yielded no matches.</p>
              )
            })()}

            {import.meta.env.DEV && isSelectionMode && selectedBulkIds.size > 0 && (
              <div style={{
                position: 'fixed',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(30, 30, 30, 0.85)',
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '30px',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                zIndex: 1000
              }}>
                <span style={{ color: '#fff', fontWeight: '500', fontSize: '1.05rem' }}>{selectedBulkIds.size} Items Selected</span>
                <button
                  disabled={isSubmittingBulk}
                  onClick={async () => {
                    setIsSubmittingBulk(true);

                    const listItems = selectedCustomList.items || selectedCustomList.results || [];
                    const itemsToProcess = listItems.filter(i => selectedBulkIds.has(i.id));

                    const res = await batchToggleWatchlist(accountId, itemsToProcess, true);

                    if (res && res.success) {
                      setWatchedIds(prev => {
                        const next = new Set(prev);
                        itemsToProcess.forEach(i => next.add(i.id));
                        return next;
                      });
                    } else {
                      alert(`TMDB API Error: The watchlist write failed. Check your browser console. It is highly likely your TMDB Access Token in the .env file is strictly "Read Only" and requires Write/User permissions to modify watchlists!`);
                    }

                    setIsSubmittingBulk(false);
                    setIsSelectionMode(false);
                    setSelectedBulkIds(new Set());
                  }}
                  style={{
                    background: '#10b981', /* Green to indicate marking as watched */
                    border: 'none',
                    color: '#fff',
                    padding: '10px 24px',
                    borderRadius: '20px',
                    fontWeight: '600',
                    cursor: isSubmittingBulk ? 'disabled' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmittingBulk ? 0.7 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {isSubmittingBulk ? <Loader2 size={18} className="spinner-icon" /> : null}
                  {isSubmittingBulk ? 'Logging to memory...' : 'Mark as Watched'}
                </button>
              </div>
            )}
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

  const handleToggleWatched = (mediaId, newState) => {
    setWatchedIds(prev => {
      const next = new Set(prev);
      if (newState) {
        next.add(mediaId);
      } else {
        next.delete(mediaId);
      }
      return next;
    });
  };

  return (
    <div className="app-container">
      {fullPageMedia ? (
        <MediaDetailsPage
          media={fullPageMedia}
          onBack={() => setFullPageMedia(null)}
          onMediaClick={(m) => setFullPageMedia(m)}
          watchedIds={watchedIds}
          accountId={accountId}
          onToggleWatched={handleToggleWatched}
        />
      ) : (
        <>
          <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} activeTab={activeTab} setActiveTab={setActiveTab} />
          <main className="main-content">
            {renderContent()}
          </main>
          {selectedMedia && <MediaModal media={selectedMedia} onClose={closeMenu} onShowFullDetails={() => { setFullPageMedia(selectedMedia); closeMenu(); }} watchedIds={watchedIds} accountId={accountId} onToggleWatched={handleToggleWatched} />}
        </>
      )}
    </div>
  );
}

export default App;
