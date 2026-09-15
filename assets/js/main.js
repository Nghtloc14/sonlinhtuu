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

  // ---- Quy trình cuộn dọc: vạch vàng chạy theo vị trí đọc, bước ở giữa màn hình sáng lên, bước khác dịu xuống
  const stepList = document.getElementById('cac-buoc');
  if (stepList) {
    const items = [...stepList.children];
    items[0].classList.add('is-active'); // có sẵn một bước sáng, không bao giờ dịu cả 4
    let queued = false;
    const trace = () => {
      queued = false;
      const r = stepList.getBoundingClientRect();
      const p = (innerHeight * .55 - r.top) / r.height;
      stepList.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(trace); } }, { passive: true });
    addEventListener('resize', trace);
    trace();
    if ('IntersectionObserver' in window) {
      const focus = new IntersectionObserver(entries => {
        for (const e of entries) {
          if (e.isIntersecting) items.forEach(el => el.classList.toggle('is-active', el === e.target));
        }
      }, { rootMargin: '-42% 0px -42% 0px' });
      items.forEach(el => focus.observe(el));
      // Chỉ làm dịu các bước khác khi phần quy trình đang chiếm giữa màn hình
      new IntersectionObserver(([e]) => stepList.classList.toggle('is-live', e.isIntersecting), { rootMargin: '-30% 0px -30% 0px' }).observe(stepList);
    }
  }

  // ---- Điện thoại: thanh "Đang xem" — hiện khi qua đầu trang, đổi tên khi sang phần mới, bấm mở mục lục
  const mnav = document.querySelector('[data-mnav]');
  if (mnav) {
    const bar = mnav.querySelector('.mnav__bar');
    const nameEl = mnav.querySelector('[data-mnav-name]');
    const idxEl = mnav.querySelector('[data-mnav-idx]');
    const items = [...mnav.querySelectorAll('.mnav__list a')];
    const setOpen = on => { mnav.classList.toggle('is-open', on); bar.setAttribute('aria-expanded', String(on)); };
    bar.addEventListener('click', () => setOpen(!mnav.classList.contains('is-open')));
    items.forEach(a => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('click', e => { if (mnav.classList.contains('is-open') && !mnav.contains(e.target)) setOpen(false); });
    let current = -1;
    const show = i => {
      if (i === current || i < 0) return;
      current = i;
      items.forEach((a, k) => a.classList.toggle('is-here', k === i));
      nameEl.textContent = items[i].dataset.name;
      idxEl.textContent = `0${i + 1} / 0${items.length}`;
      nameEl.classList.remove('is-swap');
      void nameEl.offsetWidth; // chạy lại hiệu ứng đổi tên
      nameEl.classList.add('is-swap');
    };
    show(0);
    if ('IntersectionObserver' in window) {
      const byId = new Map(items.map((a, k) => [a.getAttribute('href').slice(1), k]));
      const spy = new IntersectionObserver(entries => {
        for (const e of entries) if (e.isIntersecting) show(byId.get(e.target.id));
      }, { rootMargin: '-35% 0px -60% 0px' });
      byId.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
      const heroEl = document.querySelector('.hero');
      if (heroEl) new IntersectionObserver(([e]) => {
        mnav.classList.toggle('is-on', !e.isIntersecting);
        if (e.isIntersecting) setOpen(false);
      }, { rootMargin: '-64px 0px 0px 0px' }).observe(heroEl);
    }
    let waiting = false;
    const prog = () => {
      waiting = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      mnav.style.setProperty('--doc', (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(4));
    };
    addEventListener('scroll', () => { if (!waiting) { waiting = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();
  }

  // ---- Cụm hỗ trợ bên phải: mở/đóng (điện thoại), nút lên đầu trang có vòng tiến độ
  const fab = document.querySelector('[data-fab]');
  if (fab) {
    const toggle = fab.querySelector('.fab__toggle');
    const topBtn = fab.querySelector('.fab__top');
    const setOpen = on => {
      fab.classList.toggle('is-open', on);
      toggle.setAttribute('aria-expanded', String(on));
      toggle.setAttribute('aria-label', on ? 'Đóng hỗ trợ' : 'Mở hỗ trợ: Zalo, Messenger, gọi điện');
    };
    toggle.addEventListener('click', () => setOpen(!fab.classList.contains('is-open')));
    // Bấm ra ngoài (kể cả lớp nền mờ của chính cụm) thì đóng
    document.addEventListener('click', e => {
      if (fab.classList.contains('is-open') && (e.target === fab || !fab.contains(e.target))) setOpen(false);
    });
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && fab.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    fab.querySelectorAll('.fab__btn').forEach(a => a.addEventListener('click', () => setOpen(false)));
    topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    let pending = false;
    const sync = () => {
      pending = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      topBtn.style.setProperty('--p', (max > 0 ? Math.min(1, scrollY / max) : 0).toFixed(4));
      fab.classList.toggle('show-top', scrollY > innerHeight * .8);
      fab.classList.toggle('show-fab', scrollY > innerHeight * .35);
    };
    addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(sync); } }, { passive: true });
    sync();
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

  // ---- Cuộn: thu gọn thanh trên, vạch tiến độ, núi trôi chậm (chiều sâu)
  const top = document.querySelector('.top');
  const hero = document.querySelector('.hero');
  const layers = reduce ? [] : [[document.querySelector('.mtn--back'), .22], [document.querySelector('.mtn--mid'), .12]].filter(([el]) => el);
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
