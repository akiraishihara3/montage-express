(() => {
  const section = document.getElementById('schedule');
  const grid = document.getElementById('scheduleGrid');
  if (!section || !grid) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const numberTargets = [
    section.querySelector('.scheduleSection__head [data-bind="seasonLabel"]'),
    ...grid.querySelectorAll('.scheduleCard strong, .scheduleCard p')
  ].filter(Boolean);

  const tokens = [];

  function prepareNumericText(el) {
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
      tokens.push(span);
      cursor = match.index + raw.length;
    }

    if (cursor < original.length) {
      fragment.append(document.createTextNode(original.slice(cursor)));
    }

    el.replaceChildren(fragment);
  }

  numberTargets.forEach(prepareNumericText);
  section.classList.add('scheduleMotion-ready');

  function setFinalValues() {
    tokens.forEach(token => {
      const target = Number(token.dataset.target || 0);
      const pad = Number(token.dataset.pad || 1);
      token.textContent = String(target).padStart(pad, '0');
    });
    section.classList.add('is-in');
  }

  if (reduceMotion) {
    setFinalValues();
    return;
  }

  let played = false;

  function animateToken(token, index) {
    const target = Number(token.dataset.target || 0);
    const pad = Number(token.dataset.pad || 1);
    const delay = 90 + index * 42;
    const duration = 820 + Math.min(target * 13, 420);
    const startAt = performance.now() + delay;

    function frame(now) {
      if (now < startAt) {
        requestAnimationFrame(frame);
        return;
      }

      const progress = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      token.textContent = String(value).padStart(pad, '0');

      if (progress < 1) requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  function startAnimation() {
    if (played) return;
    played = true;
    section.classList.add('is-in');
    tokens.forEach(animateToken);
    removeEventListener('scroll', checkPosition);
    removeEventListener('resize', checkPosition);

    // Safety net: always land on the intended values even when rAF is throttled.
    setTimeout(setFinalValues, 2400);
  }

  function checkPosition() {
    if (played) return;
    const rect = section.getBoundingClientRect();
    const triggerLine = innerHeight * 0.86;
    const visibleEnough = rect.top <= triggerLine && rect.bottom >= innerHeight * 0.08;
    if (visibleEnough) startAnimation();
  }

  addEventListener('scroll', checkPosition, { passive: true });
  addEventListener('resize', checkPosition);

  // Handles normal scrolling, anchor navigation, back/forward cache, and reloads
  // while the EVENT SCHEDULE section is already in the viewport.
  requestAnimationFrame(checkPosition);
  setTimeout(checkPosition, 120);
})();
