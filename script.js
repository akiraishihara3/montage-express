(() => {
  const data = window.SITE_DATA || {};
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const multiline = value => String(value ?? '').split('\n').join('<br>');

  document.querySelectorAll('[data-bind]').forEach(el => {
    const key = el.dataset.bind;
    if (!(key in data)) return;
    const value = data[key];
    if (el.dataset.multiline === 'true') {
      el.innerHTML = multiline(value);
    } else {
      el.textContent = value;
    }
  });

  const headerInner = document.querySelector('.header__in');
  const menuButton = document.getElementById('menuBtn');
  if (headerInner && menuButton && data.primaryActionLabel && data.primaryActionUrl) {
    const headerCta = document.createElement('a');
    headerCta.className = 'headerCta';
    headerCta.href = data.primaryActionUrl;
    headerCta.textContent = data.primaryActionLabel;
    if (/^https?:\/\//.test(data.primaryActionUrl)) {
      headerCta.target = '_blank';
      headerCta.rel = 'noopener';
    }
    headerInner.insertBefore(headerCta, menuButton);
  }

  const introInner = document.querySelector('.intro__inner');
  if (introInner && Array.isArray(data.quickAccess) && data.quickAccess.length) {
    const quickAccess = document.createElement('div');
    quickAccess.className = 'quickAccess';

    const links = data.quickAccess.map((item, index) => {
      const external = /^https?:\/\//.test(item.url || '');
      return `
        <a class="quickAccess__item" href="${item.url || '#'}"${external ? ' target="_blank" rel="noopener"' : ''}>
          <span class="quickAccess__num">${String(index + 1).padStart(2, '0')}</span>
          <span class="quickAccess__label">
            <strong>${item.label || ''}</strong>
            <small>${item.jp || ''}<br>${item.description || ''}</small>
          </span>
          <span class="quickAccess__arrow" aria-hidden="true">↗</span>
        </a>
      `;
    }).join('');

    quickAccess.innerHTML = `
      <div class="quickAccess__head">
        <small>QUICK ACCESS / ${data.quickAccessLead || '目的からすぐに探す'}</small>
        <span class="quickAccess__status">${data.primaryActionStatus || ''}</span>
      </div>
      <div class="quickAccess__list">${links}</div>
    `;
    introInner.appendChild(quickAccess);
  }

  const themeVisual = document.getElementById('themeVisual');
  if (themeVisual && data.themeVisual) {
    themeVisual.src = data.themeVisual;
    themeVisual.alt = `${data.themeName || 'Theme'} artwork`;
  }

  const heroPrimaryImage = document.getElementById('heroPrimaryImage');
  if (heroPrimaryImage && data.heroPrimaryImage) {
    heroPrimaryImage.src = data.heroPrimaryImage;
    heroPrimaryImage.alt = `${data.themeName || 'Theme'} key visual`;
    if (data.heroPrimaryImagePosition) {
      heroPrimaryImage.style.objectPosition = data.heroPrimaryImagePosition;
    }
  }

  const scheduleSection = document.getElementById('schedule');
  const scheduleGrid = document.getElementById('scheduleGrid');
  const scheduleTokens = [];
  let schedulePlayed = false;

  if (scheduleGrid && Array.isArray(data.schedule)) {
    scheduleGrid.innerHTML = data.schedule.map(item => `
      <article class="scheduleCard">
        <div>
          <small>OPENING HOURS</small>
          <strong>${item.date}</strong>
        </div>
        <p>${item.time}</p>
      </article>
    `).join('');
  }

  function prepareScheduleNumericText(el) {
    if (!el) return;
    const original = el.textContent || '';
    el.setAttribute('aria-label', original);

    const fragment = document.createDocumentFragment();
    const pattern = /\d+/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(original))) {
      if (match.index > cursor) {
        fragment.append(document.createTextNode(original.slice(cursor, match.index)));
      }

      const raw = match[0];
      const span = document.createElement('span');
      span.className = 'scheduleCount';
      span.dataset.target = String(Number(raw));
      span.dataset.pad = String(raw.length);
      span.textContent = reduceMotion ? raw : String(0).padStart(raw.length, '0');
      fragment.append(span);
      scheduleTokens.push(span);
      cursor = match.index + raw.length;
    }

    if (cursor < original.length) {
      fragment.append(document.createTextNode(original.slice(cursor)));
    }

    el.replaceChildren(fragment);
  }

  function setScheduleFinalValues() {
    scheduleTokens.forEach(token => {
      const target = Number(token.dataset.target || 0);
      const pad = Number(token.dataset.pad || 1);
      token.textContent = String(target).padStart(pad, '0');
    });
    scheduleSection?.classList.add('is-in');
  }

  function animateScheduleToken(token, index) {
    const target = Number(token.dataset.target || 0);
    const pad = Number(token.dataset.pad || 1);
    const delay = 80 + index * 42;
    const duration = 900 + Math.min(target * 14, 440);
    const startAt = performance.now() + delay;

    const frame = now => {
      if (now < startAt) {
        requestAnimationFrame(frame);
        return;
      }

      const progress = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      token.textContent = String(value).padStart(pad, '0');

      if (progress < 1) requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  function startScheduleAnimation() {
    if (schedulePlayed || !scheduleSection) return;
    schedulePlayed = true;
    scheduleSection.classList.add('is-in');

    if (reduceMotion) {
      setScheduleFinalValues();
      return;
    }

    scheduleTokens.forEach(animateScheduleToken);
    setTimeout(setScheduleFinalValues, 2600);
  }

  if (scheduleSection && scheduleGrid) {
    const numericTargets = [
      scheduleSection.querySelector('.scheduleSection__head [data-bind="seasonLabel"]'),
      ...scheduleGrid.querySelectorAll('.scheduleCard strong, .scheduleCard p')
    ].filter(Boolean);

    numericTargets.forEach(prepareScheduleNumericText);
    scheduleSection.classList.add('scheduleMotion-ready');

    if (reduceMotion) {
      schedulePlayed = true;
      setScheduleFinalValues();
    }
  }

  const hero = document.getElementById('heroScroll');
  const header = document.getElementById('header');
  const scenes = [...document.querySelectorAll('.scene')];
  const sceneImages = scenes.map(s => s.querySelector('.scene__image'));
  const sceneCopies = scenes.map(s => s.querySelector('.scene__copy'));
  const themeOverlay = document.getElementById('themeOverlay');
  const progressBars = [...document.querySelectorAll('.heroProgress i')];
  const portals = [...document.querySelectorAll('.portal')];
  const menuBtn = document.getElementById('menuBtn');
  const mobileSheet = document.getElementById('mobileSheet');

  const clamp = (n,a=0,b=1) => Math.min(b,Math.max(a,n));
  const smooth = t => t*t*(3-2*t);
  const rangeProgress = (p,a,b) => clamp((p-a)/(b-a));

  function windowOpacity(p,start,end,fadeIn=.055,fadeOut=.055,first=false,last=false){
    if (p < start || p > end) return 0;
    let o = 1;
    if (!first && p < start + fadeIn) o = smooth((p-start)/fadeIn);
    if (!last && p > end - fadeOut) o = 1-smooth((p-(end-fadeOut))/fadeOut);
    return clamp(o);
  }

  const windows = [[0.00,0.285],[0.205,0.505],[0.425,0.725],[0.645,1.00]];
  let ticking = false;

  function update(){
    const y = scrollY;

    if (hero) {
      const heroTop = hero.offsetTop;
      const max = Math.max(1, hero.offsetHeight - innerHeight);
      const p = clamp((y - heroTop) / max);
      const inHero = y < heroTop + max + innerHeight - 4;
      header?.classList.toggle('scrolled', !inHero || y > max * 0.96);

      scenes.forEach((scene,i) => {
        const [a,b] = windows[i];
        let op = windowOpacity(p,a,b,.06,.065,i===0,i===3);
        if (i===3 && p > .86) op = 1;
        if (reduceMotion){
          op = p < .25 ? (i===0?1:0) : p < .5 ? (i===1?1:0) : p < .75 ? (i===2?1:0) : (i===3?1:0);
        }
        scene.style.opacity = op.toFixed(3);
        const local = rangeProgress(p,a,b);
        if (sceneImages[i]) sceneImages[i].style.transform = `scale(${1.015 + local * .05})`;
        scene.style.filter = `blur(${(1-op)*7}px)`;
        let copyOp = op;
        if (i===3 && p > .835) copyOp = 1-smooth(rangeProgress(p,.835,.905));
        if (sceneCopies[i]) {
          sceneCopies[i].style.opacity = copyOp.toFixed(3);
          const enterLift = (1-clamp(local/.16))*24;
          const exitLift = smooth(clamp((local-.70)/.30))*-48;
          sceneCopies[i].style.transform = `translateY(${enterLift+exitLift}px)`;
        }
      });

      const m = smooth(rangeProgress(p,.86,.94));
      if (themeOverlay) {
        themeOverlay.style.opacity = m.toFixed(3);
        themeOverlay.style.transform = `translateY(${(1-m)*34}px)`;
      }

      const sceneStops = [.285,.505,.725,1];
      progressBars.forEach((bar,i) => {
        const prev = i===0 ? 0 : sceneStops[i-1];
        bar.style.transform = `scaleX(${clamp((p-prev)/(sceneStops[i]-prev))})`;
      });
    }

    portals.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const reveal = smooth(clamp((innerHeight*.82 - rect.top)/(innerHeight*.48)));
      const media = sec.querySelector('.portal__media');
      const text = sec.querySelector('.textReveal');
      if (media) {
        media.style.opacity = reveal.toFixed(3);
        media.style.transform = `scale(${0.955 + reveal*.045})`;
      }
      if (text) {
        const tr = smooth(clamp((reveal-.38)/.62));
        text.style.opacity = (0.2 + tr*.8).toFixed(3);
        text.style.transform = `translateY(${(1-tr)*18}px)`;
      }
    });

    if (scheduleSection && !schedulePlayed) {
      const rect = scheduleSection.getBoundingClientRect();
      if (rect.top <= innerHeight * .86 && rect.bottom > 0) {
        startScheduleAnimation();
      }
    }

    ticking = false;
  }

  const requestUpdate = () => {
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  };

  addEventListener('scroll', requestUpdate, {passive:true});
  addEventListener('resize', requestUpdate);
  addEventListener('pageshow', requestUpdate);
  update();
  setTimeout(requestUpdate, 160);

  if (menuBtn && mobileSheet) {
    menuBtn.addEventListener('click', () => {
      const open = mobileSheet.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'CLOSE' : 'MENU';
    });

    mobileSheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      mobileSheet.classList.remove('open');
      menuBtn.setAttribute('aria-expanded','false');
      menuBtn.textContent = 'MENU';
    }));
  }
})();
