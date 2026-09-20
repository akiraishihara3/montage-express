(async () => {
  const data = window.MONTAGE_MAP_DATA;
  if (!data || !Array.isArray(data.booths)) return;

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = s => String(s ?? '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
  const safeUrl = s => /^https?:\/\//i.test(String(s||'')) ? String(s) : '';

  function parseCsv(text){
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i],next=text[i+1];
      if(quoted){
        if(ch==='"'&&next==='"'){cell+='"';i++}
        else if(ch==='"') quoted=false;
        else cell+=ch;
      }else{
        if(ch==='"') quoted=true;
        else if(ch===','){row.push(cell);cell=''}
        else if(ch==='\n'){row.push(cell);rows.push(row);row=[];cell=''}
        else if(ch!=='\r') cell+=ch;
      }
    }
    row.push(cell);if(row.some(v=>v!==''))rows.push(row);return rows;
  }

  async function hydrateFromSheet(){
    if(!data.sheetCsvUrl) return;
    try{
      const res=await fetch(data.sheetCsvUrl,{cache:'no-store'});if(!res.ok)throw new Error('sheet');
      const rows=parseCsv(await res.text());if(rows.length<2)return;
      const headers=rows[0].map(h=>norm(h));
      const idx=name=>headers.indexOf(norm(name));
      const get=(r,name)=>{const i=idx(name);return i>=0?(r[i]||'').trim():''};
      const map=new Map(data.booths.map(b=>[norm(b.id),b]));
      rows.slice(1).forEach(r=>{
        const id=get(r,'Booth');const b=map.get(norm(id));if(!b)return;
        const brand=get(r,'Brand'),company=get(r,'Company'),c1=get(r,'Category 1'),c2=get(r,'Category 2');
        if(brand)b.brand=brand;if(company)b.company=company;
        const cats=[c1,c2].filter(Boolean);if(cats.length)b.categories=cats;
        b.brandUrl=get(r,'Brand URL')||b.brandUrl||'';
        b.companyUrl=get(r,'Company URL')||b.companyUrl||'';
        b.instagram=get(r,'Instagram')||b.instagram||'';
        b.description=get(r,'Description')||b.description||'';
        b.logo=get(r,'Brand Logo')||get(r,'Logo')||b.logo||'';
      });
    }catch(e){console.warn('MONTAGE map sheet could not be loaded',e)}
  }

  await hydrateFromSheet();

  const state = {
    hall:'ALL', query:'', categories:new Set(), selected:null, view:'2d',
    viewBox:{...data.bounds}, dragging:false, dragMoved:false, dragStart:null,
    panelCollapsed:false, three:null, currentSheet:null
  };

  const byId = new Map(data.booths.map(b => [b.id,b]));
  const stage = $('#mapStage');
  const svg = $('#mapSvg');
  const map2d = $('#map2d');
  const map3d = $('#map3d');
  const desktopPanelBody = $('#desktopPanelBody');
  const desktopSuggestions = $('#desktopSuggestions');
  const mobileSuggestions = $('#mobileSuggestions');
  const backdrop = $('#sheetBackdrop');

  $('#dataStatus').textContent = data.dataStatus || '';

  function matches(b){
    const hallOk = state.hall === 'ALL' || b.hall === state.hall;
    const catOk = !state.categories.size || (b.categories || []).some(c => state.categories.has(c));
    const q = norm(state.query);
    const qOk = !q || [b.id,b.brand,b.company].some(v => norm(v).includes(q));
    return hallOk && catOk && qOk;
  }

  function filteredBooths(){ return data.booths.filter(matches); }

  function renderCategories(){
    const html = data.categories.map(c => `<button type="button" class="categoryChip" data-category="${esc(c)}">${esc(c)}</button>`).join('');
    $('#desktopCategories').innerHTML = html;
    $('#mobileCategories').innerHTML = html;
    $$('[data-category]').forEach(btn => btn.addEventListener('click', () => {
      const c = btn.dataset.category;
      state.categories.has(c) ? state.categories.delete(c) : state.categories.add(c);
      syncCategoryButtons();
      updateFilters();
    }));
  }

  function syncCategoryButtons(){
    $$('[data-category]').forEach(btn => btn.classList.toggle('is-active', state.categories.has(btn.dataset.category)));
    $('#filterCount').textContent = state.categories.size ? String(state.categories.size) : '';
  }

  function syncHallButtons(){
    $$('[data-hall]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.hall === state.hall));
  }

  function renderResults(){
    if (state.selected && innerWidth > 900) return;
    const countEl = $('#desktopResultCount');
    const listEl = $('#desktopResults');
    if (!countEl || !listEl) return;
    const list = filteredBooths().sort((a,b) => a.hall.localeCompare(b.hall) || a.id.localeCompare(b.id));
    countEl.textContent = list.length;
    listEl.innerHTML = list.length ? list.map(b => `
      <button class="resultItem" type="button" data-result-id="${b.id}">
        <span class="resultItem__id">${b.id}</span>
        <span><strong>${esc(b.brand)}</strong><small>${esc(b.company)}</small></span>
        <span class="resultItem__arrow">→</span>
      </button>`).join('') : '<div class="emptyState">該当する出展者が見つかりません。</div>';
    $('[data-result-id]', listEl).forEach(btn => btn.addEventListener('click', () => selectBooth(btn.dataset.resultId, true)));
  }

  function suggestionList(){
    const q = norm(state.query);
    if (!q) return [];
    return data.booths.filter(b => [b.id,b.brand,b.company].some(v => norm(v).includes(q))).slice(0,8);
  }

  function renderSuggestions(){
    const list = suggestionList();
    const html = list.map(b => `
      <button class="suggestion" type="button" data-suggest-id="${b.id}">
        <span class="suggestion__id">${b.id}</span>
        <span><strong>${esc(b.brand)}</strong><small>${esc(b.company)}</small></span>
      </button>`).join('');
    [desktopSuggestions,mobileSuggestions].forEach(el => {
      el.innerHTML = html;
      el.classList.toggle('is-open', !!html);
      $$('[data-suggest-id]', el).forEach(btn => btn.addEventListener('click', () => {
        state.query = btn.closest('.searchSuggestions') === mobileSuggestions ? $('[data-search]', $('.mobileControls')).value : $('[data-search]', $('.sidePanel')).value;
        closeSuggestions();
        selectBooth(btn.dataset.suggestId, true);
      }));
    });
  }

  function closeSuggestions(){ [desktopSuggestions,mobileSuggestions].forEach(el => el.classList.remove('is-open')); }

  function updateFilters(){
    renderResults();
    update2DState();
    update3DState();
    renderSuggestions();
  }

  $$('[data-search]').forEach(input => {
    input.addEventListener('input', e => {
      state.query = e.target.value;
      $$('[data-search]').forEach(other => { if (other !== e.target) other.value = state.query; });
      updateFilters();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = suggestionList()[0];
        if (first) { e.preventDefault(); closeSuggestions(); selectBooth(first.id,true); }
      }
      if (e.key === 'Escape') closeSuggestions();
    });
  });

  $$('[data-search-clear]').forEach(btn => btn.addEventListener('click', () => {
    state.query = '';
    $$('[data-search]').forEach(input => input.value = '');
    closeSuggestions(); updateFilters();
  }));

  $$('[data-hall]').forEach(btn => btn.addEventListener('click', () => {
    state.hall = btn.dataset.hall;
    syncHallButtons();
    updateFilters();
    fitHall(state.hall);
  }));

  $$('[data-clear-filters]').forEach(btn => btn.addEventListener('click', () => {
    state.categories.clear(); syncCategoryButtons(); updateFilters();
  }));

  $('#editionSelect').addEventListener('change', e => {
    if (e.target.value === 'archive') location.href = '../archive/';
  });

  function render2D(){
    const b = data.bounds;
    svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`);
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    let html = '<g class="floor">';
    Object.entries(data.halls).forEach(([name,h]) => {
      html += `<rect class="hall-outline" x="${h.x}" y="${h.y}" width="${h.w}" height="${h.h}"></rect>`;
      html += `<text class="hall-title" x="${h.x+h.w/2}" y="${h.y-12}" text-anchor="middle">${name} HALL</text>`;
    });
    html += `<rect class="facility-mark" x="846" y="153" width="78" height="28" rx="2"></rect>
      <text class="facility-label" x="885" y="169" text-anchor="middle">RECEPTION</text>
      <text class="facility-label" x="591" y="210" text-anchor="middle">ENTRANCE / PASSAGE</text>`;
    html += '</g><g class="booths">';
    data.booths.forEach(b => {
      const cx=b.x+b.w/2, cy=b.y+b.h/2;
      const brand = b.brand.length > 20 ? b.brand.slice(0,18)+'…' : b.brand;
      html += `<g class="booth" data-booth="${b.id}" tabindex="0" role="button" aria-label="${esc(b.id+' '+b.brand)}">
        <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="1"></rect>
        <text class="booth-id" x="${cx}" y="${cy-2}">${b.id}</text>
        <text class="booth-brand" x="${cx}" y="${cy+6}">${esc(brand)}</text>
      </g>`;
    });
    html += '</g>';
    svg.innerHTML = html;
    $('.booth',svg).forEach(g => {
      const activate = () => selectBooth(g.dataset.booth,true);
      g.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') { e.preventDefault(); activate(); } });
    });
    setViewBox({...data.bounds});
    update2DState();
  }

  function setViewBox(v){
    const bounds=data.bounds;
    const minW=70, minH=45;
    let next={x:v.x,y:v.y,w:clamp(v.w,minW,bounds.w*1.15),h:clamp(v.h,minH,bounds.h*1.15)};
    next.x=clamp(next.x,bounds.x-bounds.w*.08,bounds.x+bounds.w-next.w+bounds.w*.08);
    next.y=clamp(next.y,bounds.y-bounds.h*.12,bounds.y+bounds.h-next.h+bounds.h*.12);
    state.viewBox=next;
    svg.setAttribute('viewBox',`${next.x} ${next.y} ${next.w} ${next.h}`);
    stage.classList.toggle('is-close', next.w < 590);
  }

  function fitRect(rect,pad=26){
    const stageRect=map2d.getBoundingClientRect();
    const aspect=stageRect.width/Math.max(stageRect.height,1);
    let w=rect.w+pad*2, h=rect.h+pad*2;
    if (w/h < aspect) w=h*aspect; else h=w/aspect;
    setViewBox({x:rect.x+rect.w/2-w/2,y:rect.y+rect.h/2-h/2,w,h});
  }

  function fitHall(hall){
    if (state.view==='3d') { fitHall3D(hall); return; }
    if (hall==='ALL') setViewBox({...data.bounds});
    else if (data.halls[hall]) fitRect(data.halls[hall],18);
  }

  function focusBooth2D(b){
    const targetW=Math.max(180,b.w*5);
    const stageRect=map2d.getBoundingClientRect();
    const aspect=stageRect.width/Math.max(stageRect.height,1);
    const targetH=targetW/aspect;
    setViewBox({x:b.x+b.w/2-targetW/2,y:b.y+b.h/2-targetH/2,w:targetW,h:targetH});
  }

  function clientToSvg(clientX,clientY){
    const r=svg.getBoundingClientRect(), v=state.viewBox;
    return {x:v.x+(clientX-r.left)/r.width*v.w,y:v.y+(clientY-r.top)/r.height*v.h};
  }

  map2d.addEventListener('wheel', e => {
    e.preventDefault();
    const p=clientToSvg(e.clientX,e.clientY), v=state.viewBox;
    const factor=e.deltaY>0?1.13:.885;
    const w=v.w*factor, h=v.h*factor;
    const rx=(p.x-v.x)/v.w, ry=(p.y-v.y)/v.h;
    setViewBox({x:p.x-rx*w,y:p.y-ry*h,w,h});
  },{passive:false});

  map2d.addEventListener('pointerdown', e => {
    state.dragging=true; state.dragMoved=false;
    state.pointerDownBooth=e.target.closest?.('.booth')?.dataset.booth || null;
    state.dragStart={clientX:e.clientX,clientY:e.clientY,view:{...state.viewBox}};
    map2d.setPointerCapture?.(e.pointerId);
  });
  map2d.addEventListener('pointermove', e => {
    if(!state.dragging||!state.dragStart)return;
    const r=map2d.getBoundingClientRect();
    const dx=(e.clientX-state.dragStart.clientX)/r.width*state.dragStart.view.w;
    const dy=(e.clientY-state.dragStart.clientY)/r.height*state.dragStart.view.h;
    if(Math.abs(e.clientX-state.dragStart.clientX)+Math.abs(e.clientY-state.dragStart.clientY)>10) state.dragMoved=true;
    setViewBox({...state.dragStart.view,x:state.dragStart.view.x-dx,y:state.dragStart.view.y-dy});
  });
  const endDrag=(e)=>{
    const clickedBooth = state.dragging && !state.dragMoved ? state.pointerDownBooth : null;
    state.dragging=false; state.dragMoved=false; state.pointerDownBooth=null;
    if(clickedBooth) selectBooth(clickedBooth,true);
  };
  const cancelDrag=()=>{state.dragging=false;state.dragMoved=false;state.pointerDownBooth=null};
  map2d.addEventListener('pointerup',endDrag); map2d.addEventListener('pointercancel',cancelDrag);

  function update2DState(){
    $$('.booth',svg).forEach(g => {
      const b=byId.get(g.dataset.booth); if(!b)return;
      g.classList.toggle('is-dim',!matches(b));
      g.classList.toggle('is-selected',state.selected===b.id);
    });
  }

  function detailMarkup(b, mobile=false){
    const categories=(b.categories||[]).map(c=>`<span>${esc(c)}</span>`).join('');
    const logo=safeUrl(b.logo)?`<img src="${esc(safeUrl(b.logo))}" alt="" style="display:block;max-width:160px;max-height:62px;object-fit:contain;margin:18px 0">`:'';
    const desc=b.description?`<p style="margin:18px 0 0;font-size:11px;line-height:1.7;color:#666">${esc(b.description)}</p>`:'';
    const links=[
      ['Brand Website',safeUrl(b.brandUrl)],
      ['Company Website',safeUrl(b.companyUrl)],
      ['Instagram',safeUrl(b.instagram)]
    ].filter(x=>x[1]).map(x=>`<a href="${esc(x[1])}" target="_blank" rel="noopener"><span>${x[0]}</span><span>↗</span></a>`).join('');
    return `<article class="detailCard">
      ${mobile?'':'<button class="detailBack" type="button" data-back-results>← BACK TO RESULTS</button>'}
      <p class="detailId">${b.id} / ${b.hall} HALL</p>
      <h2 class="detailBrand">${esc(b.brand)}</h2>
      <p class="detailCompany">${esc(b.company || 'Company information to be added')}</p>
      ${logo}
      <div class="detailTags">${categories}</div>
      ${desc}
      <div class="detailActions">
        <button class="button" type="button" data-share-booth="${b.id}">SHARE ↗</button>
      </div>
      <div class="detailLinks">
        <button type="button" data-show-map="${b.id}"><span>SHOW ON MAP</span><span>→</span></button>
        ${links || '<span style="display:block;padding:12px 0;color:#8b8b84;font-size:9px;border-bottom:1px solid var(--line)">WEB / INSTAGRAM fields are ready for Google Sheets data.</span>'}
      </div>
    </article>`;
  }

  function bindDetail(root){
    $('[data-back-results]',root)?.addEventListener('click', () => {
      state.selected=null; update2DState(); update3DState(); renderResultsPanel();
      const u=new URL(location.href);u.searchParams.delete('booth');history.replaceState({},'',u);
    });
    $('[data-share-booth]',root)?.addEventListener('click', e => shareBooth(e.currentTarget.dataset.shareBooth));
    $('[data-show-map]',root)?.addEventListener('click', e => {
      const b=byId.get(e.currentTarget.dataset.showMap); if(!b)return;
      closeSheets(); state.view==='2d'?focusBooth2D(b):focusBooth3D(b);
    });
  }

  function renderResultsPanel(){
    desktopPanelBody.innerHTML = `<div class="resultHead"><span>EXHIBITORS</span><strong id="desktopResultCount">${filteredBooths().length}</strong></div><div class="resultList" id="desktopResults"></div>`;
    const list=filteredBooths().sort((a,b)=>a.hall.localeCompare(b.hall)||a.id.localeCompare(b.id));
    $('#desktopResults').innerHTML=list.length?list.map(b=>`<button class="resultItem" type="button" data-result-id="${b.id}"><span class="resultItem__id">${b.id}</span><span><strong>${esc(b.brand)}</strong><small>${esc(b.company)}</small></span><span class="resultItem__arrow">→</span></button>`).join(''):'<div class="emptyState">該当する出展者が見つかりません。</div>';
    $$('[data-result-id]',desktopPanelBody).forEach(btn=>btn.addEventListener('click',()=>selectBooth(btn.dataset.resultId,true)));
  }

  function showDesktopDetail(b){
    desktopPanelBody.innerHTML=detailMarkup(b,false);
    bindDetail(desktopPanelBody);
  }

  function selectBooth(id,focus){
    const b=byId.get(id); if(!b)return;
    state.selected=id;
    update2DState(); update3DState();
    if (innerWidth>900) {
      if ($('#sidePanel').classList.contains('is-collapsed')) $('#panelToggle').click();
      showDesktopDetail(b);
    } else {
      $('#mobileDetail').innerHTML=detailMarkup(b,true); bindDetail($('#mobileDetail')); openSheet($('#detailSheet'));
    }
    if(focus) state.view==='2d'?focusBooth2D(b):focusBooth3D(b);
    const u=new URL(location.href);u.searchParams.set('booth',id);history.replaceState({},'',u);
  }

  function openSheet(sheet){
    if(state.currentSheet&&state.currentSheet!==sheet) state.currentSheet.classList.remove('is-open');
    state.currentSheet=sheet;sheet.classList.add('is-open');sheet.setAttribute('aria-hidden','false');backdrop.classList.add('is-open');
  }
  function closeSheets(){
    $$('.bottomSheet').forEach(s=>{s.classList.remove('is-open');s.setAttribute('aria-hidden','true')});
    backdrop.classList.remove('is-open');state.currentSheet=null;
  }
  backdrop.addEventListener('click',closeSheets);$$('[data-close-sheet]').forEach(b=>b.addEventListener('click',closeSheets));
  $('#filterBtn').addEventListener('click',()=>openSheet($('#filterSheet')));
  $('#applyFilters').addEventListener('click',closeSheets);

  function baseUrl(){
    const u=new URL(location.href);u.search='';u.hash='';return u;
  }
  function shareBooth(id){
    const u=baseUrl();u.searchParams.set('booth',id);
    const b=byId.get(id);
    openShare(`${b.id} / ${b.brand}`,u.toString());
  }
  function openShare(title,url){
    $('#shareSheetContent').innerHTML=`<p class="eyebrow">SHARE</p><h2>${esc(title)}</h2><div class="shareUrl"><input id="shareUrlField" readonly value="${esc(url)}"><button class="button button--dark" id="copyShare">COPY</button></div><div class="qrWrap" id="qrWrap"><span style="font-size:10px;color:#888">GENERATING QR…</span></div><button class="button" style="width:100%" id="nativeShare">SHARE ↗</button>`;
    $('#copyShare').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(url);e.currentTarget.textContent='COPIED';}catch(_){$('#shareUrlField').select();document.execCommand('copy');}});
    $('#nativeShare').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:'MONTAGE '+title,url});}catch(_){}}else{$('#copyShare').click();}});
    openSheet($('#shareSheet'));loadQr(url);
  }

  function loadQr(url){
    const host=$('#qrWrap');
    const render=()=>{host.innerHTML='';try{new QRCode(host,{text:url,width:180,height:180,correctLevel:QRCode.CorrectLevel.M});}catch(e){host.innerHTML='<span style="font-size:10px;color:#888">QR unavailable. Use COPY LINK.</span>';}}
    if(window.QRCode){render();return}
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';s.onload=render;s.onerror=()=>host.innerHTML='<span style="font-size:10px;color:#888">QR unavailable. Use COPY LINK.</span>';document.head.appendChild(s);
  }

  $('#panelToggle').addEventListener('click',()=>{
    state.panelCollapsed=!state.panelCollapsed;$('#sidePanel').classList.toggle('is-collapsed',state.panelCollapsed);
    setTimeout(()=>{if(state.three)resizeThree();},360);
  });

  $$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>switchView(btn.dataset.view)));
  function switchView(view){
    if(state.view===view)return;state.view=view;
    $$('[data-view]').forEach(b=>b.classList.toggle('is-active',b.dataset.view===view));
    map2d.classList.toggle('is-active',view==='2d');map3d.classList.toggle('is-active',view==='3d');
    if(view==='3d') ensureThree().then(()=>{update3DState(); if(state.selected)focusBooth3D(byId.get(state.selected));else fitHall3D(state.hall);});
    else {if(state.selected)focusBooth2D(byId.get(state.selected));else fitHall(state.hall);}
  }

  $('#resetView').addEventListener('click',()=> state.view==='2d'?fitHall(state.hall):fitHall3D(state.hall));

  function loadScript(src){
    return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  }
  async function ensureThree(){
    if(state.three)return state.three;
    if(!window.THREE){
      try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js');}
      catch(e){map3d.innerHTML='<div class="threeFallback">3D VIEW could not be loaded.<br>Please use the 2D map.</div>';return null}
    }
    return buildThree();
  }

  function labelSprite(text){
    const c=document.createElement('canvas'),ctx=c.getContext('2d');c.width=384;c.height=96;
    ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#fff';ctx.font='700 26px -apple-system,BlinkMacSystemFont,Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    const parts=text.split('\n');parts.forEach((line,i)=>ctx.fillText(line,c.width/2,parts.length===1?48:34+i*34));
    const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;
    const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false});
    const sp=new THREE.Sprite(mat);sp.scale.set(58,14,1);return sp;
  }

  function buildThree(){
    const T=window.THREE, rect=map3d.getBoundingClientRect();
    const scene=new T.Scene();scene.background=new T.Color(0xeeeeea);
    const camera=new T.PerspectiveCamera(43,Math.max(rect.width,1)/Math.max(rect.height,1),1,3500);
    const renderer=new T.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
    renderer.setSize(rect.width,rect.height);
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=T.PCFSoftShadowMap;
    if(T.sRGBEncoding) renderer.outputEncoding=T.sRGBEncoding;
    if(T.ACESFilmicToneMapping) renderer.toneMapping=T.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.05;
    map3d.innerHTML='';map3d.appendChild(renderer.domElement);

    const controls=new T.OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=.075;controls.screenSpacePanning=true;
    controls.minDistance=70;controls.maxDistance=1200;controls.maxPolarAngle=Math.PI*.49;

    // Architectural-model lighting: soft ambient + strong diagonal key + gentle fill.
    scene.add(new T.AmbientLight(0xffffff,.34));
    scene.add(new T.HemisphereLight(0xffffff,0xc9c9c2,.58));
    const dl=new T.DirectionalLight(0xffffff,1.42);
    dl.position.set(-230,360,210);
    dl.castShadow=true;
    dl.shadow.mapSize.set(2048,2048);
    dl.shadow.bias=-0.00018;
    dl.shadow.normalBias=0.02;
    dl.shadow.camera.near=20;
    dl.shadow.camera.far=1400;
    dl.shadow.camera.left=-760;
    dl.shadow.camera.right=760;
    dl.shadow.camera.top=460;
    dl.shadow.camera.bottom=-460;
    scene.add(dl);
    const fill=new T.DirectionalLight(0xffffff,.34);
    fill.position.set(260,170,-260);
    scene.add(fill);

    const cx=data.bounds.x+data.bounds.w/2, cy=data.bounds.y+data.bounds.h/2;
    const floorMat=new T.MeshStandardMaterial({color:0xd8d8d2,roughness:1,metalness:0});
    const floor=new T.Mesh(new T.PlaneGeometry(data.bounds.w+120,data.bounds.h+120),floorMat);
    floor.rotation.x=-Math.PI/2;floor.position.y=-1;floor.receiveShadow=true;scene.add(floor);

    const meshes=new Map(),labels=new Map();
    const boothHeight=34; // 34 map units = standard 2m, so 2m x 2m booth reads as a 2m cube.

    const makeBoothMaterials=()=>[
      new T.MeshStandardMaterial({color:0xd7d7d1,roughness:.96,metalness:0}), // right
      new T.MeshStandardMaterial({color:0xe1e1dc,roughness:.96,metalness:0}), // left
      new T.MeshStandardMaterial({color:0xf7f7f3,roughness:.91,metalness:0}), // top
      new T.MeshStandardMaterial({color:0xd0d0ca,roughness:.98,metalness:0}), // bottom
      new T.MeshStandardMaterial({color:0xe9e9e4,roughness:.95,metalness:0}), // front
      new T.MeshStandardMaterial({color:0xddddD7,roughness:.96,metalness:0})  // back
    ];

    data.booths.forEach(b=>{
      const geo=new T.BoxGeometry(Math.max(b.w,4),boothHeight,Math.max(b.h,4));
      const mesh=new T.Mesh(geo,makeBoothMaterials());
      mesh.position.set(b.x+b.w/2-cx,boothHeight/2,b.y+b.h/2-cy);
      mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.boothId=b.id;

      // A restrained grey outline keeps white booths legible even from a high camera angle.
      const edges=new T.LineSegments(
        new T.EdgesGeometry(geo),
        new T.LineBasicMaterial({color:0xb9b9b2,transparent:true,opacity:.72})
      );
      edges.renderOrder=2;
      mesh.add(edges);
      mesh.userData.edges=edges;

      scene.add(mesh);meshes.set(b.id,mesh);
      const label=labelSprite(`${b.id}\n${b.brand.length>14?b.brand.slice(0,13)+'…':b.brand}`);
      label.position.set(mesh.position.x,boothHeight+8,mesh.position.z);
      scene.add(label);labels.set(b.id,label);
    });
    const raycaster=new T.Raycaster(),pointer=new T.Vector2();
    let pickStart=null;
    renderer.domElement.addEventListener('pointerdown',e=>{pickStart={x:e.clientX,y:e.clientY}});
    renderer.domElement.addEventListener('pointerup',e=>{
      if(!pickStart)return;
      const moved=Math.hypot(e.clientX-pickStart.x,e.clientY-pickStart.y);pickStart=null;
      if(moved>8)return;
      const r=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects([...meshes.values()],false)[0];if(hit?.object?.userData?.boothId)selectBooth(hit.object.userData.boothId,true);
    });
    state.three={scene,camera,renderer,controls,meshes,labels,cx,cy};
    fitHall3D(state.hall);update3DState();
    const loop=()=>{if(!state.three)return;controls.update();const dist=camera.position.distanceTo(controls.target);labels.forEach(sp=>{sp.scale.set(dist<480?72:50,dist<480?18:12,1)});renderer.render(scene,camera);requestAnimationFrame(loop)};loop();
    return state.three;
  }

  function resizeThree(){
    if(!state.three)return;const r=map3d.getBoundingClientRect();state.three.camera.aspect=Math.max(r.width,1)/Math.max(r.height,1);state.three.camera.updateProjectionMatrix();state.three.renderer.setSize(r.width,r.height);
  }
  addEventListener('resize',resizeThree);

  function update3DState(){
    if(!state.three)return;
    const normalFaces=[0xd7d7d1,0xe1e1dc,0xf7f7f3,0xd0d0ca,0xe9e9e4,0xddddD7];
    state.three.meshes.forEach((mesh,id)=>{
      const b=byId.get(id),selected=state.selected===id,visible=matches(b);
      const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
      materials.forEach((mat,i)=>{
        mat.color.setHex(selected?0x11110f:(normalFaces[i]||0xe9e9e4));
        mat.transparent=false;mat.opacity=1;mat.needsUpdate=true;
      });
      if(mesh.userData.edges){
        mesh.userData.edges.material.color.setHex(selected?0x050505:0xb9b9b2);
        mesh.userData.edges.material.opacity=selected?.34:.72;
      }
      const label=state.three.labels.get(id);
      if(label){
        label.material.opacity=visible?1:.2;
        label.material.color.setHex(selected?0xffffff:0x11110f);
      }
    });
  }

  function fitHall3D(hall){
    if(!state.three)return;const t=state.three;
    const h=hall==='ALL'?data.bounds:data.halls[hall];if(!h)return;
    const tx=h.x+h.w/2-t.cx,tz=h.y+h.h/2-t.cy;
    t.controls.target.set(tx,0,tz);
    const span=Math.max(h.w,h.h);t.camera.position.set(tx-span*.25,Math.max(150,span*.42),tz+Math.max(180,span*.55));t.controls.update();
  }
  function focusBooth3D(b){
    if(!state.three||!b)return;const t=state.three,tx=b.x+b.w/2-t.cx,tz=b.y+b.h/2-t.cy;
    t.controls.target.set(tx,4,tz);t.camera.position.set(tx-70,100,tz+110);t.controls.update();
  }

  function parseUrl(){
    const u=new URL(location.href);
    const booth=u.searchParams.get('booth');if(booth&&byId.has(booth))setTimeout(()=>selectBooth(booth,true),80);
  }

  renderCategories();render2D();renderResults();syncHallButtons();syncCategoryButtons();parseUrl();
})();