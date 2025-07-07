import { fetchGenres } from "../api/tmdbApi.js";

// ------------------------------
// 1. Popup'u gösterme fonksiyonu
// ------------------------------
export async function deleteMoviePopup(movie, genreMap) {
  // Daha önce yüklenmiş popup template'ini seç
  let template = document.querySelector('#popup-template');

  // Eğer template yoksa, popup HTML dosyasını fetch et ve ekle
  if (!template) {
    const isLocal = window.location.hostname === 'localhost';
    const repoName = isLocal ? '' : window.location.pathname.split('/')[1];
    const popupPath = isLocal ? '/library-popup.html' : `/${repoName}/library-popup.html`;

    try {
      const res = await fetch(popupPath);
      if (!res.ok) {
        console.error(`Popup.html yüklenemedi. Durum: ${res.status}, URL: ${res.url}`);
        return;
      }

      const html = await res.text();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const popupOverlay = tempDiv.querySelector('.movie-popup-overlay');
      if (!popupOverlay) {
        console.error("movie-popup-overlay bulunamadı.");
        return;
      }

      // Template olarak body'ye ekle ve göster
      popupOverlay.id = 'popup-template';
      document.body.appendChild(popupOverlay);
      await showPopupFromTemplate(popupOverlay, movie, genreMap);

    } catch (error) {
      console.error("Popup yüklenirken bir hata oluştu:", error);
    }

    return;
  }

  // Template varsa klonla ve göster
  const popupOverlay = template.cloneNode(true);
  popupOverlay.id = '';
  await showPopupFromTemplate(popupOverlay, movie, genreMap);
}

// --------------------------------------------
// 2. Popup içeriğini doldurma ve event ekleme
// --------------------------------------------
async function showPopupFromTemplate(popupOverlay, movie, genreMap) {
  // Popup görünür yap
  popupOverlay.style.display = 'flex';

  // Poster ayarla
  const img = popupOverlay.querySelector('.movie-popup-img');
  img.src = movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : '';
  img.alt = movie.title;

  // Film başlığı, oylar ve popülerlik
  popupOverlay.querySelector('.movie-popup-title').textContent = movie.title;
  popupOverlay.querySelector('.vote-avg').textContent = movie.vote_average?.toFixed(1) ?? '-';
  popupOverlay.querySelector('.vote-count').textContent = movie.vote_count ?? '-';
  popupOverlay.querySelector('.popularity-value').textContent = movie.popularity?.toFixed(1) ?? '-';

  // Tür bilgisi oluşturma
  let genreText = '-';
  if (movie.genre_names?.length) {
    genreText = movie.genre_names.join(', ');
  } else if (movie.genres?.length) {
    genreText = movie.genres.map(g => g.name).join(', ');
  } else if (movie.genre_ids?.length) {
    genreText = movie.genre_ids.map(id => genreMap[id] || id).join(', ');
  }
  popupOverlay.querySelector('.genre-value').textContent = genreText;

  
  popupOverlay.querySelector('.about-value').textContent = movie.overview || 'No description.';

  // --------------------------
  // Remove butonuna işlev ekle
  // --------------------------
  const removeBtn = popupOverlay.querySelector('.movie-popup-add-btn.removed');
  if (removeBtn) {
    removeBtn.style.display = 'inline-block';

    removeBtn.onclick = () => {
      // LocalStorage'daki kütüphaneden filmi kaldır
      let library = JSON.parse(localStorage.getItem('library')) || [];
      library = library.filter(id => id !== movie.id);
      localStorage.setItem('library', JSON.stringify(library));

      // Popup'u kapat ve sayfayı yenile (isteğe bağlı)
      deleteMoviePopupClose();
      window.location.reload();
    };
  }

  // -----------------------------------------
  // Kapatma butonuna hover efektleri ve olaylar
  // -----------------------------------------
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

  closeBtn.addEventListener('click', () => deleteMoviePopupClose());

  // Popup arka planına tıklayınca kapat
  popupOverlay.addEventListener('mousedown', (e) => {
    if (e.target === popupOverlay) {
      deleteMoviePopupClose();
    }
  });

  // Popup'u DOM'a ekle
  document.body.appendChild(popupOverlay);
}

// -----------------------------
// 3. Popup kapatma fonksiyonu
// -----------------------------
export function deleteMoviePopupClose() {
  const popup = document.querySelector('.movie-popup-overlay') || document.querySelector('#popup-template');
  if (popup) popup.remove();
}
