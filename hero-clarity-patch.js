(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.getElementById('heroScroll');
  const heroSticky = hero?.querySelector('.heroSticky');
  const themeOverlay = document.getElementById('themeOverlay');
  const data = window.SITE_DATA || {};

  if (!hero || !heroSticky || !themeOverlay) return;

  let heroThemeImage = document.getElementById('heroThemeImage');
  if (!heroThemeImage) {
    heroThemeImage = document.createElement('img');
    heroThemeImage.id = 'heroThemeImage';
    heroThemeImage.className = 'heroThemeImage';
    heroThemeImage.src = data.themeVisual || 'assets/micro-values-header.webp';
    heroThemeImage.alt = `${data.themeName || 'Micro Values'} artwork`;
    themeOverlay.insertAdjacentElement('beforebegin', heroThemeImage);
  }

  const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
  const smooth = t => t*t*(3-2*t);
  const rangeProgress = (p,a,b) => clamp((p-a)/(b-a));
  let ticking = false;

  const update = () => {
    const heroTop = hero.offsetTop;
    const max = Math.max(1, hero.offsetHeight - innerHeight);
    const p = clamp((scrollY - heroTop) / max);
    const reveal = reduceMotion ? (p >= .86 ? 1 : 0) : smooth(rangeProgress(p,.855,.935));
    heroThemeImage.style.opacity = reveal.toFixed(3);
    heroThemeImage.style.transform = `scale(${(1.035 + reveal*.035).toFixed(4)})`;
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  addEventListener('scroll',requestUpdate,{passive:true});
  addEventListener('resize',requestUpdate);
  addEventListener('pageshow',requestUpdate);
  update();
})();
