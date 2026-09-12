(() => {
  const data = window.SITE_DATA || {};
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

  const themeVisual = document.getElementById('themeVisual');
  if (themeVisual && data.themeVisual) {
    themeVisual.src = data.themeVisual;
    themeVisual.alt = `${data.themeName || 'Theme'} artwork`;
  }

  const scheduleGrid = document.getElementById('scheduleGrid');
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
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    const heroTop = hero.offsetTop;
    const max = Math.max(1, hero.offsetHeight - innerHeight);
    const p = clamp((y - heroTop) / max);
    const inHero = y < heroTop + max + innerHeight - 4;
    header.classList.toggle('scrolled', !inHero || y > max * 0.96);

    scenes.forEach((scene,i) => {
      const [a,b] = windows[i];
      let op = windowOpacity(p,a,b,.06,.065,i===0,i===3);
      if (i===3 && p > .86) op = 1;
      if (reduceMotion){
        op = p < .25 ? (i===0?1:0) : p < .5 ? (i===1?1:0) : p < .75 ? (i===2?1:0) : (i===3?1:0);
      }
      scene.style.opacity = op.toFixed(3);
      const local = rangeProgress(p,a,b);
      sceneImages[i].style.transform = `scale(${1.015 + local * .05})`;
      scene.style.filter = `blur(${(1-op)*7}px)`;
      let copyOp = op;
      if (i===3 && p > .835) copyOp = 1-smooth(rangeProgress(p,.835,.905));
      sceneCopies[i].style.opacity = copyOp.toFixed(3);
      const enterLift = (1-clamp(local/.16))*24;
      const exitLift = smooth(clamp((local-.70)/.30))*-48;
      sceneCopies[i].style.transform = `translateY(${enterLift+exitLift}px)`;
    });

    const m = smooth(rangeProgress(p,.86,.94));
    themeOverlay.style.opacity = m.toFixed(3);
    themeOverlay.style.transform = `translateY(${(1-m)*34}px)`;

    const sceneStops = [.285,.505,.725,1];
    progressBars.forEach((bar,i) => {
      const prev = i===0 ? 0 : sceneStops[i-1];
      bar.style.transform = `scaleX(${clamp((p-prev)/(sceneStops[i]-prev))})`;
    });

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

    ticking = false;
  }

  const requestUpdate = () => {
    if(!ticking){ requestAnimationFrame(update); ticking = true; }
  };

  addEventListener('scroll', requestUpdate, {passive:true});
  addEventListener('resize', requestUpdate);
  update();

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
})();
