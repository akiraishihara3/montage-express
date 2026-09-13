(() => {
  const escapeHtml = value => String(value ?? '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');

  const enhance = section => {
    if (!section || section.dataset.marqueeReady === 'true') return;
    const data = window.SITE_DATA || {};
    const partners = Array.isArray(data.partners) ? data.partners : [];
    if (!partners.length || typeof window.getPartnerSpriteUrl !== 'function') return;

    section.dataset.marqueeReady = 'true';
    section.classList.add('partnersSection--marquee');

    const makeGroup = (duplicate = false) => `
      <div class="partnerMarquee__group"${duplicate ? ' aria-hidden="true"' : ''}>
        ${partners.map((item, index) => {
          const label = escapeHtml(item.name || `Partner ${index + 1}`);
          const href = escapeHtml(item.url || '#');
          const tabindex = duplicate ? ' tabindex="-1"' : '';
          return `
            <a class="partnerMarquee__item" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}"${tabindex}>
              <span class="partnerMarquee__logo" data-partner-sprite-index="${Number.isFinite(item.spriteIndex) ? item.spriteIndex : index}" aria-hidden="true"></span>
            </a>
          `;
        }).join('')}
      </div>
    `;

    section.innerHTML = `
      <div class="partnersMarquee__head partnersMarquee__head partnersMarquee__head--inner partnersMarquee__head partnersMarquee__head">
        <p class="sectionEyebrow">WITH / PARTNERS</p>
        <h2>Partners</h2>
      </div>
      <div class="partnerMarquee__viewport" aria-label="MONTAGE partners">
        <div class="partnerMarquee__track">
          ${makeGroup(false)}
          ${makeGroup(true)}
        </div>
      </div>
      <p class="partnerMarquee__caption">PARTNER / MEDIA / OPERATION / SUSTAINABILITY / SOCIAL</p>
    `;

    /* Normalize the accidental compatibility class repetition to the intended class. */
    const head = section.firstElementChild;
    if (head) head.className = 'partnersMarquee__head';

    const spriteUrl = window.getPartnerSpriteUrl();
    const lastIndex = Math.max(1, partners.length - 1);
    section.querySelectorAll('[data-partner-sprite-index]').forEach(el => {
      const index = Math.max(0, Math.min(partners.length - 1, Number(el.dataset.partnerSpriteIndex || 0)));
      el.style.backgroundImage = `url("${spriteUrl}")`;
      el.style.backgroundPositionX = `${(index / lastIndex) * 100}%`;
    });
  };

  const findAndEnhance = () => {
    const section = document.getElementById('partners');
    if (!section) return false;
    enhance(section);
    return true;
  };

  if (findAndEnhance()) return;

  const observer = new MutationObserver(() => {
    if (findAndEnhance()) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList:true, subtree:true });

  setTimeout(() => observer.disconnect(), 10000);
})();
