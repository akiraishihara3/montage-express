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
  }

  section.className = 'accessMap accessMap--dark';
  section.setAttribute('aria-label', 'Google Maps — English');
  Object.assign(section.style, {
    position: 'relative',
    width: '100%',
    maxWidth: 'none',
    margin: '0',
    padding: '0',
    overflow: 'hidden',
    background: '#050505',
    border: '0'
  });

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

  const enforceMapPlacement = () => {
    const legacy = document.getElementById('access-map');
    if (legacy && legacy !== section) legacy.remove();
    if (visit.nextElementSibling !== section) {
      visit.insertAdjacentElement('afterend', section);
    }
  };
  enforceMapPlacement();

  if ('MutationObserver' in window && visit.parentElement) {
    const orderObserver = new MutationObserver(enforceMapPlacement);
    orderObserver.observe(visit.parentElement, { childList: true });
  }

  const canvas = document.getElementById('visitMapCanvas');
  const iframe = document.getElementById('visitMapFrame');
  if (!canvas || !iframe) return;

  Object.assign(canvas.style, {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    background: '#050505'
  });

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
    padding: '0',
    background: '#050505',
    filter: 'invert(1) grayscale(1) contrast(1.32) brightness(.68)'
  });

  const setFrameSize = () => {
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
    const targetHeight = viewportWidth <= 520
      ? Math.max(340, Math.min(440, viewportWidth * .92))
      : viewportWidth <= 900
        ? Math.max(400, Math.min(540, viewportWidth * .70))
        : Math.max(460, Math.min(700, viewportWidth * .52));

    canvas.style.height = `${Math.round(targetHeight)}px`;
    const rect = canvas.getBoundingClientRect();
    iframe.setAttribute('width', String(Math.max(320, Math.round(rect.width))));
    iframe.setAttribute('height', String(Math.max(320, Math.round(rect.height))));
  };

  setFrameSize();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(setFrameSize);
    observer.observe(section);
  } else {
    window.addEventListener('resize', setFrameSize, { passive: true });
  }

  iframe.src = `https://maps.google.com/maps?hl=en&gl=us&q=${encoded}&z=16&ie=UTF8&iwloc=B&output=embed`;
})();
