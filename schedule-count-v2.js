(() => {
  const init = () => {
    const data = window.SITE_DATA || {};
    const section = document.getElementById('schedule');
    const grid = document.getElementById('scheduleGrid');
    const heading = section?.querySelector('.scheduleSection__head h2');
    if (!section || !grid || !heading || !Array.isArray(data.schedule)) return;

    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seasonTarget = Number.parseInt(String(data.seasonLabel || '37'), 10) || 37;

    const parseDate = value => {
      const match = String(value || '').match(/^(\d+)\.(\d+)\s+(.+)$/);
      if (!match) return null;
      return {
        target: Number(match[1]) * 100 + Number(match[2]),
        weekday: match[3]
      };
    };

    const parseTimeRange = value => {
      const match = String(value || '').match(/^(\d+):(\d+)\s*(A\.M|P\.M)\s*-\s*(\d+):(\d+)\s*(A\.M|P\.M)$/);
      if (!match) return null;
      return {
        start: Number(match[1]) * 60 + Number(match[2]),
        startPeriod: match[3],
        end: Number(match[4]) * 60 + Number(match[5]),
        endPeriod: match[6]
      };
    };

    const dateMarkup = value => {
      const parsed = parseDate(value);
      if (!parsed) return value;
      return `<span class="scheduleCount" data-count-kind="date" data-count-target="${parsed.target}">0.00</span> ${parsed.weekday}`;
    };

    const timeMarkup = value => {
      const parsed = parseTimeRange(value);
      if (!parsed) return value;
      return `<span class="scheduleCount" data-count-kind="time" data-count-target="${parsed.start}">0:00</span> ${parsed.startPeriod} - <span class="scheduleCount" data-count-kind="time" data-count-target="${parsed.end}">0:00</span> ${parsed.endPeriod}`;
    };

    heading.innerHTML = `<span class="scheduleCount" data-count-kind="integer" data-count-target="${seasonTarget}">0</span>th Exhibition`;

    grid.innerHTML = data.schedule.map(item => `
      <article class="scheduleCard">
        <div>
          <small>OPENING HOURS</small>
          <strong aria-label="${item.date}">${dateMarkup(item.date)}</strong>
        </div>
        <p aria-label="${item.time}">${timeMarkup(item.time)}</p>
      </article>
    `).join('');

    const tokens = [...section.querySelectorAll('[data-count-target]')];
    section.classList.add('scheduleMotion-ready');
    section.classList.remove('is-in');

    const formatValue = (token, value) => {
      const kind = token.dataset.countKind;
      if (kind === 'date') {
        const month = Math.floor(value / 100);
        const day = value % 100;
        return `${month}.${String(day).padStart(2, '0')}`;
      }
      if (kind === 'time') {
        const hour = Math.floor(value / 60);
        const minute = value % 60;
        return `${hour}:${String(minute).padStart(2, '0')}`;
      }
      return String(value);
    };

    const setFinal = () => {
      tokens.forEach(token => {
        const target = Number(token.dataset.countTarget || 0);
        token.textContent = formatValue(token, target);
      });
      section.classList.add('is-in');
    };

    if (reduceMotion) {
      setFinal();
      return;
    }

    let started = false;
    let pollId = 0;
    let observer = null;

    const animateToken = (token, index) => {
      const target = Number(token.dataset.countTarget || 0);
      const delay = index * 65;
      const duration = 1650 + Math.min(target * 0.35, 250);
      const start = performance.now() + delay;

      const frame = now => {
        if (now < start) {
          requestAnimationFrame(frame);
          return;
        }

        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 4);
        const value = Math.round(target * eased);
        token.textContent = formatValue(token, value);

        if (progress < 1) requestAnimationFrame(frame);
      };

      requestAnimationFrame(frame);
    };

    const start = () => {
      if (started) return;
      started = true;
      section.classList.add('is-in');
      tokens.forEach(animateToken);
      if (pollId) clearInterval(pollId);
      if (observer) observer.disconnect();
      setTimeout(setFinal, 2600);
    };

    const check = () => {
      if (started) return;
      const rect = section.getBoundingClientRect();
      if (rect.top <= innerHeight * 0.82 && rect.bottom >= innerHeight * 0.08) start();
    };

    addEventListener('scroll', check, { passive: true });
    addEventListener('resize', check);
    addEventListener('pageshow', check);

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) start();
      }, { threshold: 0.08 });
      observer.observe(section);
    }

    pollId = setInterval(check, 250);
    requestAnimationFrame(check);
    setTimeout(check, 150);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
