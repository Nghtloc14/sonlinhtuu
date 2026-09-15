// Sơn Linh Tửu — hành vi trang
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Viền chọn chỉ cho người dùng bàn phím: phím điều hướng thì bật, chạm/bấm chuột thì tắt
  const root = document.documentElement;
  addEventListener('keydown', e => {
    if (e.key === 'Tab' || e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key.startsWith('Arrow')) root.classList.add('kb');
  }, true);
  addEventListener('pointerdown', () => root.classList.remove('kb'), true);

  // ---- Video = ảnh động: tắt tiếng, lặp, không nút. Tải khi gần tới, chạy khi thấy, khuất thì dừng.
  // Máy bật Giảm chuyển động → giữ ảnh bìa. Máy chặn tự phát → giữ ảnh bìa tới lần chạm kế tiếp.
  const vids = [...document.querySelectorAll('video[data-src]')];
  vids.forEach(v => {
    v.muted = true;
    v.addEventListener('playing', () => v.classList.add('is-on'));
  });
  if (!reduce && 'IntersectionObserver' in window) {
    const setSrc = v => {
      if (v.getAttribute('src')) return;
      v.preload = 'auto';
      v.src = v.dataset.src;
    };
    const load = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        setSrc(e.target);
        load.unobserve(e.target);
      }
    }, { rootMargin: '600px 0px' });
    // Máy chặn tự phát (iPhone bật Chế độ nguồn điện thấp, trình duyệt trong Zalo/Facebook): phát ngay lần chạm, vuốt, bấm kế tiếp
    const seen = new Set(), blocked = new Set();
    const tryPlay = v => {
      const p = v.play();
      if (p) p.then(() => blocked.delete(v), () => { if (v.paused) blocked.add(v); });
    };
    // Trong lần chạm: video đang thấy thì phát; video đã tải sẵn phía dưới thì phát rồi dừng ngay để máy cho phép (tới nơi tự chạy)
    const retry = () => {
      vids.forEach(v => {
        if (seen.has(v)) { if (blocked.has(v)) tryPlay(v); return; }
        if (!blocked.size || v.dataset.mo || !v.getAttribute('src')) return;
        const p = v.play();
        if (p) p.then(() => { v.dataset.mo = '1'; if (!seen.has(v)) v.pause(); }, () => {});
      });
    };
    vids.forEach(v => v.addEventListener('playing', () => { v.dataset.mo = '1'; }));
    ['touchend', 'click', 'keydown'].forEach(t => addEventListener(t, retry, { capture: true, passive: true }));
    const run = new IntersectionObserver(entries => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          seen.add(v);
          setSrc(v);
          tryPlay(v);
        } else {
          seen.delete(v);
          if (!v.paused) v.pause();
        }
      }
    }, { threshold: 0.15 });
    vids.forEach(v => { load.observe(v); run.observe(v); });
  }

  // ---- Hộp thoại: mở, đóng bằng nút / bấm nền / Escape, trả focus về đúng chỗ mở (mỗi hộp nhớ riêng)
  const openers = new WeakMap();
  const open = (d, from) => {
    if (!d || typeof d.showModal !== 'function') return false;
    openers.set(d, from || document.activeElement);
    d.showModal();
    return true;
  };
  const giveBack = d => {
    const el = openers.get(d);
    openers.delete(d);
    if (el && document.contains(el)) el.focus({ preventScroll: true });
  };
  document.querySelectorAll('dialog').forEach(d => {
    // Trả focus ngay khi bấm đóng, không chờ sự kiện "close" (có trình duyệt nhúng không phát sự kiện này)
    const close = () => { d.close(); giveBack(d); };
    d.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    d.addEventListener('click', e => {
      if (e.target !== d) return; // chỉ đóng khi bấm ra nền ngoài hộp, không đóng khi bấm vào lề trong hộp
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close();
    });
    d.addEventListener('close', () => giveBack(d)); // Escape
  });
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => open(document.getElementById(btn.dataset.open), btn));
  });

  // ---- Xem giấy tờ
  const DOCS = {
    'giay-phep': {
      title: 'Giấy phép sản xuất rượu thủ công · Số 04/GP-KT&HT',
      pages: [['assets/img/giay-phep-1.webp', 'Giấy phép sản xuất rượu, trang 1'], ['assets/img/giay-phep-2.webp', 'Giấy phép sản xuất rượu, trang 2']]
    },
    'attp': {
      title: 'Chứng nhận đủ điều kiện an toàn thực phẩm · Số 07/GCN.ATTP',
      pages: [['assets/img/giay-attp.webp', 'Giấy chứng nhận cơ sở đủ điều kiện an toàn thực phẩm']]
    }
  };
  const viewer = document.getElementById('xem-giay');
  const showDoc = btn => {
    const doc = DOCS[btn.dataset.doc];
    if (!doc || !viewer) return;
    viewer.querySelector('h2').textContent = doc.title;
    const box = viewer.querySelector('.viewer__pages');
    box.replaceChildren(...doc.pages.map(([src, alt]) => {
      const img = new Image(1100, 1557);
      img.src = src; img.alt = alt; img.decoding = 'async';
      return img;
    }));
    if (open(viewer, btn)) viewer.scrollTop = 0;
  };
  document.querySelectorAll('[data-doc]').forEach(btn => btn.addEventListener('click', () => showDoc(btn)));
  // Chạm, bấm vào bất kỳ chỗ nào trên thẻ giấy tờ (tên, số hiệu, nơi cấp, khoảng trống) cũng mở bản giấy — không phải nhắm đúng ảnh hay nút.
  // Bàn phím vẫn dùng hai nút có sẵn. Vuốt qua thẻ để cuộn thì trình duyệt không phát "click" nên không mở nhầm.
  document.querySelectorAll('.docs > .doc').forEach(card => {
    const btn = card.querySelector('[data-doc]');
    if (!btn) return;
    card.addEventListener('click', e => {
      if (e.target.closest('button, a')) return; // nút trong thẻ đã tự mở
      if (String(getSelection && getSelection()).trim()) return; // đang bôi đen chữ để sao chép số hiệu thì không mở
      showDoc(btn);
    });
  });

  // ---- Thanh trên cùng (máy tính): gạch chân mục đang xem
  const links = [...document.querySelectorAll('.top__nav a')];
  if (links.length && 'IntersectionObserver' in window) {
    const byId = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        links.forEach(a => a.classList.toggle('is-here', a === byId.get(e.target.id)));
      }
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(s => spy.observe(s));
  }

  // ---- Quy trình cuộn dọc: đầu vạch vàng nằm ở một đường ngang cố định trên màn hình (vùng mắt đọc).
  // Vạch chạm hình thoi của bước nào thì hình thoi đó tô vàng, xoay nửa vòng, và bước đó sáng lên; bước khác dịu xuống.
  // Tính theo vị trí cuộn trong cùng khung hình với vạch vàng, nên không sáng sớm, không trễ, không nhảy qua lại.
  const stepList = document.getElementById('cac-buoc');
  if (stepList) {
    const items = [...stepList.children];
    const marks = items.map(el => el.querySelector('.step__n'));
    const topBar = document.querySelector('.top'), bottomBar = document.querySelector('.bar');
    const reached = items.map(() => false);
    let queued = false, active = -1;
    const trace = () => {
      queued = false;
      const r = stepList.getBoundingClientRect();
      const line = getComputedStyle(stepList, '::after');
      const lineTop = r.top + (parseFloat(line.top) || 0), lineH = r.height - (parseFloat(line.top) || 0) - (parseFloat(line.bottom) || 0);
      const tH = topBar ? topBar.offsetHeight : 0, bH = bottomBar ? bottomBar.offsetHeight : 0;
      const centers = marks.map(m => { const b = m.getBoundingClientRect(); return b.top + b.height / 2; });
      // Hình thoi ở đầu bước (điện thoại): chạm khi tên bước lên tới 45% vùng nhìn; hình thoi giữa bước (máy tính): 50%
      const i0 = items[0].getBoundingClientRect();
      const k = (centers[0] - i0.top) / i0.height > .3 ? .5 : .45;
      const F = tH + (innerHeight - tH - bH) * k;
      stepList.style.setProperty('--p', Math.min(1, Math.max(0, (F - lineTop) / lineH)).toFixed(4));
      let last = -1;
      centers.forEach((c, i) => {
        if (!reached[i] && c <= F) reached[i] = true;
        else if (reached[i] && c > F + 16) reached[i] = false; // đệm 16px (nằm dưới hình thoi) để đứng ở ranh giới không chớp
        items[i].classList.toggle('is-qua', reached[i]);
        if (reached[i]) last = i;
      });
      const now = Math.max(0, last); // chưa tới bước nào thì bước 1 sáng sẵn, không bao giờ dịu cả 4
      if (now !== active) { active = now; items.forEach((el, i) => el.classList.toggle('is-active', i === now)); }
      stepList.classList.toggle('is-live', r.top < innerHeight * .7 && r.bottom > innerHeight * .3);
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(trace); } }, { passive: true });
    addEventListener('resize', trace);
    addEventListener('load', trace);
    trace();
  }

  // ---- Nút lên đầu trang (chum rượu): rượu trong chum dâng theo đoạn đã đọc.
  // Hiện khi đã cuộn qua phần lớn đầu trang, chỉ ẩn khi quay về gần đầu trang — không ẩn/hiện theo hướng vuốt
  // (vuốt trên điện thoại luôn có những nhịp giật ngược rất nhỏ làm nút chớp). Ngưỡng tính theo đầu trang, có khoảng đệm,
  // nên thanh địa chỉ điện thoại co giãn cũng không làm nút chớp.
  const fab = document.querySelector('[data-fab]');
  const topBtn = fab && fab.querySelector('.fab__top');
  if (topBtn) {
    topBtn.addEventListener('click', () => {
      topBtn.classList.remove('is-bay'); void topBtn.offsetWidth; topBtn.classList.add('is-bay');
      setTimeout(() => topBtn.classList.remove('is-bay'), 800);
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
    const heroEl = document.querySelector('.hero');
    let pending = false, show = false;
    const sync = () => {
      pending = false;
      const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      const edge = heroEl ? heroEl.offsetTop + heroEl.offsetHeight * .75 : 600;
      topBtn.style.setProperty('--p', (max > 0 ? Math.min(1, y / max) : 0).toFixed(3));
      if (!show && y > edge) show = true;
      else if (show && y < edge - 160) show = false;
      fab.classList.toggle('show-top', show);
    };
    addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(sync); } }, { passive: true });
    addEventListener('resize', sync);
    sync();
  }

  // ---- Giấy tờ chính thức: tờ giấy phản hồi theo cú cuộn như giấy thật (lò xo + ma sát): cuộn mạnh lắc mạnh, cuộn nhẹ lắc nhẹ.
  // Cuộn tới vừa tầm mắt, tay vừa dừng vuốt (lúc mắt đang nhìn) thì tờ giấy nhấc lên rung chào ~2 giây kèm một nhịp sáng.
  // Đứng yên xem một lúc thì nhắc nhẹ. Rê chuột (máy tính) hay chạm ngón tay (điện thoại) vào tờ nào tờ đó lắc đáp lại ngay,
  // ngón tay đặt trên tờ giấy mà vuốt thì giấy lắc theo ngón tay (tờ đang lắc dở thì lắng nhanh nhường lượt).
  // Mỗi lúc chỉ một tờ rung. Rung tự động (chào, nhắc): tờ đang rung lắng hẳn rồi nghỉ thêm 2,5 giây thì tờ kia mới tự rung.
  // Thao tác của người xem (cuộn, vuốt, chạm, rê chuột) luôn được đáp lại ngay: tờ khác đang lắc dở thì lắng nhanh nhường lượt.
  const docCards = [...document.querySelectorAll('.docs > .doc')];
  if (docCards.length && !reduce) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    const SWAY = { k: .12, c: coarse ? .06 : .09 }, HELLO = { k: .12, c: .05, big: 1 }, HOVER = { k: .16, c: .09, big: 1 }, TOUCH = { k: .14, c: .07, big: 1 }, YIELD = { k: .16, c: .35 }, EASE = { k: .14, c: .11 };
    const G = coarse ? 2 : 1; // điện thoại: lắc theo cú vuốt rõ hơn (ngón tay vuốt ngắn hơn lăn chuột)
    const papers = docCards.map((card, i) => ({ card, el: card.querySelector('.doc__paper'), dir: i % 2 ? 1 : -1, a: 0, v: 0, e: 0, c: 2, m: SWAY, armed: true, want: false, hover: false, last: 0, peak: 0, t: 0 }));
    const MAX = 6, GAP = 2500;
    let running = false, lastY = scrollY, lastDy = 0, lastT = 0, lastFast = 0, idle = 0, owner = null, lastOwner = null, freeAt = 0, near = null;
    const flash = p => {
      p.card.classList.remove('is-loe'); void p.card.offsetWidth; p.card.classList.add('is-loe');
      clearTimeout(p.t); p.t = setTimeout(() => p.card.classList.remove('is-loe'), 2100);
    };
    const free = p => owner === p || (!owner && (p === lastOwner || performance.now() >= freeAt)); // tờ này có được tự rung lúc này không (khoảng nghỉ chỉ chặn tờ kia)
    const push = (p, force, mode) => { owner = p; p.last = performance.now(); if (mode) p.m = mode; if (p.m.big) p.big = true; p.v += p.dir * force; wake(); };
    const soft = p => Math.max(.15, 1 - Math.abs(p.a) / 5); // giấy càng nghiêng, lực thêm càng yếu: lắc mạnh mà không chạm góc tối đa
    const where = p => { const r = p.card.getBoundingClientRect(); return (r.top + r.height / 2) / innerHeight; }; // 0 = mép trên, 1 = mép dưới
    const tick = () => {
      // Tính theo thời gian thật (không theo số khung hình): màn 120Hz (iPhone, MacBook đời mới) rung đúng nhịp như màn 60Hz
      const now = performance.now(), dt = lastT ? Math.min(64, Math.max(4, now - lastT)) : 1000 / 60, step = dt / (1000 / 60);
      lastT = now;
      const y = scrollY, dy = Math.max(-90, Math.min(90, (y - lastY) / step)); // tốc độ cuộn quy về mỗi 1/60 giây
      lastY = y;
      if (Math.abs(dy) >= 3) lastFast = now;
      // Lực cuộn chỉ tác động lên tờ gần giữa màn hình nhất (đổi tờ khi tờ kia gần giữa hơn hẳn, để không giằng qua lại)
      let best = null, bw = 0;
      for (const p of papers) {
        p.c = where(p);
        if (p.c < -.3 || p.c > 1.3) { p.armed = true; p.want = false; } // ra hẳn khỏi màn hình thì lần sau cuộn tới lại rung chào
        p.w = p.c > .05 && p.c < .95 ? 1 - Math.abs(p.c - .5) * 1.4 : 0;
        if (p.w > bw && !p.hover) { best = p; bw = p.w; }
      }
      if (!near || !near.w || (best && best !== near && best.w > near.w + (near.e > 1 ? .35 : .12))) near = best; // tờ đang lắc rõ thì giữ lượt lâu hơn
      const held = papers.some(p => p.touch);
      if (near && near.w && dy && !held) { // ngón tay đang đặt trên tờ giấy thì tờ đó lắc theo ngón tay (xem touchmove), không cộng lực cuộn
        const f = Math.max(-.7, Math.min(.7, G * near.w * (dy * .004 * step + (dy - lastDy) * .04))); // giới hạn mỗi nhịp: bắt đầu vuốt không giật mạnh
        if (Math.abs(f) > .01) { // người xem đang cuộn: luôn đáp lại; tờ trước đó lắng êm (không cắt ngang) nhường tờ đang ở giữa
          if (owner && owner !== near) owner.m = EASE;
          push(near, f * soft(near), owner === near ? null : SWAY);
        }
      }
      for (const p of papers) {
        if (p.armed && dy > 0 && p.c > .2 && p.c < .75) { p.armed = false; p.want = true; } // cuộn xuống tới vừa tầm mắt: xếp lượt rung chào
        if (p.want && (p.c < .08 || p.c > .92)) p.want = false; // chờ lâu quá, tờ đã ra khỏi màn hình thì thôi
        if (p.want && free(p) && !held && now - lastFast > 100) { p.want = false; p.v *= .3; p.a *= .5; push(p, 1.8, HELLO); flash(p); } // tay vừa dừng vuốt: rung chào (bớt đà lắc cũ để không chạm góc tối đa)
      }
      let moving = false;
      for (const p of papers) {
        p.v = Math.max(-2, Math.min(2, p.v)); // nhiều lực dồn cùng lúc (chạm + cuộn + búng) cũng không lắc quá ~5°
        for (let r = step; r > 0; r -= 1) { const h = Math.min(1, r); p.v += (-p.m.k * p.a - p.m.c * p.v) * h; p.a = Math.max(-MAX, Math.min(MAX, p.a + p.v * h)); }
        p.e = Math.max(Math.abs(p.a), p.e * Math.pow(.965, step)); // bao độ lắc: giấy nhấc lên khi rung, hạ xuống dần khi lắng
        if (Math.abs(p.a) > .15 || Math.abs(p.v) > .05 || p.e > .25) moving = true; // dưới mức mắt thấy thì coi như đã lắng
        if (p === owner) p.peak = Math.max(p.peak, Math.abs(p.a));
        p.el.style.rotate = p.a.toFixed(2) + 'deg';
        p.el.style.translate = '0 ' + (-p.e * 1.3).toFixed(1) + 'px';
        p.el.style.scale = (1 + p.e * .013).toFixed(3);
      }
      if (owner && !moving) { // sau rung chào, nhắc, chạm, rê chuột: rung tự động của tờ kia chờ 2,5 giây; sau lắc theo cuộn: 0,6 giây
        freeAt = now + (owner.peak > 1.2 ? (owner.big ? GAP : 600) : 0);
        owner.peak = 0; owner.big = false; lastOwner = owner; owner = null;
      }
      lastDy = dy;
      if (moving || dy) requestAnimationFrame(tick);
      else {
        running = false;
        papers.forEach(p => { p.a = p.v = p.e = 0; p.m = SWAY; p.el.style.rotate = p.el.style.translate = p.el.style.scale = ''; });
        if (papers.some(p => p.want)) setTimeout(wake, Math.max(0, freeAt - performance.now()) + 30); // tới lượt thì rung chào tờ đang chờ
      }
    };
    // lastY giữ vị trí của khung hình trước (không đặt lại khi đánh thức), để khung đầu tiên của cú cuộn vẫn đo được lực cuộn
    const wake = () => { if (!running) { running = true; lastDy = 0; lastT = 0; requestAnimationFrame(tick); } };
    // Đứng yên 4 giây mà có tờ giấy ở giữa màn hình thì nhắc nhẹ tờ lâu chưa rung nhất, rồi cứ 7 giây một lần
    const nudge = () => {
      const seen = papers.filter(p => p.c > .1 && p.c < .9 && !p.hover).sort((x, z) => x.last - z.last);
      if (seen.length && free(seen[0]) && !papers.some(p => p.touch)) { push(seen[0], 1.4, HELLO); flash(seen[0]); }
      idle = setTimeout(nudge, seen.length ? 7000 : 4000);
    };
    const rest = () => { clearTimeout(idle); idle = setTimeout(nudge, 4000); };
    addEventListener('scroll', () => { wake(); rest(); }, { passive: true });
    papers.forEach(p => { p.c = where(p); });
    rest();
    // Người xem chủ động (rê chuột, chạm) thì tờ đó đáp lại ngay; tờ khác đang lắc dở thì lắng nhanh nhường lượt
    const takeOver = p => papers.forEach(q => { if (q !== p && (Math.abs(q.a) > .02 || Math.abs(q.v) > .02)) { q.m = YIELD; q.want = false; } });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) papers.forEach(p => {
      p.card.addEventListener('pointerenter', () => { p.hover = true; rest(); takeOver(p); p.peak = 0; push(p, 1.5, HOVER); });
      p.card.addEventListener('pointerleave', () => { p.hover = false; });
    });
    papers.forEach(p => {
      // Chạm: lắc đáp lại ngay (chạm nhẹ rồi nhấc thì thêm nhịp sáng)
      p.card.addEventListener('touchstart', e => {
        const t = e.touches[0];
        p.touch = { x: t.clientX, y: t.clientY, t: performance.now() };
        rest(); takeOver(p); p.peak = 0;
        p.touch.x0 = t.clientX; p.touch.y0 = t.clientY;
        push(p, 1.4 * soft(p), TOUCH);
      }, { passive: true });
      // Vuốt với ngón tay đặt trên tờ giấy: giấy nghiêng nhẹ theo ngón tay, đổi hướng hay đổi tốc độ thì giật theo
      p.card.addEventListener('touchmove', e => {
        const t = e.touches[0], s0 = p.touch;
        if (!s0) return;
        const now = performance.now(), k = (1000 / 60) / Math.max(8, now - s0.t);
        const vx = (t.clientX - s0.x) * k, vy = (t.clientY - s0.y) * k; // tốc độ ngón tay, quy về mỗi 1/60 giây
        const ax = vx - (s0.vx || 0), ay = vy - (s0.vy || 0);
        s0.x = t.clientX; s0.y = t.clientY; s0.t = now; s0.vx = vx; s0.vy = vy;
        if (owner !== p) takeOver(p);
        owner = p; p.m = TOUCH; p.big = true; p.last = now;
        p.v += Math.max(-1.2, Math.min(1.2, vx * .02 - vy * .012 * p.dir + ax * .07 - ay * .05 * p.dir)) * soft(p);
        wake();
      }, { passive: true });
      // Nhấc ngón tay: giấy bật rung theo lực vuốt, như búng tờ giấy (vuốt càng nhanh rung càng mạnh)
      const up = () => {
        const s0 = p.touch;
        p.touch = null; rest();
        if (s0 && Math.hypot(s0.x - s0.x0, s0.y - s0.y0) < 10) { flash(p); return; } // chạm nhẹ (không vuốt): thêm nhịp sáng
        if (!s0 || performance.now() - s0.t > 120) return; // giữ yên rồi mới nhấc thì không búng
        const speed = Math.hypot(s0.vx || 0, s0.vy || 0);
        if (speed < 2) return;
        if (owner && owner !== p) takeOver(p);
        p.v = p.v * .4 - Math.sign(p.a || p.dir) * Math.min(2.2, .9 + speed * .05) * soft(p);
        owner = p; p.m = TOUCH; p.big = true; p.last = performance.now();
        wake();
      };
      p.card.addEventListener('touchend', up, { passive: true });
      p.card.addEventListener('touchcancel', up, { passive: true });
    });
  }

  // ---- Máy tính không gọi điện được: bấm số thì sao chép số và báo nhỏ
  const toast = document.querySelector('.toast');
  let toastTimer;
  const say = msg => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2800);
  };
  const legacyCopy = text => {
    const t = document.createElement('textarea');
    t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.append(t); t.select();
    let done = false;
    try { done = document.execCommand('copy'); } catch (_) {}
    t.remove();
    return done ? Promise.resolve() : Promise.reject();
  };
  const copyText = text => (navigator.clipboard && window.isSecureContext
    ? navigator.clipboard.writeText(text).catch(() => legacyCopy(text))
    : legacyCopy(text));
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('a[href^="tel:"]').forEach(a => a.addEventListener('click', e => {
      const digits = a.getAttribute('href').slice(4);
      const shown = digits.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
      e.preventDefault();
      const box = a.closest('dialog');
      const report = msg => { if (box && box.open) box.close(); say(msg); };
      // Sao chép không được thì vẫn hiện số để khách đọc
      copyText(digits).then(
        () => report(`Đã sao chép số ${shown} · gọi hoặc nhắn Zalo từ điện thoại`),
        () => report(`Số điện thoại: ${shown} · gọi hoặc nhắn Zalo từ điện thoại`)
      );
    }));
  }

  // ---- iOS chỉ áp trạng thái :active (bấm giữ) khi trang có lắng nghe chạm
  document.addEventListener('touchstart', () => {}, { passive: true });

  // ---- Tiêu đề phần: hình thoi xoay vào, nét vàng vẽ ra khi tiêu đề lên tới khoảng 3/4 màn hình (lúc còn sát mép dưới thì chưa chạy)
  const orns = [...document.querySelectorAll('.head .orn')];
  if (reduce || !('IntersectionObserver' in window)) {
    orns.forEach(o => o.closest('.head').classList.add('is-ve'));
  } else {
    const ve = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.closest('.head').classList.add('is-ve');
        ve.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -25% 0px' });
    orns.forEach(o => ve.observe(o));
  }

  // ---- Hiện dần khi cuộn tới; nhóm (4 bước, 3 ảnh, 2 giấy) hiện lần lượt
  const groups = ['.head', '.diem-list > .diem', '.about__lead', '.place', '.step__head', '.gallery > figure', '.docs > .doc', '.docs__note', '.contact__lead', '.contact__actions', '.foot__in > div'];
  const revealEls = [];
  groups.forEach(sel => document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('rv');
    el.style.setProperty('--i', /\s>\s/.test(sel) ? i : 0);
    revealEls.push(el);
  }));
  const done = el => {
    el.classList.add('is-in');
    // Xong hiệu ứng thì gỡ lớp để hiệu ứng rê chuột không bị trễ theo
    setTimeout(() => { el.classList.remove('rv', 'is-in'); el.style.removeProperty('--i'); }, 1400 + 110 * (+el.style.getPropertyValue('--i') || 0));
  };
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(done);
  } else {
    const rv = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        done(e.target);
        rv.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => rv.observe(el));
  }

  // ---- Cuộn: thu gọn thanh trên, vạch tiến độ, lớp núi sau trôi chậm (chiều sâu); lớp trước đứng yên để chân núi liền với phần kế tiếp
  const top = document.querySelector('.top');
  const hero = document.querySelector('.hero');
  const layers = reduce ? [] : [[document.querySelector('.mtn--back'), .22]].filter(([el]) => el);
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    if (top) {
      top.classList.toggle('is-scrolled', y > 24);
      top.style.setProperty('--doc', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    }
    if (hero && y < hero.offsetHeight) layers.forEach(([el, k]) => { el.style.transform = `translateY(${(y * k).toFixed(1)}px)`; });
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  // ---- Chuột: ảnh trong khung vòm và quầng sáng dịch nhẹ theo con trỏ
  const arch = document.querySelector('.arch');
  if (arch && hero && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      arch.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
      arch.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => { arch.style.setProperty('--mx', 0); arch.style.setProperty('--my', 0); });
  }

  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
})();
