(() => {
  const data = window.SITE_DATA || {};
  const visit = document.getElementById('visit');
  if (!visit) return;

  const venue = data.venueName || 'Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F';
  const englishAddress = data.venueAddressEnglish || '1-7-1 Kaigan, Minato-ku, Tokyo 105-7501, Japan';
  const query = `${venue} ${englishAddress}`.trim();
  const encoded = encodeURIComponent(query);
  const apiKey = data.googleMapsApiKey || window.GOOGLE_MAPS_API_KEY || '';

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
      <div class="accessMap__canvas" id="visitMapCanvas" aria-label="English access map"></div>
      <div class="accessMap__caption">
        <span>MONTAGE / TOKYO</span>
        <span>English-only map</span>
      </div>`;
    visit.insertAdjacentElement('afterend', section);
  }

  const canvas = document.getElementById('visitMapCanvas');
  const link = document.getElementById('visitMapLink');
  const venueNode = document.getElementById('accessMapVenue');
  const addressNode = document.getElementById('accessMapAddress');
  if (!canvas || !link || !venueNode || !addressNode) return;

  venueNode.textContent = venue;
  addressNode.textContent = englishAddress;
  link.href = `https://www.google.com/maps/search/?api=1&query=${encoded}&hl=en`;

  const renderEnglishFallback = () => {
    canvas.classList.add('is-fallback');
    canvas.innerHTML = `
      <svg class="accessMap__svg" viewBox="0 0 1600 650" role="img" aria-label="English access map for Hamamatsucho-Kan">
        <rect width="1600" height="650" fill="#e8ecea"/>
        <path d="M1120 0 L1600 0 L1600 650 L1320 650 C1230 520 1160 390 1120 250 Z" fill="#dfe7e7"/>
        <path d="M0 490 C290 470 460 450 650 415 C875 372 1030 330 1290 260" fill="none" stroke="#ffffff" stroke-width="74"/>
        <path d="M190 0 C230 150 260 300 285 650" fill="none" stroke="#f7f7f5" stroke-width="58"/>
        <path d="M560 0 C585 155 590 330 590 650" fill="none" stroke="#f7f7f5" stroke-width="44"/>
        <path d="M845 0 C820 160 805 300 790 650" fill="none" stroke="#f7f7f5" stroke-width="34"/>
        <path d="M1040 30 C970 190 945 340 960 650" fill="none" stroke="#f7f7f5" stroke-width="28"/>
        <path d="M0 255 C420 270 705 250 1040 215 C1260 190 1430 150 1600 115" fill="none" stroke="#d1d8d3" stroke-width="20"/>
        <path d="M260 95 L1380 570" fill="none" stroke="#d8ddd9" stroke-width="14"/>
        <path d="M430 45 L410 610" fill="none" stroke="#c9d1cc" stroke-width="8" stroke-dasharray="12 18"/>
        <path d="M125 80 L120 590" fill="none" stroke="#bcc7c1" stroke-width="8"/>
        <rect x="662" y="150" width="215" height="185" rx="18" fill="#d3ddd3"/>
        <text x="770" y="228" text-anchor="middle" class="accessMap__label accessMap__label--small">Kyu Shiba Rikyu</text>
        <text x="770" y="258" text-anchor="middle" class="accessMap__label accessMap__label--small">Garden</text>

        <g class="accessMap__station">
          <circle cx="420" cy="356" r="11"/>
          <text x="420" y="392" text-anchor="middle">Hamamatsucho Station</text>
        </g>
        <g class="accessMap__station">
          <circle cx="1115" cy="205" r="11"/>
          <text x="1115" y="243" text-anchor="middle">Takeshiba Station</text>
        </g>
        <g class="accessMap__station">
          <circle cx="188" cy="234" r="11"/>
          <text x="188" y="272" text-anchor="middle">Daimon Station</text>
        </g>

        <g class="accessMap__venuePin" transform="translate(934 346)">
          <path d="M0 -55 C-36 -55 -63 -28 -63 6 C-63 52 0 116 0 116 C0 116 63 52 63 6 C63 -28 36 -55 0 -55Z"/>
          <circle cx="0" cy="6" r="20" fill="#f2f1ec"/>
        </g>
        <text x="934" y="494" text-anchor="middle" class="accessMap__venueLabel">Tokyo Metropolitan Industrial Trade Center</text>
        <text x="934" y="528" text-anchor="middle" class="accessMap__venueLabel">Hamamatsucho-Kan</text>
        <text x="934" y="558" text-anchor="middle" class="accessMap__label accessMap__label--small">1-7-1 Kaigan, Minato-ku, Tokyo</text>
      </svg>`;
  };

  const initGoogleMap = () => {
    if (!window.google?.maps) {
      renderEnglishFallback();
      return;
    }

    const map = new google.maps.Map(canvas, {
      zoom: 16,
      center: { lat: 35.655, lng: 139.762 },
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: 'cooperative',
      styles: [
        { elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { elementType: 'geometry', stylers: [{ color: '#e8ecea' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d2d9d4' }] },
        { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#dce2dc' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d2ddd2' }] },
        { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#cbd3ce' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dfe7e7' }] }
      ]
    });

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: query, region: 'JP' }, (results, status) => {
      if (status !== 'OK' || !results?.[0]) {
        renderEnglishFallback();
        return;
      }
      const location = results[0].geometry.location;
      map.setCenter(location);
      new google.maps.Marker({ map, position: location, title: venue });
    });

    const label = document.createElement('div');
    label.className = 'accessMap__mapLabel';
    label.innerHTML = `<strong>${venue}</strong><span>${englishAddress}</span>`;
    canvas.appendChild(label);
  };

  if (!apiKey) {
    renderEnglishFallback();
    return;
  }

  const callbackName = `initMontageMap_${Date.now()}`;
  window[callbackName] = () => {
    initGoogleMap();
    try { delete window[callbackName]; } catch (_) {}
  };

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=en&region=US&callback=${callbackName}`;
  script.async = true;
  script.defer = true;
  script.onerror = renderEnglishFallback;
  document.head.appendChild(script);
})();
