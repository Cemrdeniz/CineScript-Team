// burada ... kısmına yazılan js dosyalarındaki aktarılacak tanım isimleri gelecek. isimler virgül ile ayrılmalıdır.
// import { ... } from './header.js';
// import { ... } from './hero.js';
// import { ... } from './catalog-hero.js';
// import { ... } from './library-hero.js';
// import { ... } from './trends.js';
// import { ... } from './upcoming.js';
// import { ... } from './catalog.js';
// import { ... } from './library.js';
// import { ... } from './footer.js';

import { initCatalog } from './js/catalog.js';
import { createMoviePopup } from './js/popup.js';
import './js/library.js';
import { showLoader, hideLoader } from './js/loader.js';
// import { initScrollUpButton } from './js/scroll-up.js';


const themeButtons = document.querySelectorAll('[data-theme-option]');
const htmlEl = document.documentElement;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  htmlEl.setAttribute('data-theme', savedTheme);
}

themeButtons.forEach(button => {
  button.addEventListener('click', () => {
    const selectedTheme = button.getAttribute('data-theme-option');
    htmlEl.setAttribute('data-theme', selectedTheme);
    localStorage.setItem('theme', selectedTheme);
  });
});

async function loadPartials() {
  const loads = document.querySelectorAll('load');
  for (const el of loads) {
    const src = el.getAttribute('src');
    if (src) {
      const res = await fetch(src);
      if (res.ok) {
        const html = await res.text();
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        el.replaceWith(wrapper);
      } else {
        console.error('Partial yüklenemedi:', src);
      }
    }
  }
}

loadPartials().then(() => {
  initCatalog();
});
