(() => {
  const data = window.SITE_DATA || {};
  const visit = document.getElementById('visit');
  if (!visit) return;

  const venue = data.venueName || 'Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F';
  const englishAddress = data.venueAddressEnglish || '1-7-1 Kaigan, Minato-ku, Tokyo 105-7501, Japan';
  const query = `${venue} ${englishAddress}`.trim();
  const encoded = encodeURIComponent(query);

  let section = document.getElementById('accessMap');
  if (!section) {
    section = document.createElement('section');
    section.id = 'accessMap';
    visit.insertAdjacentElement('afterend', section);
  }

  section.className = 'accessMap accessMap--dark';
  section.setAttribute('aria-label', 'Google Maps — English');
  section.innerHTML = `
    <div class="accessMap__canvas" id="visitMapCanvas">
      <iframe
        id="visitMapFrame"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
        title="Google Maps — English"
      ></iframe>
    </div>`;

  const canvas = document.getElementById('visitMapCanvas');
  const iframe = document.getElementById('visitMapFrame');
  if (!canvas || !iframe) return;

  Object.assign(iframe.style, {
    position: 'absolute',
    inset: '0',
    display: 'block',
    width: '100%',
    height: '100%',
    minWidth: '100%',
    minHeight: '100%',
    maxWidth: 'none',
    maxHeight: 'none',
    border: '0',
    margin: '0',
    padding: '0'
  });

  const setFrameSize = () => {
    const rect = canvas.getBoundingClientRect();
    iframe.setAttribute('width', String(Math.max(320, Math.round(rect.width))));
    iframe.setAttribute('height', String(Math.max(320, Math.round(rect.height))));
  };

  setFrameSize();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(setFrameSize);
    observer.observe(canvas);
  } else {
    window.addEventListener('resize', setFrameSize, { passive: true });
  }

  iframe.src = `https://maps.google.com/maps?hl=en&gl=us&q=${encoded}&z=16&ie=UTF8&iwloc=B&output=embed`;
})();
