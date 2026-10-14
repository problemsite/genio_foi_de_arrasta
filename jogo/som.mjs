// ======================================================================
// MOTOR DE SOM DOS EFEITOS (o mesmo código roda no jogo e no editor)
// Cada som padrão é "gravado" uma vez num buffer (OfflineAudioContext), normalizado
// e depois tocado com volume, tom, corte e fades. Arquivos próprios também viram buffer.
// ======================================================================
window.MotorSom = (function () {
  const SR = 44100;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const DUR = { glitch: 0.6, tremor: 1.1, escuridao: 0.9, zoom: 0.8, filtro: 1.3, filme: 2, aparicoes: 1.9, batimento: 0.5, nevoa: 4, imagem: 1.2, menuEstatica: 3, menuZumbido: 3, menuBip: 0.07, menuEntrar: 1.2 };

  function ruido(ac, dur, f) {
    const n = Math.max(1, Math.floor(ac.sampleRate * dur)), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = f ? f(i / n, i, n) : Math.random() * 2 - 1;
    return b;
  }
  function fonte(ac, buf, ate, t0) { const s = ac.createBufferSource(); s.buffer = buf; s.connect(ate); s.start(t0 || 0); return s; }
  function filtro(ac, tipo, freq, q, ate) { const f = ac.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; if (q) f.Q.value = q; f.connect(ate); return f; }
  function ganho(ac, ate, v) { const g = ac.createGain(); g.gain.value = v == null ? 1 : v; g.connect(ate); return g; }
  function env(g, pts) { g.gain.cancelScheduledValues(0); g.gain.setValueAtTime(pts[0][0] > 0 ? 0 : pts[0][1], 0); g.gain.setValueAtTime(pts[0][1], pts[0][0]); for (let i = 1; i < pts.length; i++) g.gain.linearRampToValueAtTime(pts[i][1], pts[i][0]); }
  function osc(ac, tipo, freq, ate, t0, t1) { const o = ac.createOscillator(); o.type = tipo; o.frequency.value = freq; o.connect(ate); o.start(t0 || 0); o.stop(t1 || 10); return o; }
  function saturar(ac, k, ate) { const w = ac.createWaveShaper(), c = new Float32Array(512); for (let i = 0; i < 512; i++) { const x = i / 256 - 1; c[i] = Math.tanh(x * k); } w.curve = c; w.connect(ate); return w; }

  // ---------- desenho de cada som (tudo começa em 0 e vai pro "saida") ----------
  const DESENHO = {
    glitch(ac, out) {
      // estática digital: trechos "segurados", cortes secos e bipes curtos
      let v = 0, seg = 0, bip = 0, bf = 0;
      const b = ruido(ac, DUR.glitch, (x, i) => {
        if (--seg <= 0) { v = Math.random() < 0.3 ? 0 : Math.random() * 2 - 1; seg = Math.floor(rnd(40, 700)); if (Math.random() < 0.12) { bip = Math.floor(rnd(500, 1800)); bf = rnd(700, 3200); } }
        let s = v * (Math.random() < 0.75 ? 1 : 0) + (Math.random() * 2 - 1) * 0.18;
        if (bip > 0) { bip--; s = s * 0.4 + (Math.sin(i / SR * Math.PI * 2 * bf) > 0 ? 0.7 : -0.7); }
        return s;
      });
      const g = ganho(ac, out); env(g, [[0, 0], [0.01, 1], [DUR.glitch - 0.06, 0.9], [DUR.glitch, 0]]);
      fonte(ac, b, filtro(ac, 'bandpass', 1900, 0.5, g));
    },
    tremor(ac, out) {
      // ronco: ruído grave + "crocante" no médio (pra ouvir em caixinha de notebook)
      let u = 0;
      const b = ruido(ac, DUR.tremor, () => (u = u * 0.97 + (Math.random() * 2 - 1) * 0.03) * 5);
      const g = ganho(ac, out); env(g, [[0, 0], [0.06, 1], [0.5, 0.75], [DUR.tremor, 0]]);
      const sat = saturar(ac, 4, g);
      fonte(ac, b, filtro(ac, 'lowpass', 420, 0, sat));
      const o = osc(ac, 'sawtooth', 52, filtro(ac, 'lowpass', 260, 0, ganho(ac, sat, 0.5)), 0, DUR.tremor);
      o.frequency.setValueAtTime(58, 0); o.frequency.linearRampToValueAtTime(40, DUR.tremor);
      fonte(ac, ruido(ac, DUR.tremor), filtro(ac, 'bandpass', 600, 1.2, ganho(ac, g, 0.45)));
    },
    escuridao(ac, out) {
      // energia caindo: zumbido elétrico descendo + estalo
      const g = ganho(ac, out); env(g, [[0, 0], [0.01, 1], [0.35, 0.7], [DUR.escuridao, 0]]);
      const lp = filtro(ac, 'lowpass', 2400, 2, g);
      lp.frequency.setValueAtTime(2400, 0); lp.frequency.exponentialRampToValueAtTime(140, DUR.escuridao);
      const o = osc(ac, 'sawtooth', 120, lp, 0, DUR.escuridao), o2 = osc(ac, 'square', 180, ganho(ac, lp, 0.6), 0, DUR.escuridao);
      [o, o2].forEach((x, k) => { x.frequency.setValueAtTime(k ? 180 : 120, 0); x.frequency.exponentialRampToValueAtTime(k ? 45 : 32, DUR.escuridao); });
      const gc = ganho(ac, out); env(gc, [[0, 1], [0.03, 0]]);
      fonte(ac, ruido(ac, 0.04), filtro(ac, 'highpass', 900, 0, gc));
    },
    zoom(ac, out) {
      const d = DUR.zoom, g = ganho(ac, out); env(g, [[0, 0], [d * 0.5, 1], [d, 0]]);
      const f = filtro(ac, 'bandpass', 300, 2.2, g);
      f.frequency.setValueAtTime(300, 0); f.frequency.exponentialRampToValueAtTime(2600, d * 0.55); f.frequency.exponentialRampToValueAtTime(700, d);
      fonte(ac, ruido(ac, d), f);
    },
    filtro(ac, out) {
      // "stinger" grave e sujo
      const d = DUR.filtro, g = ganho(ac, out); env(g, [[0, 0], [0.18, 1], [0.7, 0.6], [d, 0]]);
      const lp = filtro(ac, 'lowpass', 300, 4, g);
      lp.frequency.setValueAtTime(300, 0); lp.frequency.linearRampToValueAtTime(1600, 0.4); lp.frequency.exponentialRampToValueAtTime(200, d);
      [110, 116.5, 165].forEach((fq) => { const o = osc(ac, 'sawtooth', fq, lp, 0, d); o.frequency.setValueAtTime(fq * 1.5, 0); o.frequency.exponentialRampToValueAtTime(fq, d); });
      const gn = ganho(ac, out); env(gn, [[0, 0], [0.3, 0.25], [d, 0]]);
      fonte(ac, ruido(ac, d), filtro(ac, 'highpass', 2500, 0, gn));
    },
    filme(ac, out) {
      // projetor: claque mecânico regular + estalos + chiado
      const d = DUR.filme, per = SR / 18; let e = 0, c = 0;
      const b = ruido(ac, d, (x, i) => {
        if (Math.random() < 0.0012) e = rnd(0.5, 1);
        e *= 0.88;
        const cl = (i % per) < 60 ? (1 - (i % per) / 60) * 0.5 * (Math.random() * 2 - 1) : 0;
        c = c * 0.6 + (Math.random() * 2 - 1) * 0.4;
        return cl + (Math.random() * 2 - 1) * e + c * 0.06;
      });
      fonte(ac, b, filtro(ac, 'highpass', 700, 0, ganho(ac, out)));
    },
    imagem(ac, out) {
      // "vuuush" subindo + um grave leve (a imagem chegando)
      const d = DUR.imagem, g = ganho(ac, out); env(g, [[0, 0], [0.55, 0.9], [0.75, 0.5], [d, 0]]);
      const bp = filtro(ac, 'bandpass', 400, 2.5, g);
      bp.frequency.setValueAtTime(350, 0); bp.frequency.exponentialRampToValueAtTime(2600, 0.6); bp.frequency.exponentialRampToValueAtTime(900, d);
      fonte(ac, ruido(ac, d), bp);
      const gs = ganho(ac, out); env(gs, [[0, 0], [0.5, 0], [0.58, 0.55], [d, 0]]);
      const o = osc(ac, 'sine', 110, gs, 0, d); o.frequency.setValueAtTime(140, 0.5); o.frequency.exponentialRampToValueAtTime(55, d);
      osc(ac, 'triangle', 220, ganho(ac, gs, 0.35), 0, d).frequency.setValueAtTime(220, 0);
    },
    aparicoes(ac, out) {
      const d = DUR.aparicoes, g = ganho(ac, out); env(g, [[0, 0], [0.5, 0.8], [1.2, 0.6], [d, 0]]);
      // eco simples
      const atraso = ac.createDelay(1); atraso.delayTime.value = 0.23; const fb = ganho(ac, atraso, 0.4); atraso.connect(fb); atraso.connect(out);
      const mix = ganho(ac, g); mix.connect(atraso);
      [[660, 0.5], [990, 0.25], [440, 0.3]].forEach(([fq, v], k) => {
        const o = osc(ac, 'sine', fq, ganho(ac, mix, v), 0, d), l = osc(ac, 'sine', 5 + k, ganho(ac, o.frequency, fq * 0.02), 0, d);
        o.frequency.setValueAtTime(fq, 0); o.frequency.exponentialRampToValueAtTime(fq * 0.55, d);
      });
      const bp = filtro(ac, 'bandpass', 3000, 5, ganho(ac, mix, 0.9));
      bp.frequency.setValueAtTime(3200, 0); bp.frequency.exponentialRampToValueAtTime(900, d);
      fonte(ac, ruido(ac, d), bp);
    },
    batimento(ac, out) {
      // tum-tum: grave + harmônicos + um "toc" pra dar pra ouvir em qualquer caixinha
      [[0, 1], [0.2, 0.7]].forEach(([t0, v]) => {
        const g = ganho(ac, out); env(g, [[t0, 0], [t0 + 0.012, v], [t0 + 0.16, 0]]);
        const sat = saturar(ac, 9, g);
        const o = osc(ac, 'sine', 62, sat, t0, t0 + 0.2); o.frequency.setValueAtTime(75, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.16);
        const o2 = osc(ac, 'triangle', 190, ganho(ac, sat, 0.6), t0, t0 + 0.2); o2.frequency.setValueAtTime(240, t0); o2.frequency.exponentialRampToValueAtTime(110, t0 + 0.14);
        const gt = ganho(ac, out); env(gt, [[t0, 0], [t0 + 0.003, v * 0.9], [t0 + 0.06, 0]]);
        fonte(ac, ruido(ac, 0.07), filtro(ac, 'bandpass', 700, 0.8, gt), t0);
      });
    },
    menuEstatica(ac, out) {
      // chiado de TV antiga (fecha o laço em 3 s)
      let e = 0;
      const b = ruido(ac, DUR.menuEstatica, (x) => { if (Math.random() < 0.0006) e = rnd(0.4, 1); e *= 0.995; return (Math.random() * 2 - 1) * (0.55 + 0.15 * Math.sin(x * Math.PI * 6) + e * 0.6); });
      fonte(ac, b, filtro(ac, 'bandpass', 2600, 0.35, ganho(ac, out)));
    },
    menuZumbido(ac, out) {
      // zumbido elétrico de lâmpada (60 Hz + harmônicos, oscilando de leve)
      const g = ganho(ac, out); const sat = saturar(ac, 3, filtro(ac, 'lowpass', 1800, 0, g));
      [[60, 0.6], [120, 0.5], [180, 0.35], [240, 0.2], [300, 0.12]].forEach(([fq, v]) => osc(ac, 'sawtooth', fq, ganho(ac, sat, v * 0.4), 0, DUR.menuZumbido));
      const lfo = osc(ac, 'sine', 1 / 1.5, ganho(ac, g.gain, 0.25), 0, DUR.menuZumbido); void lfo;
    },
    menuBip(ac, out) { const g = ganho(ac, out); env(g, [[0, 0], [0.004, 1], [0.06, 0]]); osc(ac, 'square', 1250, filtro(ac, 'lowpass', 3000, 0, g), 0, 0.07); },
    menuEntrar(ac, out) {
      // estática forte que corta
      let v = 0, seg = 0;
      const b = ruido(ac, DUR.menuEntrar, () => { if (--seg <= 0) { v = Math.random() * 2 - 1; seg = Math.floor(rnd(20, 300)); } return v * 0.6 + (Math.random() * 2 - 1) * 0.5; });
      const g = ganho(ac, out); env(g, [[0, 0], [0.02, 1], [0.8, 0.8], [DUR.menuEntrar, 0]]);
      fonte(ac, b, filtro(ac, 'bandpass', 1500, 0.4, g));
    },
    nevoa(ac, out) {
      // vento: ruído marrom passando por um filtro que vai e volta (fecha o laço certinho em 4 s)
      const d = DUR.nevoa; let u = 0;
      const b = ruido(ac, d, (x) => { u = u * 0.985 + (Math.random() * 2 - 1) * 0.015; return u * 8 * (0.6 + 0.4 * Math.sin(x * Math.PI * 2)); });
      const bp = filtro(ac, 'bandpass', 500, 0.8, ganho(ac, out));
      bp.frequency.setValueAtTime(380, 0); bp.frequency.linearRampToValueAtTime(900, d / 2); bp.frequency.linearRampToValueAtTime(380, d);
      fonte(ac, b, bp);
    }
  };

  function normalizar(buf, alvo) {
    let pico = 0;
    for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > pico) pico = a; } }
    if (pico > 0.0001) { const k = alvo / pico; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; } }
    return buf;
  }
  const cache = new Map();
  function buffer(tipo) {
    if (!DESENHO[tipo] || !OAC) return Promise.resolve(null);
    if (!cache.has(tipo)) {
      cache.set(tipo, (async () => {
        try {
          const off = new OAC(1, Math.ceil(SR * (DUR[tipo] + 0.02)), SR);
          DESENHO[tipo](off, off.destination);
          return normalizar(await off.startRendering(), 0.9);
        } catch (e) { console.warn('[som]', tipo, e); return null; }
      })());
    }
    return cache.get(tipo);
  }
  const cacheArq = new Map();
  function decodificar(url) {
    if (!url) return Promise.resolve(null);
    if (!cacheArq.has(url)) {
      cacheArq.set(url, (async () => {
        try {
          const r = await fetch(url), dados = await r.arrayBuffer();
          const ac = new OAC(1, 1, SR);
          return await new Promise((ok, erro) => { const p = ac.decodeAudioData(dados, ok, erro); if (p && p.then) p.then(ok, erro); });
        } catch (e) { return null; }
      })());
    }
    return cacheArq.get(url);
  }
  // toca um buffer: volume, tom (+ variação), começo, duração, aparecer/sumir suave, em loop
  function tocar(ac, buf, p, ganhoExtra) {
    if (!ac || !buf) return null;
    p = p || {};
    const t = ac.currentTime, s = ac.createBufferSource(), g = ac.createGain();
    s.buffer = buf;
    const tom = Math.max(0.1, (+p.tom || 1) * (1 + rnd(-1, 1) * Math.max(0, +p.variarTom || 0)));
    s.playbackRate.value = tom;
    const ini = Math.min(Math.max(0, +p.inicio || 0), Math.max(0, buf.duration - 0.01));
    const resto = buf.duration - ini;
    const dur = p.duracao > 0 ? Math.min(+p.duracao, resto) : resto;
    const real = dur / tom, vol = Math.max(0, (p.volume == null ? 1 : +p.volume) * (ganhoExtra == null ? 1 : ganhoExtra));
    const fi = Math.max(0, +p.fadeIn || 0), fo = Math.max(0, +p.fadeOut || 0);
    s.connect(g); g.connect(ac.destination);
    if (p.loop) {
      s.loop = true; s.loopStart = ini; s.loopEnd = ini + dur;
      g.gain.setValueAtTime(0, t); g.gain.setTargetAtTime(vol, t, Math.max(0.02, fi / 3));
      s.start(t, ini);
    } else {
      g.gain.setValueAtTime(fi > 0 ? 0 : vol, t);
      if (fi > 0) g.gain.linearRampToValueAtTime(vol, t + Math.min(fi, real));
      const fimFade = t + real;
      if (fo > 0 && real > fo) { g.gain.setValueAtTime(vol, fimFade - Math.min(fo, real)); g.gain.linearRampToValueAtTime(0.0001, fimFade); }
      else { g.gain.setValueAtTime(vol, Math.max(t, fimFade - 0.012)); g.gain.linearRampToValueAtTime(0.0001, fimFade); }
      s.start(t, ini, dur);
    }
    return {
      vol(x) { try { g.gain.setTargetAtTime(Math.max(0, x), ac.currentTime, 0.06); } catch (e) {} },
      parar(fade) { try { const n = ac.currentTime, f = fade == null ? Math.max(0.05, fo || 0.15) : fade; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value, n); g.gain.linearRampToValueAtTime(0.0001, n + f); s.stop(n + f + 0.02); } catch (e) {} }
    };
  }
  // volume geral: tudo que vai pra "destination" passa por aqui (50% = volume normal; 100% = o dobro, com limitador)
  function mestre(ac) {
    if (!ac) return null;
    if (ac.__mestre) return ac.__mestre;
    const real = ac.destination, g = ac.createGain(), lim = ac.createDynamicsCompressor();
    lim.threshold.value = -4; lim.knee.value = 2; lim.ratio.value = 14; lim.attack.value = 0.003; lim.release.value = 0.12;
    g.connect(lim); lim.connect(real);
    try { Object.defineProperty(ac, 'destination', { value: g, configurable: true }); } catch (e) {}
    ac.__mestre = g;
    return g;
  }
  function volume(ac, v) { const g = mestre(ac); if (!g) return; const x = Math.max(0, Math.min(1, +v)) * 2; try { g.gain.setTargetAtTime(x, ac.currentTime, 0.02); } catch (e) { g.gain.value = x; } }
  return { buffer, decodificar, tocar, mestre, volume, DUR, tipos: Object.keys(DESENHO) };
})();
