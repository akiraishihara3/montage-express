(() => {
  // Reference motion: products.mocomoco.ai case-study counter.
  // One continuous rAF count, fast at first and easing into the final value.
  const section = document.getElementById('schedule');
  const grid = document.getElementById('scheduleGrid');
  const data = window.SITE_DATA || {};
  if (!section || !grid || !Array.isArray(data.schedule)) return;

  const headingValue = section.querySelector('.scheduleSection__head h2');
  if (!headingValue) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = 980;
  const startDelay = 70;
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const season = Number.parseInt(String(data.seasonLabel || '37'), 10) || 37;

  const parseDate = value => {
    const match = String(value).match(/^(\d+)\.(\d+)\s+([A-Z]{3})$/i);
    if (!match) return null;
    const weekday = match[3].toUpperCase();
    return {
      month:Number(match[1]),
      day:Number(match[2]),
      weekday,
      weekdayIndex:Math.max(0, weekdays.indexOf(weekday))
    };
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

  const dateSpan = item => {
    const date = parseDate(item.date);
    if (!date) return item.date;
    const target = date.month * 100 + date.day;
    return `<span class="scheduleCounterValue" data-counter-kind="date" data-counter-target="${target}">0.00</span> <span class="scheduleCounterWeekday" data-weekday-target="${date.weekdayIndex}" aria-hidden="true">SUN</span>`;
  };

  const timeSpans = item => {
    const range = parseRange(item.time);
    if (!range) return item.time;
    return `<span class="scheduleCounterValue" data-counter-kind="time" data-counter-target="${range.startMinutes}">00:00</span> <span class="scheduleCounterStatic">${range.startPeriod}</span> <span class="scheduleCounterStatic">-</span> <span class="scheduleCounterValue" data-counter-kind="time" data-counter-target="${range.endMinutes}">00:00</span> <span class="scheduleCounterStatic">${range.endPeriod}</span>`;
  };

  headingValue.innerHTML = `<span class="scheduleCounterValue" data-counter-kind="integer" data-counter-target="${season}">00</span>th Exhibition`;
  grid.innerHTML = data.schedule.map(item => `
    <article class="scheduleCard">
      <div>
        <small>OPENING HOURS</small>
        <strong aria-label="${item.date}">${dateSpan(item)}</strong>
      </div>
      <p aria-label="${item.time}">${timeSpans(item)}</p>
    </article>
  `).join('');

  const values = [...section.querySelectorAll('.scheduleCounterValue')];
  const weekdayValues = [...section.querySelectorAll('.scheduleCounterWeekday')];
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
    weekdayValues.forEach(el => {
      const target = Number(el.dataset.weekdayTarget || 0);
      el.textContent = weekdays[target] || 'SUN';
    });
    section.classList.add('scheduleCounterDone');
    section.classList.remove('scheduleCounterRunning');
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

      weekdayValues.forEach(el => {
        const target = Number(el.dataset.weekdayTarget || 0);
        const totalSteps = 14 + target;
        const step = Math.min(totalSteps, Math.floor(eased * totalSteps));
        el.textContent = weekdays[step % 7];
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

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.12)) {
        start();
        observer.disconnect();
      }
    }, { threshold:[0.12, 0.25, 0.5] });
    observer.observe(section);
  }

  addEventListener('scroll', check, { passive:true });
  addEventListener('resize', check);
  addEventListener('pageshow', check);
  requestAnimationFrame(check);
})();
