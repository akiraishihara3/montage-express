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

      if (reduceMotion || !observer) {
        node.classList.add('is-in-view');
      } else {
        observer.observe(node);
      }
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
})();
