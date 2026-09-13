(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.getElementById('heroScroll');
  const heroSticky = hero?.querySelector('.heroSticky');
  const themeOverlay = document.getElementById('themeOverlay');
  const data = window.SITE_DATA || {};
  const scenes = [...document.querySelectorAll('.scene')];
  const copies = scenes.map(scene => scene.querySelector('.scene__copy'));

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
  const copyWindows = [[0,.235],[.235,.455],[.455,.675],[.675,.86]];
  let ticking = false;

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
      copy.style.setProperty('color', '#fff', 'important');
      copy.querySelectorAll('.scene__title,.scene__kicker,.scene__jp,.scene__meta').forEach(el => {
        el.style.setProperty('color','#fff','important');
        el.style.setProperty('opacity','1','important');
      });
    });

    const reveal = reduceMotion ? (p >= .86 ? 1 : 0) : smooth(rangeProgress(p,.855,.935));
    heroThemeImage.style.opacity = reveal.toFixed(3);
    heroThemeImage.style.transform = `scale(${(1.035 + reveal*.035).toFixed(4)})`;

    themeOverlay.style.setProperty('color','#fff','important');
    themeOverlay.querySelectorAll('h2,p').forEach(el => {
      el.style.setProperty('color','#fff','important');
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
