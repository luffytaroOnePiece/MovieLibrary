let cachedYouTubeVideos = null;

export const getCustomYouTubeVideos = async () => {
    if (cachedYouTubeVideos) return cachedYouTubeVideos;
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/luffytaroOnePiece/YouTube/main/src/data/videos.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        const allVideos = [];
        
        if (data && data.groups) {
            Object.values(data.groups).forEach(group => {
                if (group.categories) {
                    Object.values(group.categories).forEach(category => {
                        Object.values(category).forEach(videoList => {
                            if (Array.isArray(videoList)) {
                                allVideos.push(...videoList);
                            }
                        });
                    });
                }
            });
        }
        
        cachedYouTubeVideos = allVideos;
        return cachedYouTubeVideos;
    } catch (error) {
        console.error("Failed to fetch custom YouTube videos:", error);
        return [];
    }
};
