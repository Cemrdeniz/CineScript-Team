import {
  fetchPopularMovies,
  fetchDailyTrending,
  fetchWeeklyTrending,
  fetchUpcomingMovies,
  searchMovies,
  fetchGenres,
  fetchMovieDetails,
  fetchMovieVideos,
} from '../api/tmdbApi.js';

let genreMap = null;

async function ensureGenreMap() {
  if (genreMap) return genreMap;
  const data = await fetchGenres();
  genreMap = {};
  if (data.genres && Array.isArray(data.genres)) {
    data.genres.forEach(g => {
      genreMap[g.id] = g.name;
    });
  }
  return genreMap;
}

function getLibrary() {
  const data = localStorage.getItem('library');
  return data ? JSON.parse(data) : [];
}

function saveLibrary(library) {
  localStorage.setItem('library', JSON.stringify(library));
}

function toggleLibrary(movie, button) {
  let library = getLibrary();
  const movieId = movie.id;

  if (library.includes(movieId)) {
    library = library.filter(id => id !== movieId);
    button.textContent = 'Add to library';
    button.classList.remove('removed');
  } else {
    library.push(movieId);
    button.textContent = 'Remove from my library';
    button.classList.add('removed');
  }

  saveLibrary(library);
}

function updateButtonState(movie, button) {
  const library = getLibrary();
  if (library.includes(movie.id)) {
    button.textContent = 'Remove from my library';
    button.classList.add('removed');
  } else {
    button.textContent = 'Add to library';
    button.classList.remove('removed');
  }
}

export async function createMoviePopup(movie) {
  if (!movie || typeof movie !== 'object') {
    console.error('createMoviePopup: Geçersiz movie parametresi!', movie);
    return;
  }

  let template = document.querySelector('#popup-template');
  if (!template) {
    const isLocal = window.location.hostname === 'localhost';
    let popupPath = isLocal
      ? '/popup.html'
      : `/${window.location.pathname.split('/')[1]}/partials/popup.html`;

    try {
      const res = await fetch(popupPath);
      if (!res.ok) {
        console.error(
          `Popup.html yüklenemedi. Durum: ${res.status}, URL: ${res.url}`
        );
        throw new Error('Network response was not ok.');
      }
      const html = await res.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const popupOverlay = tempDiv.querySelector('.movie-popup-overlay');
      if (popupOverlay) {
        popupOverlay.id = 'popup-template';
        document.body.appendChild(popupOverlay);
        await showPopupFromTemplate(popupOverlay, movie);
      } else {
        console.error(
          'movie-popup-overlay bulunamadı, HTML içeriği eksik olabilir.'
        );
      }
    } catch (error) {
      console.error('Popup yüklenirken bir hata oluştu:', error);
    }
    return;
  }

  const popupOverlay = template.cloneNode(true);
  popupOverlay.id = '';
  await showPopupFromTemplate(popupOverlay, movie);
}

async function showPopupFromTemplate(popupOverlay, movie) {
  if (!movie || typeof movie !== 'object') {
    console.error('Geçersiz movie verisi:', movie);
    return;
  }

  popupOverlay.style.display = 'flex';

  // Görsel
  const img = popupOverlay.querySelector('.movie-popup-img');
  img.src = movie.poster_path
    ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
    : '';
  img.alt = movie.title || 'No title';

  // Başlık
  popupOverlay.querySelector('.movie-popup-title').textContent =
    movie.title || 'Untitled';

  // Vote/votes
  popupOverlay.querySelector('.vote-avg').textContent =
    movie.vote_average != null ? movie.vote_average.toFixed(1) : '-';
  popupOverlay.querySelector('.vote-count').textContent =
    movie.vote_count != null ? movie.vote_count : '-';

  // Popularity
  popupOverlay.querySelector('.popularity-value').textContent =
    movie.popularity != null ? movie.popularity.toFixed(1) : '-';

  // Genre
  let genreText = '-';
  if (movie.genre_names && Array.isArray(movie.genre_names)) {
    genreText = movie.genre_names.join(', ');
  } else if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
    const map = await ensureGenreMap();
    genreText = movie.genre_ids.map(id => map[id] || id).join(', ');
  }
  popupOverlay.querySelector('.genre-value').textContent = genreText;

  // About
  popupOverlay.querySelector('.about-value').textContent =
    movie.overview || 'No description.';

  // Library butonu
  const addBtn = popupOverlay.querySelector('.movie-popup-add-btn');
  if (addBtn) {
    updateButtonState(movie, addBtn);
    addBtn.addEventListener('click', function () {
      toggleLibrary(movie, this);
    });
  }

  // Kapatma butonu ve ikon davranışları
  const closeBtn = popupOverlay.querySelector('.movie-popup-close');
  const isLocal = window.location.hostname === 'localhost';
  const repoName = isLocal ? '' : window.location.pathname.split('/')[1];
  const basePath = isLocal ? '' : `/${repoName}`;

  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.querySelector('img').src = `${basePath}/img/svg/close-hover.svg`;
  });

  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.querySelector('img').src = `${basePath}/img/svg/close.svg`;
  });

  closeBtn.addEventListener('click', () => popupOverlay.remove());

  popupOverlay.addEventListener('mousedown', function (e) {
    if (e.target === popupOverlay) {
      popupOverlay.remove();
    }
  });

  // Ekrana ekle
  document.body.appendChild(popupOverlay);
}
