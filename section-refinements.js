(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const seen = new WeakSet();

  const selectors = [
    '.intro__inner > p',
    '.intro .eventMeta',
    '.portal__bottom > p',
    '.portal__bottom .visitFacts',
    '.concept__head > p',
    '.concept__copy > p',
    '.gallerySection__head > p',
    '.utilitySection__lead',
    '.sustain__copy p',
    '.contact__mid > p',
    '.contact__notice'
  ];

  const observer = reduceMotion || !('IntersectionObserver' in window)
    ? null
    : new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in-view');
          observer.unobserve(entry.target);
        });
      }, {
        threshold: .12,
        rootMargin: '0px 0px -8% 0px'
      });

  const register = () => {
    const nodes = [...document.querySelectorAll(selectors.join(','))];
    nodes.forEach((node, index) => {
      if (seen.has(node)) return;
      seen.add(node);
      node.classList.add('scrollFadeLeft');
      if (index % 3 === 1) node.classList.add('scrollFadeLeft--delay-1');
      if (index % 3 === 2) node.classList.add('scrollFadeLeft--delay-2');

      if (reduceMotion || !observer) node.classList.add('is-in-view');
      else observer.observe(node);
    });
  };

  let frame = 0;
  const queueRegister = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(register);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', register, { once:true });
  } else {
    register();
  }

  const mutationObserver = new MutationObserver(queueRegister);
  mutationObserver.observe(document.documentElement, { childList:true, subtree:true });

  /* Hero legibility fix: crossfade only the images, not the copy. */
  const hero = document.getElementById('heroScroll');
  const scenes = [...document.querySelectorAll('.scene')];
  const sceneImages = scenes.map(scene => scene.querySelector('.scene__image'));
  const sceneCopies = scenes.map(scene => scene.querySelector('.scene__copy'));
  const heroSticky = hero?.querySelector('.heroSticky');
  const themeOverlay = document.getElementById('themeOverlay');
  const data = window.SITE_DATA || {};

  let heroThemeImage = document.getElementById('heroThemeImage');
  if (heroSticky && themeOverlay && !heroThemeImage) {
    heroThemeImage = document.createElement('img');
    heroThemeImage.id = 'heroThemeImage';
    heroThemeImage.className = 'heroThemeImage';
    heroThemeImage.src = data.themeVisual || 'assets/micro-values-header.webp';
    heroThemeImage.alt = `${data.themeName || 'Micro Values'} artwork`;
    themeOverlay.insertAdjacentElement('beforebegin', heroThemeImage);
  }

  if (hero && scenes.length) {
    const clamp = (n,a=0,b=1) => Math.min(b, Math.max(a,n));
    const smooth = t => t*t*(3-2*t);
    const rangeProgress = (p,a,b) => clamp((p-a)/(b-a));
    const windowOpacity = (p,start,end,fadeIn=.055,fadeOut=.055,first=false,last=false) => {
      if (p < start || p > end) return 0;
      let o = 1;
      if (!first && p < start + fadeIn) o = smooth((p-start)/fadeIn);
      if (!last && p > end - fadeOut) o = 1-smooth((p-(end-fadeOut))/fadeOut);
      return clamp(o);
    };

    const imageWindows = [[0.00,0.285],[0.205,0.505],[0.425,0.725],[0.645,1.00]];
    const copyWindows = [[0.00,0.255],[0.235,0.475],[0.455,0.695],[0.675,0.895]];
    let heroTicking = false;

    const updateHeroLegibility = () => {
      const y = window.scrollY;
      const heroTop = hero.offsetTop;
      const max = Math.max(1, hero.offsetHeight - window.innerHeight);
      const p = clamp((y - heroTop) / max);

      scenes.forEach((scene, i) => {
        const imageWindow = imageWindows[i];
        const copyWindow = copyWindows[i];
        if (!imageWindow || !copyWindow) return;

        let imageOpacity = windowOpacity(p, imageWindow[0], imageWindow[1], .06, .065, i === 0, i === 3);
        if (i === 3 && p > .86) imageOpacity = 1;

        if (reduceMotion) {
          imageOpacity = p < .25 ? (i === 0 ? 1 : 0)
            : p < .5 ? (i === 1 ? 1 : 0)
            : p < .75 ? (i === 2 ? 1 : 0)
            : (i === 3 ? 1 : 0);
        }

        const image = sceneImages[i];
        if (image) {
          image.style.opacity = imageOpacity.toFixed(3);
          image.style.filter = `blur(${((1-imageOpacity)*5).toFixed(2)}px)`;
        }

        let copyOpacity = windowOpacity(p, copyWindow[0], copyWindow[1], .014, .018, i === 0, false);
        if (i === 3 && p > .84) copyOpacity = 1 - smooth(rangeProgress(p,.84,.905));
        if (reduceMotion) copyOpacity = imageOpacity > .5 ? 1 : 0;

        const copy = sceneCopies[i];
        if (copy) {
          const local = rangeProgress(p, copyWindow[0], copyWindow[1]);
          const enterX = (1-clamp(local/.08))*-22;
          const exitX = smooth(clamp((local-.92)/.08))*18;
          copy.style.setProperty('--hero-copy-opacity', copyOpacity.toFixed(3));
          copy.style.setProperty('--hero-copy-x', `${enterX + exitX}px`);
        }
      });

      if (heroThemeImage) {
        const themeReveal = smooth(rangeProgress(p, .855, .935));
        const themeZoom = 1.035 + themeReveal * .035;
        heroThemeImage.style.opacity = themeReveal.toFixed(3);
        heroThemeImage.style.transform = `scale(${themeZoom.toFixed(4)})`;
      }

      heroTicking = false;
    };

    const requestHeroLegibility = () => {
      if (heroTicking) return;
      heroTicking = true;
      requestAnimationFrame(updateHeroLegibility);
    };

    addEventListener('scroll', requestHeroLegibility, { passive:true });
    addEventListener('resize', requestHeroLegibility);
    addEventListener('pageshow', requestHeroLegibility);
    updateHeroLegibility();
  }

  /* Load the VISIT access map enhancement. */
  if (!document.querySelector('link[data-access-map]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'access-map.css?v=20260914-1';
    link.dataset.accessMap = 'true';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-access-map]')) {
    const script = document.createElement('script');
    script.src = 'access-map.js?v=20260914-1';
    script.defer = true;
    script.dataset.accessMap = 'true';
    document.body.appendChild(script);
  }
})();