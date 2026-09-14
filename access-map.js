(() => {
  const data = window.SITE_DATA || {};
  const visit = document.getElementById('visit');
  if (!visit) return;

  let section = document.getElementById('accessMap');
  if (!section) {
    section = document.createElement('section');
    section.className = 'accessMap';
    section.id = 'accessMap';
    section.innerHTML = `
      <div class="accessMap__head">
        <div>
          <small class="accessMap__eyebrow">ACCESS / MAP</small>
          <h2 class="accessMap__title">Venue<br>location.</h2>
        </div>
        <div class="accessMap__meta">
          <p class="accessMap__venue" id="accessMapVenue"></p>
          <p class="accessMap__address" id="accessMapAddress"></p>
          <a class="accessMap__link" id="visitMapLink" target="_blank" rel="noopener noreferrer">
            Open in Google Maps <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
      <div class="accessMap__canvas">
        <iframe id="visitMapFrame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
      </div>
      <div class="accessMap__caption">
        <span>MONTAGE / TOKYO</span>
        <span>Google Maps / English</span>
      </div>`;
    visit.insertAdjacentElement('afterend', section);
  }

  const iframe = document.getElementById('visitMapFrame');
  const link = document.getElementById('visitMapLink');
  const venueNode = document.getElementById('accessMapVenue');
  const addressNode = document.getElementById('accessMapAddress');
  if (!iframe || !link || !venueNode || !addressNode) return;

  const venue = data.venueName || 'Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F';
  const address = data.venueAddress || '〒105-7501 東京都港区海岸1-7-1';
  const mapQuery = data.venueMapQuery || `${venue}, Tokyo, Japan`;
  const encoded = encodeURIComponent(mapQuery);

  venueNode.textContent = venue;
  addressNode.textContent = address;
  iframe.src = `https://www.google.com/maps?hl=en&q=${encoded}&output=embed`;
  iframe.title = `${venue} Google Map`;
  link.href = `https://www.google.com/maps/search/?api=1&query=${encoded}&hl=en`;
})();
