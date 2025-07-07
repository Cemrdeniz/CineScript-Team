
import { fetchMovieDetails, fetchGenres as fetchGenresApi } from '../api/tmdbApi.js';
import { deleteMoviePopup } from './library-popup.js';

// ----------------------------
// 1. DOM ELEMENTLERİNİN SEÇİMİ
// ----------------------------
const libraryfilmList = document.getElementById('library-film-list');
const libraryplaceholder = document.getElementById('library-placeholder');
const librarygenreDropdown = document.querySelector('.library-custom-select');
const librarygenreDisplay = document.querySelector('.library-selected-option');
const librarygenreOptions = document.querySelector('.library-genre-options');
const loadMoreBtn = document.getElementById('load-more-btn');
const loadingIndicator = document.getElementById('library-loading');

let genreMap = null;
let allMovies = [];
let currentIndex = 0;
const itemsPerPage = 9;

// ----------------------------
// Yardımcı Fonksiyonlar
// ----------------------------
function showGenreDropdown() {
  librarygenreDropdown.style.visibility = 'visible';
}

function hideGenreDropdown() {
  librarygenreDropdown.style.visibility = 'hidden';
}

// -------------------------
// 2. TÜRLERİ YÜKLEME FONKSİYONU
// -------------------------
async function loadGenres() {
  if (genreMap) return genreMap;
  const data = await fetchGenresApi();
  genreMap = {};
  if (data.genres && Array.isArray(data.genres)) {
    data.genres.forEach(g => {
      genreMap[g.id] = g.name;
    });
  }
  return genreMap;
}

// ---------------------------
// 3. KÜTÜPHANE FİLMLERİNİ YÜKLEME
// ---------------------------
async function loadLibrary() {
  showLoading();
  hideGenreDropdown();
  librarygenreOptions.classList.add('hidden');

  const filmIds = JSON.parse(localStorage.getItem('library')) || [];

  if (filmIds.length === 0) {
    libraryplaceholder.style.display = 'flex';
    libraryfilmList.innerHTML = '';
    hideLoading();
    return;
  }

  libraryplaceholder.style.display = 'none';
  libraryfilmList.innerHTML = '';

  genreMap = await loadGenres();
  allMovies = [];
  const genreIdSet = new Set();

  for (const id of filmIds) {
    try {
      const movie = await fetchMovieDetails(id);
      allMovies.push(movie);

      if (movie.genres?.length) {
        movie.genres.forEach(g => genreIdSet.add(g.id));
      } else if (movie.genre_ids?.length) {
        movie.genre_ids.forEach(gid => genreIdSet.add(gid));
      }
    } catch (error) {
      console.error(`Film ${id} getirilemedi`, error);
    }
  }

  await populateGenres([...genreIdSet], '');
  currentIndex = 0;
  renderMovies();
  updateLoadMoreButton();
  showGenreDropdown();
  hideLoading();
}

// ---------------------------
// 4. TÜRLERİ DROPDOWN'A YERLEŞTİRME
// ---------------------------
async function populateGenres(genreIdsToShow, selectedGenreId = '') {
  try {
    const data = await fetchGenresApi();
    const allGenres = data.genres;
    librarygenreOptions.innerHTML = '';

    if (selectedGenreId) {
      const genreResetLi = document.createElement('li');
      genreResetLi.textContent = 'Genre';
      genreResetLi.dataset.id = '';
      genreResetLi.addEventListener('click', () => {
        librarygenreDisplay.childNodes[0].nodeValue = 'Genre';
        librarygenreOptions.classList.add('hidden');
        filterFilmsByGenre('');
      });
      librarygenreOptions.appendChild(genreResetLi);
    }

    allGenres.forEach(genre => {
      if (genreIdsToShow.includes(genre.id) && genre.id !== Number(selectedGenreId)) {
        const li = document.createElement('li');
        li.textContent = genre.name;
        li.dataset.id = genre.id;
        li.addEventListener('click', () => {
          librarygenreDisplay.childNodes[0].nodeValue = genre.name;
          librarygenreOptions.classList.add('hidden');
          filterFilmsByGenre(genre.id);
        });
        librarygenreOptions.appendChild(li);
      }
    });
  } catch (error) {
    console.error('Kategoriler alınamadı:', error);
  }
}

// ---------------------------------------
// 5. TÜRE GÖRE FİLMLERİ FİLTRELEME
// ---------------------------------------
async function filterFilmsByGenre(genreId) {
  showLoading();
  hideGenreDropdown();
  librarygenreOptions.classList.add('hidden');

  const filmIds = JSON.parse(localStorage.getItem('library')) || [];

  if (filmIds.length === 0) {
    libraryplaceholder.style.display = 'flex';
    libraryfilmList.innerHTML = '';
    hideLoading();
    return;
  }

  libraryplaceholder.style.display = 'none';
  libraryfilmList.innerHTML = '';
  allMovies = [];

  const genreIdNum = Number(genreId);

  for (const id of filmIds) {
    try {
      const movie = await fetchMovieDetails(id);
      const genreIds = movie.genres?.map(g => g.id) || movie.genre_ids || [];

      if (!genreId || genreIds.includes(genreIdNum)) {
        allMovies.push(movie);
      }
    } catch (error) {
      console.error(`Film ${id} getirilemedi`, error);
    }
  }

  currentIndex = 0;
  renderMovies();
  updateLoadMoreButton();

  if (allMovies.length === 0) {
    libraryplaceholder.style.display = 'flex';
  }

  const genreIdSet = new Set();
  allMovies.forEach(movie => {
    if (movie.genres?.length) {
      movie.genres.forEach(g => genreIdSet.add(g.id));
    } else if (movie.genre_ids?.length) {
      movie.genre_ids.forEach(gid => genreIdSet.add(gid));
    }
  });

  await populateGenres([...genreIdSet], genreIdNum);
  showGenreDropdown();
  hideLoading();
}

// --------------------------
// 6. SAYFALAYARAK FİLM GÖSTERME
// --------------------------
function renderMovies() {
  const nextIndex = currentIndex + itemsPerPage;
  const moviesToShow = allMovies.slice(currentIndex, nextIndex);

  moviesToShow.forEach(movie => {
    const card = createMovieCard(movie, genreMap);
    libraryfilmList.appendChild(card);
  });

  currentIndex = nextIndex;
}

function updateLoadMoreButton() {
  if (!loadMoreBtn) return;
  loadMoreBtn.style.display = currentIndex >= allMovies.length ? 'none' : 'block';
}

// --------------------------
// 7. FİLM KARTI OLUŞTURMA
// --------------------------
function createMovieCard(movie, genreMap) {
  const li = document.createElement('li');
  li.classList.add('library-item');

  const imgSrc = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image';

  const releaseYear = movie.release_date?.split('-')[0] || 'Bilinmiyor';
  const rating = movie.vote_average || 0;
  const genreNames = movie.genres?.map(g => g.name).join(', ') || 'Tür bilinmiyor';

  const stars = getStarIcons(rating);

  li.innerHTML = `
    <img src="${imgSrc}" alt="${movie.title}" class="library-film-poster" />
    <div class="library-overlay">
      <h3 class="library-film-title">${movie.title}</h3>
      <div class="library-bottom-row">
        <p class="library-film-info">${genreNames} | ${releaseYear}</p>
        <div class="library-stars">${stars}</div>
      </div>
    </div>
  `;

  li.addEventListener('click', () => {
    deleteMoviePopup(movie, genreMap);
  });

  return li;
}

// --------------------
// 8. YILDIZLAR
// --------------------
const ICON_PATHS = {
  full: './img/svg/star.svg',
  half: './img/svg/star-half.svg',
  empty: './img/svg/star-outline.svg',
};

function getStarIcons(vote) {
  const fullStars = Math.floor(vote / 2);
  const halfStar = vote % 2 >= 1 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;

  return (
    `<img class="star-icon full" src="${ICON_PATHS.full}" alt="star" />`.repeat(fullStars) +
    `<img class="star-icon half" src="${ICON_PATHS.half}" alt="half star" />`.repeat(halfStar) +
    `<img class="star-icon empty" src="${ICON_PATHS.empty}" alt="empty star" />`.repeat(emptyStars)
  );
}

// -----------------------------
// 9. LOADING YARDIMCILARI
// -----------------------------
function showLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'block';
}

function hideLoading() {
  if (loadingIndicator) loadingIndicator.style.display = 'none';
}

// -----------------------------
// 10. DOM YÜKLENDİĞİNDE
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
  librarygenreDisplay.childNodes[0].nodeValue = 'Genre';
  loadLibrary();

  const goHomeBtn = document.getElementById('go-to-catalog');
  if (goHomeBtn) {
    goHomeBtn.addEventListener('click', () => {
      window.location.href = 'catalog.html';
    });
  }

  librarygenreDisplay.addEventListener('click', () => {
    librarygenreOptions.classList.toggle('hidden');
  });
Q
  loadMoreBtn.addEventListener('click', () => {
    renderMovies();
    updateLoadMoreButton();
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.library-custom-select')) {
      librarygenreOptions.classList.add('hidden');
    }
  });
});
