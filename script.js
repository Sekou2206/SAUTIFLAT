(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const motion = root.classList.contains('motion');

  $$('.year').forEach(n => { n.textContent = new Date().getFullYear(); });

  const nav = $('#nav');
  const burger = $('#burger');
  const menu = $('#menu');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    document.body.classList.toggle('menu-open', open);
    if (open) menu.querySelector('a').focus({ preventScroll: true });
  };
  if (burger && menu) {
    burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); burger.focus(); }
    });
    matchMedia('(min-width: 821px)').addEventListener('change', e => e.matches && setMenu(false));
  }

  const zones = $$('[data-nav]');
  const navTheme = () => {
    const y = nav.offsetHeight / 2;
    const zone = zones.find(z => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    if (zone) nav.classList.toggle('is-light', zone.dataset.nav === 'light');
    nav.classList.toggle('is-scrolled', scrollY > 8);
    nav.classList.toggle('is-clear', !!zone && zone.id === 'story');
  };

  const story = $('#story');
  const wheel = $('#wheel');
  const stepsEls = $$('.st');
  const segs = [];
  const labels = [];
  if (wheel) {
    const ns = 'http://www.w3.org/2000/svg';
    const R = 86, C = 100, gap = 1.4, n = stepsEls.length;
    const pt = (a, r = R) => [C + r * Math.cos(a * Math.PI / 180), C + r * Math.sin(a * Math.PI / 180)];
    const track = document.createElementNS(ns, 'circle');
    track.setAttribute('cx', C); track.setAttribute('cy', C); track.setAttribute('r', R); track.setAttribute('class', 'track');
    wheel.append(track);
    const box = wheel.parentNode;
    stepsEls.forEach((st, i) => {
      const a0 = -90 + i * 360 / n + gap / 2;
      const a1 = -90 + (i + 1) * 360 / n - gap / 2;
      const [x0, y0] = pt(a0), [x1, y1] = pt(a1);
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', `M${x0.toFixed(2)} ${y0.toFixed(2)}A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`);
      p.setAttribute('class', 'seg');
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1 1';
      p.style.strokeDashoffset = motion ? '1' : '0';
      wheel.append(p);
      segs.push(p);
      const [lx, ly] = pt((a0 + a1) / 2, 112);
      const l = document.createElement('span');
      l.className = 'wl';
      l.innerHTML = `<b>${i + 1}.</b>${$('h3', st).textContent}`;
      l.style.left = `${lx / 2}%`;
      l.style.top = `${ly / 2}%`;
      box.append(l);
      labels.push(l);
    });
  }

  let render = () => {};
  let jumpTo = null;

  if (story && motion) {
    const stage = $('#stage');
    const dot = $('#dot');
    const scenes = Object.fromEntries($$('[data-scene]', stage).map(s => [s.dataset.scene, s]));
    const lines = $$('[data-line]', stage);
    const callAnchor = $('[data-anchor=call]', stage);
    const whoItems = $$('.who-list li', stage);
    const gridL = $('#gridL'), gridD = $('#gridD'), rings = $('#rings');
    const O = [255, 67, 46, 1], W = [255, 255, 255, .15];
    const CH = [29, 29, 29], RD = [214, 57, 43], CR = [241, 235, 223];
    let A = null, top = 0, len = 1, track = [];

    const windows = {
      intro: [-1, 0, .06, .1],
      red: [.1, .14, .3, .34],
      who: [.34, .37, .53, .56],
      method: [.56, .59, .79, .82],
      call: [.82, .85, .885, .915],
      end: [.915, .95, 2, 2]
    };
    const lineWin = [[.13, .16, .205, .225], [.225, .245, 2, 2]];
    const bgKeys = [[0, CH], [.095, CH], [.14, RD], [.3, RD], [.345, CH], [.545, CH], [.585, CR], [1, CR]];
    const gridLKeys = [[0, .8], [.08, .8], [.12, 0], [.32, 0], [.36, 1], [.53, 1], [.56, 0], [1, 0]];
    const gridDKeys = [[0, 0], [.56, 0], [.6, 1], [.8, 1], [.86, 0], [1, 0]];
    const ringKeys = [[0, 0], [.11, 0], [.16, 1], [.29, 1], [.33, 0], [1, 0]];

    const sample = (keys, p) => {
      if (p <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) {
        if (p <= keys[i][0]) {
          const [p0, v0] = keys[i - 1], [p1, v1] = keys[i];
          const t = ease(clamp((p - p0) / (p1 - p0)));
          return Array.isArray(v0) ? v0.map((v, k) => lerp(v, v1[k], t)) : lerp(v0, v1, t);
        }
      }
      return keys[keys.length - 1][1];
    };
    const fade = ([a, b, c, d], p) => (p < b ? clamp((p - a) / (b - a)) : clamp((d - p) / (d - c)));

    const measure = () => {
      stage.classList.add('measuring');
      const visible = Object.values(scenes).map(s => [s, s.style.visibility]);
      visible.forEach(([s]) => { s.style.visibility = 'hidden'; });
      const sr = stage.getBoundingClientRect();
      const pos = el => {
        const r = el.getBoundingClientRect();
        return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2, s: r.width };
      };
      const m = Math.min(sr.width, sr.height);
      A = {
        intro: pos($('[data-anchor=intro]', stage)),
        who: $$('[data-anchor=who]', stage).map(pos),
        hub: pos($('[data-anchor=hub]', stage)),
        call: pos($('[data-anchor=call]', stage)),
        end: pos($('[data-anchor=end]', stage)),
        big: { x: sr.width / 2, y: sr.height / 2, s: m * .78 },
        big2: { x: sr.width / 2, y: sr.height / 2, s: m * .9 }
      };
      visible.forEach(([s, v]) => { s.style.visibility = v; });
      stage.classList.remove('measuring');
      top = story.getBoundingClientRect().top + scrollY;
      len = Math.max(1, story.offsetHeight - innerHeight);
      const w = A.who;
      track = [
        [0, A.intro, O], [.05, A.intro, O], [.15, A.big, W], [.29, A.big2, W],
        [.36, w[0], O], [.385, w[0], O], [.405, w[1], O], [.425, w[1], O], [.445, w[2], O], [.465, w[2], O],
        [.485, w[3], O], [.505, w[3], O], [.525, w[4], O], [.535, w[4], O],
        [.585, A.hub, O], [.785, A.hub, O], [.84, A.call, O], [.885, A.call, O], [.95, A.end, O], [1, A.end, O]
      ];
    };

    const dotAt = p => {
      if (p <= track[0][0]) return { ...track[0][1], c: track[0][2] };
      for (let i = 1; i < track.length; i++) {
        if (p <= track[i][0]) {
          const [p0, a0, c0] = track[i - 1], [p1, a1, c1] = track[i];
          const t = ease(clamp((p - p0) / (p1 - p0)));
          const arc = a0 !== a1 ? Math.sin(t * Math.PI) * Math.min(80, Math.abs(a1.x - a0.x) * .12) : 0;
          return { x: lerp(a0.x, a1.x, t), y: lerp(a0.y, a1.y, t) - arc, s: lerp(a0.s, a1.s, t), c: c0.map((v, k) => lerp(v, c1[k], t)) };
        }
      }
      const last = track[track.length - 1];
      return { ...last[1], c: last[2] };
    };

    let lastWho = -1, lastStep = -1;
    render = p => {
      if (!A) return;
      const d = dotAt(p);
      dot.style.transform = `translate3d(${d.x.toFixed(1)}px,${d.y.toFixed(1)}px,0) scale(${(d.s / 600).toFixed(4)})`;
      dot.style.backgroundColor = `rgba(${d.c[0] | 0},${d.c[1] | 0},${d.c[2] | 0},${d.c[3].toFixed(3)})`;
      const bg = sample(bgKeys, p);
      stage.style.backgroundColor = `rgb(${bg[0] | 0},${bg[1] | 0},${bg[2] | 0})`;
      gridL.style.opacity = sample(gridLKeys, p).toFixed(3);
      gridD.style.opacity = sample(gridDKeys, p).toFixed(3);
      rings.style.opacity = sample(ringKeys, p).toFixed(3);
      rings.firstChild.style.transform = `rotate(${(p * 140).toFixed(2)}deg)`;

      for (const [name, el] of Object.entries(scenes)) {
        const w = windows[name];
        const o = fade(w, p);
        const dir = p < w[1] ? 1 : -1;
        el.style.opacity = o.toFixed(3);
        el.style.visibility = o > .01 ? 'visible' : 'hidden';
        el.style.transform = name === 'intro' && p < w[2] ? 'none' : `translate3d(0,${(dir * (1 - o) * 36).toFixed(1)}px,0)`;
      }
      lines.forEach((l, i) => {
        const o = fade(lineWin[i], p);
        const dir = p < lineWin[i][1] ? 1 : -1;
        l.style.opacity = o.toFixed(3);
        l.style.transform = `translate3d(0,calc(-50% + ${(dir * (1 - o) * 40).toFixed(1)}px),0)`;
      });

      const who = p < .395 ? 0 : p < .435 ? 1 : p < .475 ? 2 : p < .515 ? 3 : 4;
      if (who !== lastWho) { whoItems.forEach((li, i) => li.classList.toggle('on', i === who)); lastWho = who; }

      const q = clamp((p - .595) / (.775 - .595));
      segs.forEach((s, i) => { s.style.strokeDashoffset = (1 - clamp(q * segs.length - i)).toFixed(4); });
      const step = Math.min(segs.length - 1, Math.floor(q * segs.length));
      if (step !== lastStep) {
        stepsEls.forEach((s, i) => s.classList.toggle('on', i === step));
        labels.forEach((l, i) => l.classList.toggle('on', i <= step));
        lastStep = step;
      }
      const theme = p > .565 ? 'light' : 'dark';
      if (story.dataset.nav !== theme) { story.dataset.nav = theme; navTheme(); }
      callAnchor.classList.toggle('landed', p > .835 && p < .892);
    };

    let cur = 0, target = 0, raf = 0;
    const progress = () => clamp((scrollY - top) / len);
    const tick = () => {
      cur += (target - cur) * .16;
      if (Math.abs(target - cur) < .00015) cur = target;
      render(cur);
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = progress();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const setup = () => { measure(); cur = target = progress(); render(cur); };
    jumpTo = p => scrollTo({ top: top + len * p, behavior: 'smooth' });

    setup();
    addEventListener('scroll', onScroll, { passive: true });
    let rt = 0;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(setup, 120); });
    if (document.fonts) document.fonts.ready.then(setup);
    addEventListener('load', setup);
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('ready')));

    $$('a[href="#methode"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); jumpTo(.6); history.replaceState(null, '', '#methode'); }));
    if (location.hash === '#methode') addEventListener('load', () => setTimeout(() => scrollTo(0, top + len * .6), 60));
  } else {
    stepsEls.forEach(s => s.classList.add('on'));
    labels.forEach(l => l.classList.add('on'));
  }

  let queued = false;
  const frame = () => { queued = false; navTheme(); };
  const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  frame();
})();
