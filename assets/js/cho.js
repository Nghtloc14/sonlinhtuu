// Bản A — màn chờ khi quét mã QR. Chạy ngay khi đọc tới (không defer) để trang không lộ ra trước màn chờ.
// Mẫu khung vòm (ảnh lửa bếp củi dưới nồi chưng — trước 17/09 là chum ngâm sâm). Tối thiểu 2,15 giây, chờ font + ảnh, tối đa 3 giây, chạm để bỏ qua. ?loader= để xem lại khi thử.
(() => {
  const root = document.documentElement;
  const box = document.querySelector('[data-chao]');
  if (!box || !root.classList.contains('cho-dang')) return;

  const so = new URLSearchParams(location.search).get('loader') || '6';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = 'assets/img/';
  const chu = t => Array.from(t).map((c, k) => c === ' ' ? ' ' : `<span style="--k:${k}">${c}</span>`).join('');
  const ten = `<p class="k__name" aria-label="Sơn Linh Tửu">${chu('Sơn Linh Tửu')}</p>`;
  const tag = `<p class="k__tag"><span class="k__gold">Tinh hoa núi rừng</span></p>`;
  const foot = `<p class="chao__foot">Cơ sở Nguyễn Chí Sơn · Di Linh, Lâm Đồng</p>`;
  const hoi = `<svg class="k-hoi" viewBox="0 0 120 120" aria-hidden="true"><path d="M44 110C34 88 56 76 46 54S52 22 44 6"/><path d="M62 112C72 90 50 78 60 56S54 24 64 8"/><path d="M80 110C70 90 90 74 80 52S88 24 78 8"/></svg>`;
  const hat = list => list.map(([x, d, dx]) => `<span class="k-hat" style="--x:${x};--d:${d};--dx:${dx}"></span>`).join('');

  const MAU = {
    6: { min: 2150, anh: ['mat-tien-bep-cui.webp'], html: `
      <div class="chao__in">
        <div class="k-wrap">
          <figure class="k-vom" style="margin:0"><div class="k-khung k6__khung"><img src="${IMG}mat-tien-bep-cui.webp" width="840" height="1034" alt=""></div></figure>
          ${hoi}
          ${hat([['18%', '.1s', '-8px'], ['32%', '.9s', '6px'], ['50%', '.4s', '-4px'], ['66%', '1.3s', '10px'], ['80%', '.6s', '-6px'], ['42%', '1.7s', '4px']])}
        </div>
        ${ten}${tag}
      </div>${foot}` }
  };
  const mau = MAU[so] || MAU[6];
  box.classList.add('chao--' + (MAU[so] ? so : '6'));
  box.innerHTML = mau.html;

  const t0 = performance.now();
  let xong = false;
  const dong = () => {
    if (xong) return; xong = true;
    box.classList.add('is-out'); root.classList.add('cho-mo');
    setTimeout(() => { root.classList.remove('cho-dang', 'cho-mo'); box.remove(); }, 900);
  };
  box.addEventListener('click', dong);

  const cho = [];
  if (document.fonts && document.fonts.ready) cho.push(document.fonts.ready);
  mau.anh.forEach(f => { const im = new Image(); im.src = IMG + f; cho.push(im.decode ? im.decode().catch(() => {}) : Promise.resolve()); });
  const min = reduce ? 500 : mau.min;
  Promise.race([Promise.all(cho), new Promise(r => setTimeout(r, 2600))]).then(() => setTimeout(dong, Math.max(0, min - (performance.now() - t0))));
  setTimeout(dong, 3200);
})();
