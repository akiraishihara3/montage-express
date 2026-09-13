(() => {
  const data = window.SITE_DATA || {};
  const visit = document.getElementById('visit');
  if (!visit || document.getElementById('access-map')) return;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'access-map.css?v=20260913-1';
  document.head.appendChild(css);

  const venue = data.venueName || 'Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F';
  const address = data.venueAddress || '〒105-7501 東京都港区海岸1-7-1';
  const query = encodeURIComponent(`${venue} ${address}`);

  const section = document.createElement('section');
  section.className = 'accessMap';
  section.id = 'access-map';
  section.innerHTML = [
    '<div class="accessMap__head">',
      '<div>',
        '<small class="accessMap__eyebrow">ACCESS / MAP</small>',
        '<h2 class="accessMap__title">Venue<br>location.</h2>',
      '</div>',
      '<div class="accessMap__meta">',
        `<p class="accessMap__venue">${venue}</p>`,
        `<p class="accessMap__address">${address}</p>`,
        `<a class="accessMap__link" href="https://www.google.com/maps/search/?api=1&query=${query}" target="_blank" rel="noopener">Google Mapsで開く <span aria-hidden="true">↗</span></a>`,
      '</div>',
    '</div>',
    '<div class="accessMap__canvas">',
      `<iframe title="${venue} Google Map" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=${query}&output=embed"></iframe>`,
    '</div>',
    '<div class="accessMap__caption"><span>MONTAGE / TOKYO</span><span>Google Maps</span></div>'
  ].join('');

  visit.insertAdjacentElement('afterend', section);
})();
