const audio = document.getElementById('audio');
const songList = document.getElementById('song-list');
const playlistContainer = document.getElementById('playlist-container');
const newPlaylistForm = document.getElementById('new-playlist-form');
const playlistNameInput = document.getElementById('playlist-name');

let allSongs = [];
let playlists = [];

fetch('/api/songs')
  .then(res => res.json())
  .then(songs => {
    allSongs = songs;
    renderSongList();
  });

fetch('/api/playlists')
  .then(res => res.json())
  .then(data => {
    playlists = Array.isArray(data) ? data : [];
    renderPlaylists();
  });

function renderSongList() {
  songList.innerHTML = '';
  allSongs.forEach(song => {
    const li = document.createElement('li');
    li.textContent = decodeURIComponent(song);

    // Add "Add" button
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.className = 'song-action-btn';
    addBtn.onclick = (e) => {
      e.stopPropagation();
      const select = document.getElementById('active-playlist-select');
      const idx = select.value;
      if (idx === "") {
        alert('Select a playlist first!');
        return;
      }
      if (!playlists[idx].songs.includes(song)) {
        playlists[idx].songs.push(song);
        renderPlaylists();
        savePlaylists();
      }
    };

    // Use flex: put song name on left, button on right
    li.innerHTML = `<span>${decodeURIComponent(song)}</span>`;
    li.appendChild(addBtn);
    li.onclick = () => playSong(song);
    songList.appendChild(li);
  });
}

function playSong(song) {
  audio.src = `music/${song}`;
  audio.play();
}

newPlaylistForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = playlistNameInput.value.trim();
  if (!name) return;

  playlists.push({ name, songs: [] });
  playlistNameInput.value = '';
  renderPlaylists();
  savePlaylists(); // <-- Add this line
});

// Example: playlists is an array of { name: string, songs: [string] }
let currentPlaylist = [];
let currentSongIndex = 0;

function playPlaylist(songs) {
  if (!songs || songs.length === 0) return;
  currentPlaylist = songs;
  currentSongIndex = 0;
  playCurrentSong();
}

function playCurrentSong() {
  const audio = document.getElementById('audio');
  if (currentPlaylist.length === 0) return;
  audio.src = `/music/${currentPlaylist[currentSongIndex]}`;
  audio.play();
}

// When the current song ends, play the next one
document.getElementById('audio').addEventListener('ended', () => {
  if (currentPlaylist.length === 0) return;
  if (currentSongIndex < currentPlaylist.length - 1) {
    currentSongIndex++;
    playCurrentSong();
  } else {
    // Repeat from the beginning
    currentSongIndex = 0;
    playCurrentSong();
  }
});

document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentPlaylist.length > 0 && currentSongIndex > 0) {
    currentSongIndex--;
    playCurrentSong();
  }
});

document.getElementById('next-btn').addEventListener('click', () => {
  if (currentPlaylist.length > 0 && currentSongIndex < currentPlaylist.length - 1) {
    currentSongIndex++;
    playCurrentSong();
  }
});

// When rendering playlists, make them clickable
function renderPlaylists() {
  updatePlaylistDropdown();

  const playlistList = document.getElementById('playlist-list');
  playlistList.innerHTML = '';
  playlists.forEach((playlist, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${playlist.name}</strong>`;

    // Show songs in this playlist
    const songsUl = document.createElement('ul');
    songsUl.className = 'playlist-songs';
    if (playlist.songs.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.textContent = '(No songs)';
      songsUl.appendChild(emptyLi);
    } else {
      playlist.songs.forEach((song, songIdx) => {
        const songLi = document.createElement('li');
        songLi.textContent = decodeURIComponent(song);

        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✖';
        removeBtn.className = 'remove-btn';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          playlists[idx].songs.splice(songIdx, 1);
          renderPlaylists();
          savePlaylists();
        };

        songLi.innerHTML = `<span>${decodeURIComponent(song)}</span>`;
        songLi.appendChild(removeBtn);
        songsUl.appendChild(songLi);
      });
    }
    li.appendChild(songsUl);

    // Click to play the playlist
    li.onclick = () => playPlaylist(playlist.songs);

    playlistList.appendChild(li);
  });
}

function updatePlaylistDropdown() {
  const select = document.getElementById('active-playlist-select');
  const prevValue = select.value; // Save current selection
  select.innerHTML = '<option value="">Select playlist to add songs</option>';
  playlists.forEach((playlist, idx) => {
    const option = document.createElement('option');
    option.value = idx;
    option.textContent = playlist.name;
    select.appendChild(option);
  });
  // Restore previous selection if possible
  if (Array.from(select.options).some(opt => opt.value === prevValue)) {
    select.value = prevValue;
  }
}

function savePlaylists() {
  fetch('/api/playlists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(playlists)
  });
}
