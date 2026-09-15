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
  // Không phát được (tiết kiệm pin, giảm chuyển động) → giữ ảnh bìa.
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
    const run = new IntersectionObserver(entries => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) {
          setSrc(v);
          const p = v.play();
          if (p) p.catch(() => {});
        } else if (!v.paused) {
          v.pause();
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
  document.querySelectorAll('[data-doc]').forEach(btn => {
    btn.addEventListener('click', () => {
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

  // ---- Giấy tờ chính thức: phần giấy tờ lên giữa màn hình thì hai tờ giấy bắt đầu rung nhẹ mời bấm xem.
  // Bắt đầu khi đã vào giữa màn hình (không chạy lúc còn sát mép), chỉ dừng khi cuộn hẳn ra khỏi màn hình (không chớp ở ranh giới).
  const docList = document.querySelector('.docs');
  if (docList && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { if (e.isIntersecting) docList.classList.add('is-moi'); }, { rootMargin: '-15% 0px -30% 0px' }).observe(docList);
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) docList.classList.remove('is-moi'); }).observe(docList);
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
