(() => {
  const section = document.getElementById('schedule');
  const grid = document.getElementById('scheduleGrid');
  const data = window.SITE_DATA || {};
  if (!section || !grid || !Array.isArray(data.schedule)) return;

  const headingValue = section.querySelector('.scheduleSection__head h2');
  if (!headingValue) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = 1050;
  const startDelay = 90;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  const season = Number.parseInt(String(data.seasonLabel || '37'), 10) || 37;

  const parseDate = value => {
    const match = String(value).match(/^(\d+)\.(\d+)\s+(.+)$/);
    if (!match) return null;
    return { month:Number(match[1]), day:Number(match[2]), weekday:match[3] };
  };

  const parseRange = value => {
    const match = String(value).match(/^(\d+):(\d+)\s*(A\.M|P\.M)\s*-\s*(\d+):(\d+)\s*(A\.M|P\.M)$/);
    if (!match) return null;
    return {
      startMinutes:Number(match[1]) * 60 + Number(match[2]),
      startPeriod:match[3],
      endMinutes:Number(match[4]) * 60 + Number(match[5]),
      endPeriod:match[6]
    };
  };

  const dateSpan = (item, index) => {
    const date = parseDate(item.date);
    if (!date) return item.date;
    const target = date.month * 100 + date.day;
    return `<span class="scheduleCounterValue" data-counter-kind="date" data-counter-target="${target}" data-counter-index="${index}">0.00</span> <span class="scheduleCounterStatic">${date.weekday}</span>`;
  };

  const timeSpans = (item, index) => {
    const range = parseRange(item.time);
    if (!range) return item.time;
    return `<span class="scheduleCounterValue" data-counter-kind="time" data-counter-target="${range.startMinutes}" data-counter-index="${index}">00:00</span> <span class="scheduleCounterStatic">${range.startPeriod}</span> <span class="scheduleCounterStatic">-</span> <span class="scheduleCounterValue" data-counter-kind="time" data-counter-target="${range.endMinutes}" data-counter-index="${index}">00:00</span> <span class="scheduleCounterStatic">${range.endPeriod}</span>`;
  };

  headingValue.innerHTML = `<span class="scheduleCounterValue" data-counter-kind="integer" data-counter-target="${season}" data-counter-index="0">00</span>th Exhibition`;
  grid.innerHTML = data.schedule.map((item, index) => `
    <article class="scheduleCard">
      <div>
        <small>OPENING HOURS</small>
        <strong aria-label="${item.date}">${dateSpan(item, index + 1)}</strong>
      </div>
      <p aria-label="${item.time}">${timeSpans(item, index + 1)}</p>
    </article>
  `).join('');

  const values = [...section.querySelectorAll('.scheduleCounterValue')];
  section.classList.add('scheduleCounterReady');

  const format = (el, rawValue) => {
    const kind = el.dataset.counterKind;
    if (kind === 'date') {
      const month = Math.floor(rawValue / 100);
      const day = rawValue % 100;
      return `${month}.${String(day).padStart(2, '0')}`;
    }
    if (kind === 'time') {
      if (rawValue <= 0) return '00:00';
      const hour = Math.floor(rawValue / 60);
      const minute = rawValue % 60;
      return `${hour}:${String(minute).padStart(2, '0')}`;
    }
    if (kind === 'integer') {
      return rawValue <= 0 ? '00' : String(rawValue);
    }
    return String(rawValue);
  };

  const setFinal = () => {
    values.forEach(el => {
      const target = Number(el.dataset.counterTarget || 0);
      el.textContent = format(el, target);
    });
    section.classList.add('scheduleCounterDone');
  };

  if (reduceMotion) {
    setFinal();
    return;
  }

  let started = false;

  const start = () => {
    if (started) return;
    started = true;
    section.classList.add('scheduleCounterRunning');

    const startTime = performance.now() + startDelay;

    const frame = now => {
      if (now < startTime) {
        requestAnimationFrame(frame);
        return;
      }

      const progress = Math.min(1, (now - startTime) / duration);
      const eased = easeOutCubic(progress);

      values.forEach(el => {
        const target = Number(el.dataset.counterTarget || 0);
        const value = Math.min(target, Math.round(target * eased));
        el.textContent = format(el, value);
      });

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setFinal();
      }
    };

    requestAnimationFrame(frame);
  };

  const visibleEnough = () => {
    const rect = section.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.72 && rect.bottom >= window.innerHeight * 0.18;
  };

  const check = () => {
    if (!started && visibleEnough()) start();
  };

  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.12)) {
      start();
      observer.disconnect();
    }
  }, { threshold:[0.12, 0.25, 0.5] });

  observer.observe(section);
  addEventListener('scroll', check, { passive:true });
  addEventListener('resize', check);
  addEventListener('pageshow', check);
  requestAnimationFrame(check);
})();
