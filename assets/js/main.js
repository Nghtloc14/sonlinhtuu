// Sơn Linh Tửu — hành vi trang
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    if (el && document.contains(el)) el.focus();
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

  // ---- Quy trình trượt ngang (điện thoại, máy tính bảng): thanh chọn bước + vạch tiến độ đi theo
  const track = document.getElementById('cac-buoc');
  const chips = [...document.querySelectorAll('.step-nav a')];
  if (track && chips.length) {
    const cards = [...track.children];
    const bar = document.querySelector('.step-bar i');
    const sliding = () => getComputedStyle(track).display === 'flex';
    let cur = -1;
    const setActive = k => {
      if (k === cur) return;
      cur = k;
      chips.forEach((a, i) => {
        a.classList.toggle('is-here', i === k);
        if (i === k) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current');
      });
      if (bar) bar.style.setProperty('--k', k);
      const nav = chips[k].parentElement, chip = chips[k];
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
    };
    let busy = false;
    track.addEventListener('scroll', () => {
      if (busy) return;
      busy = true;
      requestAnimationFrame(() => {
        busy = false;
        const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
        const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
        setActive(atEnd ? cards.length - 1 : Math.max(0, Math.min(cards.length - 1, Math.round(track.scrollLeft / step))));
      });
    }, { passive: true });
    chips.forEach((a, i) => a.addEventListener('click', e => {
      if (!sliding()) return; // máy tính: 4 bước đã hiện đủ, để link cuộn trang như thường
      e.preventDefault();
      track.scrollTo({ left: cards[i].offsetLeft - cards[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
      setActive(i);
    }));
    setActive(0);
  }

  // ---- iOS chỉ áp trạng thái :active (bấm giữ) khi trang có lắng nghe chạm
  document.addEventListener('touchstart', () => {}, { passive: true });

  // ---- Hiện dần khi cuộn tới; nhóm (4 bước, 3 ảnh, 2 giấy) hiện lần lượt
  const groups = ['.head', '.diem-list > .diem', '.about__lead', '.place', '.steps > .step', '.gallery > figure', '.docs > .doc', '.docs__note', '.contact__lead', '.contact__actions', '.foot__in > div'];
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
