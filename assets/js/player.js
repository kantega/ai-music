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
  const lyricsEl = document.getElementById('lyrics');
  const artistCommentsEl = document.getElementById('artist-comments');
  const playlistEl = document.getElementById('playlist');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const progress = document.getElementById('progress');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  const volumeEl = document.getElementById('volume');

  let playlist = [];
  let current = -1;
  let isPlaying = false;

  // Utility time formatter
  function formatTime(s){
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s/60);
    const sec = Math.floor(s % 60).toString().padStart(2,'0');
    return `${m}:${sec}`;
  }

  async function loadPlaylist(){
    try{
      const res = await fetch('data/songs.json', {cache: 'no-cache'});
      if(!res.ok) throw new Error('Failed to fetch songs.json: ' + res.status);
      playlist = await res.json();
    }catch(err){
      console.error(err);
      playlist = [];
    }
    renderPlaylist();
    if(playlist.length) loadTrack(0);
  }

  function renderPlaylist(){
    playlistEl.innerHTML = '';
    playlist.forEach((t, i) => {
      const li = document.createElement('li');
      li.textContent = (t.title || t.src || `Track ${i+1}`) + (t.artist ? ' — ' + t.artist : '');
      li.dataset.index = i;
      li.addEventListener('click', () => loadTrack(i, true));
      playlistEl.appendChild(li);
    });
    updateActive();
  }

  function updateActive(){
    Array.from(playlistEl.children).forEach(li => {
      li.classList.toggle('active', Number(li.dataset.index) === current);
    });
  }

  async function loadTrack(index, autoplay=false){
    if (index < 0 || index >= playlist.length) return;
    current = index;
    const t = playlist[index];
    audio.src = t.src;
    titleEl.textContent = t.title || '';
    artistEl.textContent = t.artist || '';
    albumEl.textContent = t.album || '';
    if(t.cover){
      coverEl.src = t.cover;
      coverEl.style.display = '';
    } else {
      coverEl.src = '';
      coverEl.style.display = 'none';
    }
    // lyrics can be a string or a URL
    if(!t.lyrics){
      lyricsEl.textContent = 'Ingen lyrikk angitt.';
    } else if(typeof t.lyrics === 'string' && (t.lyrics.startsWith('http://') || t.lyrics.startsWith('https://') || t.lyrics.endsWith('.txt') || t.lyrics.endsWith('.lrc'))){
      try{
        const r = await fetch(t.lyrics);
        if(r.ok){
          const txt = await r.text();
          lyricsEl.textContent = txt || 'Ingen lyrikk angitt.';
        } else {
          lyricsEl.textContent = 'Ingen lyrikk angitt.';
        }
      }catch(e){
        lyricsEl.textContent = 'Ingen lyrikk angitt.';
      }
    } else {
      // inline lyrics text
      lyricsEl.textContent = t.lyrics;
    }

    // artist comments can be a string or a URL
    if(!t.artist_comments){
      artistCommentsEl.textContent = 'Ingen kommentarer tilgjengelig.';
    } else if(typeof t.artist_comments === 'string' && (t.artist_comments.startsWith('http://') || t.artist_comments.startsWith('https://') || t.artist_comments.endsWith('.txt'))){
      try{
        const r = await fetch(t.artist_comments);
        if(r.ok){
          const txt = await r.text();
          artistCommentsEl.textContent = txt || 'Ingen kommentarer tilgjengelig.';
        } else {
          artistCommentsEl.textContent = 'Ingen kommentarer tilgjengelig.';
        }
      }catch(e){
        artistCommentsEl.textContent = 'Ingen kommentarer tilgjengelig.';
      }
    } else {
      // inline artist comments text
      artistCommentsEl.textContent = t.artist_comments;
    }

    updateActive();
    if(autoplay){
      audio.play().catch(()=>{/* autoplay might be blocked */});
      isPlaying = true;
      updatePlayButton();
    }
  }

  function updatePlayButton(){
    playBtn.textContent = isPlaying ? '⏸️' : '▶️';
  }

  // Event handlers
  playBtn.addEventListener('click', () => {
    if(!audio.src) return;
    if(audio.paused){
      audio.play();
    } else {
      audio.pause();
    }
  });

  prevBtn.addEventListener('click', () => {
    if(playlist.length === 0) return;
    loadTrack((current - 1 + playlist.length) % playlist.length, true);
  });

  nextBtn.addEventListener('click', () => {
    if(playlist.length === 0) return;
    loadTrack((current + 1) % playlist.length, true);
  });

  audio.addEventListener('play', () => {
    isPlaying = true; updatePlayButton();
  });
  audio.addEventListener('pause', () => {
    isPlaying = false; updatePlayButton();
  });

  audio.addEventListener('timeupdate', () => {
    if(!isFinite(audio.duration)) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progress.value = pct;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('durationchange', () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener('ended', () => {
    // auto-next
    if(current < playlist.length - 1) loadTrack(current + 1, true);
    else {
      audio.currentTime = 0;
      audio.pause();
    }
  });

  progress.addEventListener('input', () => {
    if(!isFinite(audio.duration)) return;
    audio.currentTime = (progress.value / 100) * audio.duration;
  });

  volumeEl.addEventListener('input', () => {
    audio.volume = Number(volumeEl.value);
  });

  // initial volume
  audio.volume = Number(volumeEl.value);

  // Start
  loadPlaylist();

})();
