(() => {
  const onReady = fn => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  };

  onReady(() => {
    const data = window.SITE_DATA || {};

    const externalAttrs = url => /^https?:\/\//.test(url || '') ? ' target="_blank" rel="noopener"' : '';
    const escapeHtml = value => String(value ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    /* Primary navigation: restore the useful sections that exist on the current site. */
    const navItems = [
      ['GALLERY','#gallery'],
      ['EXHIBIT','#exhibit'],
      ['VISIT','#visit'],
      ['ONLINE','#online'],
      ['CONCEPT','#concept'],
      ['SUSTAINABILITY','#sustainability'],
      ['CONTACT','#contact']
    ];
    const navMarkup = navItems.map(([label,url]) => `<a href="${url}">${label}</a>`).join('');
    const nav = document.querySelector('.nav');
    if (nav) nav.innerHTML = navMarkup;
    const mobileSheet = document.getElementById('mobileSheet');
    if (mobileSheet) {
      const footer = mobileSheet.querySelector('small');
      mobileSheet.querySelectorAll('a').forEach(a => a.remove());
      const holder = document.createElement('div');
      holder.innerHTML = navMarkup;
      [...holder.children].forEach(a => mobileSheet.insertBefore(a, footer || null));
      mobileSheet.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        mobileSheet.classList.remove('open');
        const btn = document.getElementById('menuBtn');
        if (btn) {
          btn.setAttribute('aria-expanded','false');
          btn.textContent = 'MENU';
        }
      }));
    }

    const buildLinks = (items = []) => `
      <div class="resourceList">
        ${items.map((item,index) => `
          <a class="resourceLink" href="${escapeHtml(item.url || '#')}"${externalAttrs(item.url)}>
            <span class="resourceLink__num">${String(index + 1).padStart(2,'0')}</span>
            <span class="resourceLink__label">
              <strong>${escapeHtml(item.label)}</strong>
              ${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ''}
            </span>
            <span class="resourceLink__arrow" aria-hidden="true">↗</span>
          </a>
        `).join('')}
      </div>
    `;

    const buildUtility = ({ id, tone='light', eyebrow, title, lead, extra='', links=[] }) => {
      const section = document.createElement('section');
      section.className = `utilitySection utilitySection--${tone} completeReveal`;
      section.id = id;
      section.innerHTML = `
        <div class="utilitySection__head">
          <div>
            <p class="sectionEyebrow">${escapeHtml(eyebrow)}</p>
            <h2 class="utilitySection__title">${escapeHtml(title)}</h2>
          </div>
          <p class="utilitySection__lead">${escapeHtml(lead)}</p>
        </div>
        ${extra}
        ${buildLinks(links)}
      `;
      return section;
    };

    /* EXHIBITORS: deadlines + overview + audition + inquiry. */
    const exhibit = document.getElementById('exhibit');
    if (exhibit && !document.getElementById('exhibit-access')) {
      const deadlines = Array.isArray(data.exhibitDeadlines) ? data.exhibitDeadlines : [];
      const deadlineMarkup = deadlines.length ? `
        <div class="deadlines">
          ${deadlines.map(item => `
            <div class="deadline">
              <small>${escapeHtml(item.label)}</small>
              <strong>${escapeHtml(item.date)}</strong>
            </div>
          `).join('')}
        </div>
      ` : '';
      exhibit.insertAdjacentElement('afterend', buildUtility({
        id:'exhibit-access',
        tone:'dark',
        eyebrow:'EXHIBITOR ACCESS',
        title:'37th Exhibitors',
        lead:'出展をご検討の方向けに、募集締切・開催概要・オーディション・お問い合わせへの導線をまとめています。',
        extra:deadlineMarkup,
        links:data.exhibitResources || []
      }));
    }

    /* VISITORS: keep the Google Map immediately after VISIT, then visitor resources. */
    const visit = document.getElementById('visit');
    if (visit && !document.getElementById('visitor-access')) {
      const visitorAccess = buildUtility({
        id:'visitor-access',
        tone:'light',
        eyebrow:'VISITOR ACCESS',
        title:'Plan your visit.',
        lead:'出展ブランドの確認から来場登録、関連プロジェクトまで。現行サイトにある実用導線をまとめて残しています。',
        links:data.visitorResources || []
      });
      const map = document.getElementById('accessMap') || document.getElementById('access-map');
      (map || visit).insertAdjacentElement('afterend', visitorAccess);
    }

    /* GALLERY */
    const concept = document.getElementById('concept');
    const galleryImages = Array.isArray(data.galleryImages) ? data.galleryImages : [];
    if (concept && galleryImages.length && !document.getElementById('gallery')) {
      const gallery = document.createElement('section');
      gallery.className = 'gallerySection completeReveal';
      gallery.id = 'gallery';
      gallery.innerHTML = `
        <div class="gallerySection__head">
          <div>
            <p class="sectionEyebrow">ARCHIVE / GALLERY</p>
            <h2>GALLERY</h2>
          </div>
          <p>会場の空気感、ブランドの展示、プロダクト、人の交わり。MONTAGEの記録を大きなビジュアルで辿れます。</p>
        </div>
        <div class="galleryStage">
          <img id="galleryMainImage" src="${escapeHtml(galleryImages[0].src)}" alt="${escapeHtml(galleryImages[0].alt || 'MONTAGE gallery')}">
          <div class="galleryControls">
            <button type="button" data-gallery-prev aria-label="前の画像">←</button>
            <button type="button" data-gallery-next aria-label="次の画像">→</button>
          </div>
        </div>
        <div class="galleryThumbs">
          ${galleryImages.map((item,index) => `
            <button type="button" class="galleryThumb" data-gallery-index="${index}" aria-current="${index === 0 ? 'true' : 'false'}" aria-label="ギャラリー ${index + 1}">
              <img src="${escapeHtml(item.src)}" alt="">
            </button>
          `).join('')}
        </div>
      `;
      concept.insertAdjacentElement('afterend', gallery);

      const main = gallery.querySelector('#galleryMainImage');
      const thumbs = [...gallery.querySelectorAll('[data-gallery-index]')];
      let current = 0;
      const show = index => {
        if (!main || !galleryImages.length) return;
        current = (index + galleryImages.length) % galleryImages.length;
        gallery.querySelector('.galleryStage')?.classList.add('is-changing');
        setTimeout(() => {
          main.src = galleryImages[current].src;
          main.alt = galleryImages[current].alt || 'MONTAGE gallery';
          thumbs.forEach((btn,i) => btn.setAttribute('aria-current', String(i === current)));
          gallery.querySelector('.galleryStage')?.classList.remove('is-changing');
        }, 140);
      };
      thumbs.forEach(btn => btn.addEventListener('click', () => show(Number(btn.dataset.galleryIndex || 0))));
      gallery.querySelector('[data-gallery-prev]')?.addEventListener('click', () => show(current - 1));
      gallery.querySelector('[data-gallery-next]')?.addEventListener('click', () => show(current + 1));
    }

    /* Sustainability resources: keep the editorial hero and restore its PDFs / book links. */
    const sustain = document.getElementById('sustainability');
    if (sustain && !document.getElementById('sustainability-resources')) {
      const first = data.sustainabilityResources?.[0];
      const sustainCta = sustain.querySelector('.cta');
      if (first && sustainCta) {
        sustainCta.href = first.url;
        sustainCta.target = '_blank';
        sustainCta.rel = 'noopener';
      }
      sustain.insertAdjacentElement('afterend', buildUtility({
        id:'sustainability-resources',
        tone:'paper',
        eyebrow:'SUSTAINABILITY / DOCUMENTS',
        title:'Evidence, not claims.',
        lead:'環境配慮の取り組みは、読み物だけでなく証書・レポートまで確認できる状態を維持します。',
        links:data.sustainabilityResources || []
      }));
    }

    /* Partners */
    const contact = document.getElementById('contact');
    if (contact && Array.isArray(data.partners) && data.partners.length && !document.getElementById('partners')) {
      const partners = document.createElement('section');
      partners.className = 'partnersSection completeReveal';
      partners.id = 'partners';
      partners.innerHTML = `
        <p class="sectionEyebrow">WITH / PARTNERS</p>
        <h2>Partners</h2>
        <div class="partnerGrid">
          ${data.partners.map(item => {
            const inner = `${escapeHtml(item.name)}${item.meta ? `<small>${escapeHtml(item.meta)}</small>` : ''}`;
            return item.url
              ? `<a class="partnerItem" href="${escapeHtml(item.url)}"${externalAttrs(item.url)}><span>${inner}</span></a>`
              : `<div class="partnerItem"><span>${inner}</span></div>`;
          }).join('')}
        </div>
      `;
      contact.insertAdjacentElement('beforebegin', partners);
    }

    /* CONTACT: replace placeholder homepage links with the actual destinations from the current site. */
    if (contact && Array.isArray(data.contactLinks)) {
      const links = contact.querySelector('.contact__links');
      if (links) {
        links.innerHTML = data.contactLinks.map(item => `
          <a href="${escapeHtml(item.url)}"${externalAttrs(item.url)}>
            <span>${escapeHtml(item.label)}</span><span>↗</span>
          </a>
        `).join('');
      }
      if (!contact.querySelector('.contact__notice')) {
        const notice = document.createElement('p');
        notice.className = 'contact__notice';
        notice.textContent = 'MONTAGEの展示会では、一般の方の入場はお断りしております。予めご了承ください。来場前に来場規約をご確認ください。';
        contact.querySelector('.contact__mid')?.insertAdjacentElement('afterend', notice);
      }
    }

    /* Scroll reveal for the newly restored sections. */
    const revealItems = [...document.querySelectorAll('.completeReveal')];
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold:.12, rootMargin:'0px 0px -6% 0px' });
      revealItems.forEach(item => observer.observe(item));
    } else {
      revealItems.forEach(item => item.classList.add('is-visible'));
    }
  });
})();
