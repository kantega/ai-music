/* Simple web music player
 * Expects a JSON file at data/songs.json with an array of tracks.
 *
 * Track object example:
 * {
 *   "src": "music/song1.mp3",
 *   "title": "Song One",
 *   "artist": "Artist",
 *   "album": "Album",
 *   "cover": "music/covers/song1.jpg",         // optional
 *   "lyrics": "These are the lyrics...",       // or a URL to a .txt or .lrc file
 *   "artist_comments": "Artist's thoughts..."  // or a URL to a .txt file
 * }
 */
(() => {
  const audio = document.getElementById('audio');
  const titleEl = document.getElementById('title');
  const artistEl = document.getElementById('artist');
  const albumEl = document.getElementById('album');
  const coverEl = document.getElementById('cover');
  const coverPlaceholderEl = document.getElementById('cover-placeholder');
  const lyricsEl = document.getElementById('lyrics');
  const artistCommentsEl = document.getElementById('artist-comments');
  const playlistEl = document.getElementById('playlist');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const progress = document.getElementById('progress');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const toggleCommentsBtn = document.getElementById('toggle-comments');
  const toggleLyricsBtn = document.getElementById('toggle-lyrics');

  // playlist is defined in playlist.js
  let current = -1;
  let isPlaying = false;

  // Utility time formatter
  function formatTime(s) {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  function loadPlaylist() {
    renderPlaylist();
    if (playlist.length) loadTrack(0);
  }

  function renderPlaylist() {
    playlistEl.innerHTML = '';
    playlist.forEach((t, i) => {
      const li = document.createElement('li');
      li.dataset.index = i;
      li.addEventListener('click', () => loadTrack(i, true));

      // Create title element
      const titleEl = document.createElement('div');
      titleEl.className = 'song-title';
      titleEl.textContent = t.title || t.src || `Track ${i + 1}`;

      // Create artist element
      const artistEl = document.createElement('div');
      artistEl.className = 'song-artist';
      artistEl.textContent = t.artist || '';

      // Append elements to list item
      li.appendChild(titleEl);
      li.appendChild(artistEl);

      playlistEl.appendChild(li);
    });
    updateActive();
  }

  function updateActive() {
    Array.from(playlistEl.children).forEach(li => {
      const isActive = Number(li.dataset.index) === current;
      li.classList.toggle('active', isActive);

      // Scroll active item to near the top
      if (isActive) {
        li.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest'
        });
      }
    });
  }

  function loadTrack(index, autoplay = false) {
    if (index < 0 || index >= playlist.length) return;
    current = index;
    const t = playlist[index];
    audio.src = t.src;
    titleEl.textContent = t.title || '';
    artistEl.textContent = t.artist || '';
    albumEl.textContent = t.album || '';
    if (t.cover) {
      coverEl.src = t.cover;
      coverEl.style.display = 'block';
      if (coverPlaceholderEl) coverPlaceholderEl.style.display = 'none';
    } else {
      coverEl.removeAttribute('src');
      coverEl.style.display = 'none';
      if (coverPlaceholderEl) coverPlaceholderEl.style.display = 'flex';
    }
    if (!t.lyrics) {
      lyricsEl.textContent = 'Ingen sangtekst angitt.';
    } else {
      lyricsEl.textContent = t.lyrics;
    }

    if (!t.artist_comments) {
      artistCommentsEl.textContent = 'Ingen kommentarer tilgjengelig.';
    } else {
      artistCommentsEl.textContent = t.artist_comments;
    }

    updateActive();
    if (autoplay) {
      audio.play().catch(() => {/* autoplay might be blocked */ });
      isPlaying = true;
      updatePlayButton();
    }
  }

  function updatePlayButton() {
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
  }

  // Event handlers
  playBtn.addEventListener('click', () => {
    if (!audio.src) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    loadTrack((current - 1 + playlist.length) % playlist.length, true);
  });

  nextBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    loadTrack((current + 1) % playlist.length, true);
  });

  audio.addEventListener('play', () => {
    isPlaying = true; updatePlayButton();
  });
  audio.addEventListener('pause', () => {
    isPlaying = false; updatePlayButton();
  });

  audio.addEventListener('timeupdate', () => {
    if (!isFinite(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.value = pct;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('durationchange', () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    // auto-next
    if (current < playlist.length - 1) loadTrack(current + 1, true);
    else {
      audio.currentTime = 0;
      audio.pause();
    }
  });

  progress.addEventListener('input', () => {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  // Toggle artist comments
  toggleCommentsBtn.addEventListener('click', () => {
    artistCommentsEl.classList.toggle('collapsed');
    toggleCommentsBtn.textContent = artistCommentsEl.classList.contains('collapsed') ? '▶' : '▼';
  });

  // Toggle lyrics
  toggleLyricsBtn.addEventListener('click', () => {
    lyricsEl.classList.toggle('collapsed');
    toggleLyricsBtn.textContent = lyricsEl.classList.contains('collapsed') ? '▶' : '▼';
  });

  // Toggle playlist
  const togglePlaylistBtn = document.getElementById('toggle-playlist');
  if (togglePlaylistBtn && playlistEl) {
    togglePlaylistBtn.addEventListener('click', () => {
      playlistEl.classList.toggle('collapsed');
      togglePlaylistBtn.textContent = playlistEl.classList.contains('collapsed') ? '▶' : '▼';
    });
  }

  // Make section headers clickable to toggle
  document.querySelectorAll('.section-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling to header
    });
  });

  // Make section headers clickable
  document.querySelectorAll('section h3').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const section = header.parentElement;
      const content = section.querySelector('.collapsible-content, ul#playlist');
      const toggleBtn = header.querySelector('.toggle-btn');

      if (content && toggleBtn) {
        content.classList.toggle('collapsed');
        toggleBtn.textContent = content.classList.contains('collapsed') ? '▶' : '▼';
      }
    });
  });

  // Initialize collapsed state based on screen size
  function initializeCollapsibleSections() {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      // On mobile, collapse lyrics by default
      lyricsEl.classList.add('collapsed');
      toggleLyricsBtn.textContent = '▶';
    }
  }

  // Initialize on load
  initializeCollapsibleSections();

  // Re-initialize on window resize (debounced)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initializeCollapsibleSections, 250);
  });

  // Start
  loadPlaylist();

})();
