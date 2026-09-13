(() => {
  const data = window.SITE_DATA || {};
  const iframe = document.getElementById('visitMapFrame');
  const link = document.getElementById('visitMapLink');
  if (!iframe || !link) return;

  const venue = data.venueName || 'Tokyo Metropolitan Industrial Trade Center Hamamatsucho-Kan 4F';
  const address = data.venueAddress || '東京都港区海岸1-7-1';
  const query = `${venue} ${address}`.trim();
  const encoded = encodeURIComponent(query);

  iframe.src = `https://www.google.com/maps?q=${encoded}&output=embed`;
  iframe.title = `${venue} Google Map`;
  link.href = `https://www.google.com/maps/search/?api=1&query=${encoded}`;
})();
