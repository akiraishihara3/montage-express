(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.getElementById('heroScroll');
  const heroSticky = hero?.querySelector('.heroSticky');
  const themeOverlay = document.getElementById('themeOverlay');
  const data = window.SITE_DATA || {};
  const scenes = [...document.querySelectorAll('.scene')];
  const copies = scenes.map(scene => scene.querySelector('.scene__copy'));

  if (!hero || !heroSticky || !themeOverlay) return;

  /*
   * Physically separate typography from image stacking contexts.
   * Final layer order:
   *   scene images (1) -> theme image (18) -> shades (20) -> copy (100) -> theme/progress (110+)
   */
  let copyLayer = heroSticky.querySelector('.heroCopyLayer');
  if (!copyLayer) {
    copyLayer = document.createElement('div');
    copyLayer.className = 'heroCopyLayer';
    copyLayer.setAttribute('data-hero-copy-layer', '');
    themeOverlay.insertAdjacentElement('beforebegin', copyLayer);
  }

  Object.assign(copyLayer.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '100',
    pointerEvents: 'none',
    overflow: 'visible'
  });

  scenes.forEach(scene => {
    scene.style.setProperty('z-index', '1', 'important');
    scene.style.setProperty('opacity', '1', 'important');
    scene.style.setProperty('filter', 'none', 'important');
  });

  copies.forEach(copy => {
    if (!copy) return;
    if (copy.parentElement !== copyLayer) copyLayer.appendChild(copy);
    copy.style.setProperty('z-index', '1', 'important');
  });

  const topShade = heroSticky.querySelector('.heroTopShade');
  const readShade = heroSticky.querySelector('.heroReadShade');
  [topShade, readShade].forEach(shade => {
    if (shade) shade.style.setProperty('z-index', '20', 'important');
  });

  themeOverlay.style.setProperty('z-index', '110', 'important');
  const progress = heroSticky.querySelector('.heroProgress');
  if (progress) progress.style.setProperty('z-index', '120', 'important');

  let heroThemeImage = document.getElementById('heroThemeImage');
  if (!heroThemeImage) {
    heroThemeImage = document.createElement('img');
    heroThemeImage.id = 'heroThemeImage';
    heroThemeImage.className = 'heroThemeImage';
    heroThemeImage.src = data.themeVisual || 'assets/micro-values-header.webp';
    heroThemeImage.alt = `${data.themeName || 'Micro Values'} artwork`;
    copyLayer.insertAdjacentElement('beforebegin', heroThemeImage);
  }
  heroThemeImage.style.setProperty('z-index', '18', 'important');

  const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
  const smooth = t => t*t*(3-2*t);
  const rangeProgress = (p,a,b) => clamp((p-a)/(b-a));
  const copyWindows = [[0,.235],[.235,.455],[.455,.675],[.675,.86]];
  let ticking = false;

  const forceTopCopyAppearance = copy => {
    if (!copy) return;
    copy.style.setProperty('color', '#fff', 'important');
    copy.style.setProperty('text-shadow', 'none', 'important');
    copy.style.setProperty('filter', 'none', 'important');
    copy.style.setProperty('mix-blend-mode', 'normal', 'important');
    copy.style.setProperty('backdrop-filter', 'none', 'important');
    copy.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
    copy.querySelectorAll('.scene__title,.scene__kicker,.scene__jp,.scene__meta').forEach(el => {
      el.style.setProperty('color', '#fff', 'important');
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('text-shadow', 'none', 'important');
      el.style.setProperty('filter', 'none', 'important');
      el.style.setProperty('mix-blend-mode', 'normal', 'important');
    });
  };

  const update = () => {
    const heroTop = hero.offsetTop;
    const max = Math.max(1, hero.offsetHeight - innerHeight);
    const p = clamp((scrollY - heroTop) / max);

    copies.forEach((copy,index) => {
      if (!copy) return;
      const [start,end] = copyWindows[index] || [0,0];
      const edge = .008;
      let opacity = 0;
      if (p >= start && p <= end) {
        opacity = 1;
        if (index !== 0 && p < start + edge) opacity = smooth((p-start)/edge);
        if (p > end - edge) opacity = 1-smooth((p-(end-edge))/edge);
      }
      if (reduceMotion) opacity = p >= start && p <= end ? 1 : 0;
      copy.style.setProperty('opacity', opacity.toFixed(3), 'important');
      forceTopCopyAppearance(copy);
    });

    const reveal = reduceMotion ? (p >= .86 ? 1 : 0) : smooth(rangeProgress(p,.855,.935));
    heroThemeImage.style.opacity = reveal.toFixed(3);
    heroThemeImage.style.transform = `scale(${(1.035 + reveal*.035).toFixed(4)})`;

    themeOverlay.style.setProperty('color','#fff','important');
    themeOverlay.style.setProperty('text-shadow','none','important');
    themeOverlay.style.setProperty('filter','none','important');
    themeOverlay.style.setProperty('mix-blend-mode','normal','important');
    themeOverlay.querySelectorAll('h2,p').forEach(el => {
      el.style.setProperty('color','#fff','important');
      el.style.setProperty('text-shadow','none','important');
      el.style.setProperty('filter','none','important');
      el.style.setProperty('opacity','1','important');
    });

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
