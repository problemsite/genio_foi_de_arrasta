// "\n" escrito em qualquer texto vira quebra de linha
(function () {
  const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
  if (!d || !d.set) return;
  Object.defineProperty(Node.prototype, 'textContent', { configurable: true, get() { return d.get.call(this); },
    set(v) { d.set.call(this, typeof v === 'string' && v.indexOf('\\n') >= 0 ? v.replace(/\\n/g, '\n') : v); } });
})();
(function () {
  'use strict';
  const MODO = window.GAME_MODE || 'play';
  let CFG = window.GAME_CONFIG;
  let ASSETS = window.GAME_ASSETS || {};
  let NOMES = window.GAME_NOMES || {};

  const $ = (id) => document.getElementById(id);
  const palco = $('palco'), fundoA = $('fundo'), fundoB = $('fundo-b'), escurecer = $('fundo-escurecer');
  const elPers = $('personagem'), persSombra = $('pers-sombra'), akiImg = $('aki-img'), persIdle = $('pers-idle'), persTroca = $('pers-troca');
  const elPainel = $('painel'), qNum = $('q-num'), qText = $('q-text'), respostas = $('respostas');
  const elRes = $('resultado'), fotoMoldura = $('foto-moldura'), fotoImg = $('final-img');
  const topoBox = elRes.querySelector('.final-header-box'), fotoBox = elRes.querySelector('.final-image-box');
  const elRev = $('revelacao'), revImg = $('reveal-img');
  const tela = $('tela'), menuFundo = $('menu-fundo'), menuEscuro = $('menu-escuro'), menuEl = $('menu'), menuImg = $('menu-img');
  const menuTitulo = $('menu-titulo'), mtTexto = $('mt-texto'), mtImg = $('mt-img');
  const menuBotao = $('menu-botao'), mb = $('mb'), mbImg = $('mb-img'), mbTexto = $('mb-texto');
  const menuOpcoes = $('menu-opcoes'), menuRodape = $('menu-rodape'), menuFigura = $('menu-figura'), mfImg = $('mf-img'), mfAlt = $('mf-alt');
  const menuEstrelas = $('menu-estrelas');
  const menuVol = $('menu-volume'), mvRot = $('mv-rotulo'), mvBarras = $('mv-barras'), osdVol = $('osd-volume'), osdBarras = $('osd-barras');
  const menuAtmo = $('menu-atmo'), maEst = $('ma-estatica'), maLinhas = $('ma-linhas'), maVinheta = $('ma-vinheta'), maLuz = $('ma-luz'), menuAviso = $('menu-aviso');
  const itensLayer = $('itens'), aparLayer = $('aparicoes'), cvSujeira = $('sujeira'), cvGotas = $('gotas');
  const preto = $('preto'), falasEl = $('falas'), transicao = $('transicao'), revImg2 = $('reveal-img2'), elRev2 = $('revelacao2');
  const fxNevoa = $('fx-nevoa'), fxTom = $('fx-tom'), fxPulso = $('fx-pulso'), fxEscuro = $('fx-escuro');
  const cvFilme = $('fx-filme'), fxBarras = $('fx-barras'), fxFlash = $('fx-flash');
  const glTurb = $('gl-turb'), glDesl = $('gl-desl'), glOffR = $('gl-off-r'), glOffC = $('gl-off-c');
  const PONTOS = '<div class="loading-dots"><span>.</span><span>.</span><span>.</span></div>';
  const MODOS_FUNDO = { cobrir: ['cover', 'no-repeat'], conter: ['contain', 'no-repeat'], esticar: ['100% 100%', 'no-repeat'], repetir: ['auto', 'repeat'] };
  const AJUSTES = { cobrir: 'cover', conter: 'contain', esticar: 'fill' };
  const extrasEls = new Map();
  const imgAtual = new WeakMap();
  let escala = 1, estado = { tipo: 'pergunta', r: 0, p: 0 }, ocupado = false, selecionado = null;
  // "época" do jogo: o DEBUG (F2) pula pra outro ponto e os timers da parte anterior são ignorados
  let epoca = 0;
  const agendarJogo = (fn, ms) => { const e = epoca; return setTimeout(() => { if (e === epoca) fn(); }, ms); };
  let fonteAtual = null, chaveRespostas = '';
  let fundoFrente = fundoA, fundoUrl = null, tFundo = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function hexRgba(hex, a) {
    let h = String(hex || '#000000').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16) || 0;
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + (a == null ? 1 : a) + ')';
  }
  function src(id) { return id ? (ASSETS[id] || null) : null; }
  const urlCss = (s) => 'url("' + String(s).replace(/"/g, '%22') + '")';

  function placeholder(texto, w, h) {
    const t = String(texto).replace(/[<>&"]/g, '');
    const fs = Math.max(10, Math.min(w / 12, (w * 1.7) / Math.max(t.length, 1)));
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
      '<rect x="4" y="4" width="' + (w - 8) + '" height="' + (h - 8) + '" rx="14" fill="rgba(255,255,255,0.55)" stroke="#1f3a4b" stroke-width="4" stroke-dasharray="16 10"/>' +
      '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="' + fs + '" font-weight="bold" fill="#1f3a4b">' + t + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function setImg(img, id, rotulo, w, h) {
    const nome = (id && NOMES[id]) || '';
    const ph = placeholder(nome ? 'Falta: ' + nome : rotulo, w, h);
    const s = src(id) || ph;
    if (imgAtual.get(img) === s) return;
    imgAtual.set(img, s);
    img.onerror = () => { img.onerror = null; imgAtual.set(img, ph); img.src = ph; };
    img.src = s;
  }

  function ajustarPalco() {
    escala = Math.min(innerWidth / 1920, innerHeight / 1080);
    palco.style.transform = 'scale(' + escala + ')';
    const topo = document.getElementById('palco-topo');
    if (topo) topo.style.transform = 'scale(' + escala + ')';
    // o "mover" do fundo é em px de 1080p: refaz com a escala nova
    [fundoA, fundoB, menuImg].forEach((e) => { if (e && e._aj) aplicarAjuste(e, e._aj); });
    document.querySelectorAll('.el.tela').forEach((e) => { e.style.width = (innerWidth / escala + 2).toFixed(1) + 'px'; e.style.height = (innerHeight / escala + 2).toFixed(1) + 'px'; });
  }
  // ajustes de um fundo: encaixe, zoom, mover, foco, girar, espelhar, desfoque, escurecer, brilho, saturação
  const AJ_PADRAO = { modo: 'cobrir', posX: 50, posY: 50, zoom: 1, x: 0, y: 0, rotacao: 0, espelhar: false, desfoque: 0, escurecer: 0, brilho: 1, saturacao: 1 };
  function ajusteCompleto(a) {
    const r = Object.assign({}, AJ_PADRAO);
    if (a) Object.keys(AJ_PADRAO).forEach((k) => { if (a[k] != null) r[k] = a[k]; });
    return r;
  }
  function aplicarAjuste(e, aj) {
    e._aj = aj;
    const a = ajusteCompleto(aj), m = MODOS_FUNDO[a.modo] || MODOS_FUNDO.cobrir, d = +a.desfoque || 0;
    e.style.backgroundSize = m[0];
    e.style.backgroundRepeat = m[1];
    e.style.backgroundPosition = a.posX + '% ' + a.posY + '%';
    e.style.inset = d ? (-d * 2) + 'px' : '0';
    const fl = [];
    if (d) fl.push('blur(' + d + 'px)');
    if (a.brilho !== 1) fl.push('brightness(' + a.brilho + ')');
    if (a.saturacao !== 1) fl.push('saturate(' + a.saturacao + ')');
    e.style.filter = fl.join(' ');
    const z = +a.zoom || 1, ident = z === 1 && !a.x && !a.y && !a.rotacao && !a.espelhar;
    e.style.transformOrigin = a.posX + '% ' + a.posY + '%';
    e.style.transform = ident ? '' : 'translate(' + (a.x * escala).toFixed(1) + 'px,' + (a.y * escala).toFixed(1) + 'px) rotate(' + (a.rotacao || 0) + 'deg) scale(' + (a.espelhar ? -z : z) + ',' + z + ')';
  }

  // imagem "cobrindo a tela toda" (extra ou efeito): ocupa a janela inteira, com os ajustes de fundo (encaixe, zoom, foco, girar…)
  function aplicarTela(e, o, rotulo) {
    let d = e.querySelector(':scope > .tela-img');
    if (!d) { d = document.createElement('div'); d.className = 'tela-img'; e.appendChild(d); }
    if (e.firstChild && e.firstChild.tagName === 'IMG') e.firstChild.style.display = 'none';
    e.classList.add('tela');
    e.style.left = '960px'; e.style.top = '540px';
    e.style.width = (innerWidth / escala + 2).toFixed(1) + 'px'; e.style.height = (innerHeight / escala + 2).toFixed(1) + 'px';
    const a = ajusteCompleto(o.ajuste), m = MODOS_FUNDO[a.modo] || MODOS_FUNDO.cobrir, dz = +a.desfoque || 0;
    const s = src(o.imagem) || placeholder(rotulo || 'Imagem', 1920, 1080);
    const u = urlCss(s);
    if (d._u !== u) { d._u = u; d.style.backgroundImage = u; }
    d.style.backgroundSize = m[0]; d.style.backgroundRepeat = m[1];
    d.style.backgroundPosition = a.posX + '% ' + a.posY + '%';
    d.style.inset = dz ? (-dz * 2) + 'px' : '0';
    const fl = [];
    if (dz) fl.push('blur(' + dz + 'px)');
    const br = (a.brilho == null ? 1 : +a.brilho) * (1 - Math.min(0.95, +a.escurecer || 0));
    if (br !== 1) fl.push('brightness(' + br.toFixed(3) + ')');
    if (a.saturacao !== 1) fl.push('saturate(' + a.saturacao + ')');
    d.style.filter = fl.join(' ');
    const z = +a.zoom || 1;
    d.style.transformOrigin = a.posX + '% ' + a.posY + '%';
    d.style.transform = 'translate(' + (+a.x || 0) + 'px,' + (+a.y || 0) + 'px) rotate(' + (a.rotacao || 0) + 'deg) scale(' + (a.espelhar ? -z : z) + ',' + z + ')';
  }
  function tirarTela(e) {
    const d = e.querySelector(':scope > .tela-img');
    if (d) d.remove();
    if (e.firstChild && e.firstChild.tagName === 'IMG') e.firstChild.style.display = '';
    e.classList.remove('tela'); e.style.height = '';
  }
  function posicionar(e, o, podeEspelhar) {
    const s = o.escala == null ? 1 : o.escala;
    const fx = podeEspelhar && o.espelharX ? -1 : 1, fy = podeEspelhar && o.espelharY ? -1 : 1;
    e.style.left = o.x + 'px';
    e.style.top = o.y + 'px';
    e.style.transform = 'translate(-50%,-50%) rotate(' + (o.rotacao || 0) + 'deg) scale(' + (s * fx) + ',' + (s * fy) + ')';
  }

  function carregarFonte(f) {
    const fam = (f && f.familia) || 'Arima';
    document.documentElement.style.setProperty('--fonte', '"' + fam.replace(/"/g, '') + '"');
    if (fam === fonteAtual) return;
    fonteAtual = fam;
    document.querySelectorAll('link[data-fonte]').forEach((l) => l.remove());
    if (f && f.google === false) return;
    const nome = encodeURIComponent(fam).replace(/%20/g, '+');
    ['', ':wght@700'].forEach((suf) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.dataset.fonte = '1';
      l.href = 'https://fonts.googleapis.com/css2?family=' + nome + suf + '&display=swap';
      document.head.appendChild(l);
    });
  }
  // fontes extras (título do menu, falas do final)
  const fontesExtras = new Set();
  function fonteExtra(fam) {
    if (!fam) return 'var(--fonte)';
    if (!fontesExtras.has(fam)) {
      fontesExtras.add(fam);
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(fam).replace(/%20/g, '+') + '&display=swap';
      document.head.appendChild(l);
    }
    return '"' + fam.replace(/"/g, '') + '"';
  }

  // ---------- respostas (cada pergunta pode ter as suas) ----------
  function respostasDe(r, p) {
    const R = CFG.rodadas[r], q = R && R.perguntas[p];
    return q && q.respostas && q.respostas.length ? q.respostas : (CFG.textos.respostas || []);
  }
  function montarRespostas(lista) {
    const chave = JSON.stringify(lista);
    if (chave === chaveRespostas) return;
    chaveRespostas = chave;
    respostas.querySelectorAll('.answer-option').forEach((b) => b.remove());
    lista.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'answer-option';
      b.textContent = t;
      b.addEventListener('click', responder);
      respostas.appendChild(b);
    });
  }

  // ---------- fundo (pode mudar por rodada/pergunta, com troca suave) ----------
  let fundoAjChave = null;
  function estiloFundo() { fundoAjChave = null; }
  function escurecerPara(aj, t) {
    escurecer.style.transition = t ? 'background ' + t + 'ms ease' : 'none';
    escurecer.style.background = 'rgba(0,0,0,' + (ajusteCompleto(aj).escurecer || 0) + ')';
  }
  // de onde vem o fundo: pergunta > série > rodada > jogo todo
  function origemFundo(est) {
    const R = CFG.rodadas[est.r];
    if (!R || est.tipo === 'menu') return { id: CFG.fundo.imagem, o: null, aj: CFG.fundo };
    const q = est.tipo === 'pergunta' ? R.perguntas[est.p] : null;
    const s = est.tipo === 'pergunta' ? serieDe(est.r, est.p) : null;
    const id = (q && q.fundo) || (s && s.fundo) || R.fundo || CFG.fundo.imagem;
    const aj = (q && q.fundoAjuste) || (s && s.fundoAjuste) || R.fundoAjuste || CFG.fundo;
    const o = q && (q.fundo || q.fundoAjuste) ? q : s && (s.fundo || s.fundoAjuste) ? s : (R.fundo || R.fundoAjuste) ? R : null;
    return { id, o, aj };
  }
  // ajuste do fundo que está aparecendo (o que o arrastar/zoom do editor mexe)
  function ajusteMenu(editar) {
    const f = CFG.menu.fundo;
    if (!f.ajuste && editar) f.ajuste = Object.assign(ajusteCompleto(f.modo === 'jogo' ? CFG.fundo : null), { escurecer: 0 });
    return f.ajuste || (f.modo === 'jogo' ? CFG.fundo : null);
  }
  function fundoDe(est) { return origemFundo(est).id; }
  // tempo da troca: entrada de quem chega, senão saída de quem sai, senão o padrão
  function tempoTroca(ant, novo, padrao) {
    if (ant === novo) return padrao;
    const tn = novo && novo.transicao, ta = ant && ant.transicao;
    if (tn && tn.entrada != null && tn.entrada !== '') return Math.max(0, +tn.entrada) * 1000;
    if (ta && ta.saida != null && ta.saida !== '') return Math.max(0, +ta.saida) * 1000;
    return padrao;
  }
  let fundoOrig = null;
  function trocarFundo(animar) {
    atualizarOndas();
    const f = origemFundo(estado);
    const ms = animar ? tempoTroca(fundoOrig, f.o, CFG.tempos.fundo || 0) : 0;
    fundoOrig = f.o;
    definirFundo(f.id, ms, f.aj);
  }
  // ======================================================================
  // FUNDO ANIMADO "ONDAS" (degradê azul com fitas se mexendo + faixas brancas semitransparentes paradas)
  // ======================================================================
  const cvOndas = $('ondas'), ctxOndas = cvOndas.getContext('2d');
  const ONDAS_PADRAO = { ativo: false, velocidade: 1, movimento: 1, fitasForca: 1, bolha: true, faixas: false, faixasForca: 1, topo: 109, base: 825, fina: 836, finaAltura: 64, cor1: '#3b63a8', cor2: '#7fb2e8', cor3: '#b4c3f7', cor4: '#3cc4e6', resolucao: 0.5 };
  const ondasCfg = () => Object.assign({}, ONDAS_PADRAO, CFG.ondas || {});
  let ondasRaf = 0, ondasVis = false, ondasT0 = performance.now(), ondasUlt = 0;
  // menu: fundo "ondas"; jogo: pergunta > série > rodada > padrão do jogo
  function ondasLigadas(est) {
    if (!CFG) return false;
    if (est.tipo === 'menu') return !!(CFG.menu && CFG.menu.fundo && CFG.menu.fundo.modo === 'ondas');
    if (est.tipo === 'intro') return ondasLigadas({ tipo: 'pergunta', r: 0, p: 0 });
    const R = CFG.rodadas[est.r];
    const q = R && est.tipo === 'pergunta' ? R.perguntas[est.p] : null, s = R && est.tipo === 'pergunta' ? serieDe(est.r, est.p) : null;
    // quem decide: a pergunta, depois a série, depois a rodada (ligado/desligado escolhido ali,
    // ou uma imagem de fundo própria, que aparece no lugar das ondas); senão vale o padrão do jogo
    for (const o of [q, s, R]) {
      if (!o) continue;
      if (o.ondas === 'on') return true;
      if (o.ondas === 'off') return false;
      if (o.fundo) return false;
    }
    return !!ondasCfg().ativo;
  }
  function atualizarOndas() {
    const on = ondasLigadas(estado) && !(fin && fin.fase !== 'preto');
    if (on === ondasVis) return;
    ondasVis = on;
    cvOndas.style.opacity = on ? '1' : '0';
    if (on && !ondasRaf) ondasRaf = requestAnimationFrame(passoOndas);
  }
  function passoOndas(agora) {
    ondasRaf = 0;
    if (!ondasVis && +getComputedStyle(cvOndas).opacity < 0.01) return;
    if (agora - ondasUlt > 33) { ondasUlt = agora; desenharOndas((agora - ondasT0) / 1000); }
    ondasRaf = requestAnimationFrame(passoOndas);
  }
  // ---------- fundo "ondas" v2: degradê + bolha + fitas de seda (preenchidas, com espessura que torce) ----------
  // fitas: pontos [x, y, balançoX, balançoY, frequência] no espaço 1920×1080
  const FITAS = [
    // atrás (mais suaves)
    { p: [[-200, 175, 30, 25, 0.11], [130, 225, 35, 30, 0.09], [470, 150, 45, 35, 0.12], [800, 30, 40, 30, 0.1], [1100, -120, 30, 30, 0.08]], w: 120, c: [55, 80, 140], a: 0.26, tw: 0.8, ph: 0.3 },
    { p: [[-150, -60, 20, 20, 0.07], [420, 70, 25, 20, 0.08], [1000, 95, 40, 25, 0.1], [1400, 150, 45, 35, 0.12], [1700, 290, 40, 45, 0.09], [2150, 340, 30, 30, 0.1]], w: 135, c: [95, 100, 165], a: 0.24, tw: 1.1, ph: 1.7 },
    { p: [[280, 1220, 20, 20, 0.06], [700, 900, 30, 30, 0.07], [1080, 780, 55, 45, 0.1], [1430, 590, 60, 55, 0.08], [1760, 520, 45, 40, 0.11], [2150, 560, 30, 30, 0.09]], w: 150, c: [150, 165, 215], a: 0.30, tw: 0.9, ph: 3.1 },
    // frente
    { p: [[-120, 1300, 20, 20, 0.06], [60, 930, 40, 45, 0.08], [380, 790, 55, 40, 0.1], [760, 905, 60, 45, 0.09], [1160, 1110, 45, 35, 0.07], [1450, 1320, 20, 20, 0.06]], w: 250, c: [20, 85, 130], a: 0.36, tw: 0.7, ph: 4.4 },
    { p: [[200, 1250, 20, 20, 0.07], [460, 1010, 45, 40, 0.09], [900, 1035, 60, 40, 0.11], [1330, 905, 60, 55, 0.08], [1700, 700, 50, 50, 0.1], [2150, 600, 30, 30, 0.09]], w: 140, c: [70, 105, 165], a: 0.30, tw: 1.2, ph: 2.2 },
    { p: [[1560, 1200, 20, 20, 0.08], [1450, 990, 35, 35, 0.11], [1580, 880, 40, 35, 0.09], [1830, 900, 35, 35, 0.12], [2150, 1010, 25, 25, 0.1]], w: 105, c: [45, 85, 150], a: 0.32, tw: 1.4, ph: 5.3 }
  ];
  // curva suave (Catmull-Rom) por pontos que balançam com o tempo
  function espinha(pts, t, sp, mv, n) {
    const P = pts.map(([x, y, ax, ay, f], i) => [x + Math.cos(t * f * sp + i * 1.7) * ax * mv, y + Math.sin(t * f * sp * 1.13 + i * 2.3) * ay * mv]);
    const Q = [P[0]].concat(P, [P[P.length - 1]]), out = [];
    const seg = P.length - 1;
    for (let k = 0; k <= n; k++) {
      const u = k / n * seg, i = Math.min(seg - 1, Math.floor(u)), f = u - i;
      const p0 = Q[i], p1 = Q[i + 1], p2 = Q[i + 2], p3 = Q[i + 3], f2 = f * f, f3 = f2 * f;
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * f + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * f2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * f3)));
    }
    return out;
  }
  function desenharFita(c, F, t, sp, mv, forca) {
    const n = 90, S = espinha(F.p, t, sp, mv, n);
    const top = [], bot = [], mid = [];
    for (let k = 0; k <= n; k++) {
      const a = S[Math.max(0, k - 1)], b = S[Math.min(n, k + 1)];
      let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const L = Math.hypot(nx, ny) || 1; nx /= L; ny /= L;
      const u = k / n;
      // a "torção" da seda: a largura vai e volta ao longo da fita e corre com o tempo
      const tor = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * F.tw + t * 0.32 * sp + F.ph);
      const ponta = Math.min(1, u / 0.1, (1 - u) / 0.1), suave = ponta * ponta * (3 - 2 * ponta); // pontas afinam
      const w = F.w * (0.28 + 0.72 * tor) * 0.5 * suave;
      const off = (tor - 0.5) * F.w * 0.25; // o centro desliza um pouco: parece que vira
      const cx = S[k][0] + nx * off, cy = S[k][1] + ny * off;
      top.push([cx + nx * w, cy + ny * w]); bot.push([cx - nx * w, cy - ny * w]); mid.push([cx + nx * w * 0.35, cy + ny * w * 0.35, tor]);
    }
    const [r, g, b] = F.c, A = F.a * forca;
    const caminho = (L1, L2) => { c.beginPath(); c.moveTo(L1[0][0], L1[0][1]); for (let k = 1; k < L1.length; k++) c.lineTo(L1[k][0], L1[k][1]); for (let k = L2.length - 1; k >= 0; k--) c.lineTo(L2[k][0], L2[k][1]); c.closePath(); };
    // corpo
    caminho(top, bot); c.fillStyle = `rgba(${r},${g},${b},${A.toFixed(3)})`; c.fill();
    // brilho de seda (faixa mais clara perto de uma borda)
    const inner = top.map((q, k) => [(q[0] * 0.55 + mid[k][0] * 0.45), (q[1] * 0.55 + mid[k][1] * 0.45)]);
    caminho(top, inner); c.fillStyle = `rgba(255,255,255,${(0.07 * forca).toFixed(3)})`; c.fill();
    // bordas: uma clara e uma escura, bem finas
    c.lineJoin = 'round';
    c.beginPath(); top.forEach((q, k) => (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.strokeStyle = `rgba(255,255,255,${(0.10 * forca).toFixed(3)})`; c.lineWidth = 2; c.stroke();
    c.beginPath(); bot.forEach((q, k) => (k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.strokeStyle = `rgba(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b * 0.7)},${(0.22 * forca).toFixed(3)})`; c.lineWidth = 2.5; c.stroke();
  }
  function desenharOndas(t) {
    const O = ondasCfg(), dpr = Math.min(2, window.devicePixelRatio || 1) * Math.max(0.2, Math.min(1, +O.resolucao || 0.5));
    const W = Math.max(2, Math.round(innerWidth * dpr)), H = Math.max(2, Math.round(innerHeight * dpr));
    if (cvOndas.width !== W || cvOndas.height !== H) { cvOndas.width = W; cvOndas.height = H; }
    const c = ctxOndas, k = Math.max(W / 1920, H / 1080), sp = Math.max(0, +O.velocidade || 0), mv = Math.max(0, +O.movimento || 0);
    const forca = O.fitasForca == null ? 1 : Math.max(0, +O.fitasForca);
    c.setTransform(k, 0, 0, k, (W - 1920 * k) / 2, (H - 1080 * k) / 2);
    // degradê de base (canto de cima escuro → meio azul → claro/lilás → ciano embaixo)
    const g = c.createLinearGradient(1700, -150, 220, 1230);
    g.addColorStop(0, O.cor3); g.addColorStop(0.45, O.cor2); g.addColorStop(1, O.cor4);
    c.fillStyle = g; c.fillRect(-400, -400, 2720, 1880);
    const rad = (x, y, r, rgb, a) => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); };
    const w = (f, a, ph) => Math.sin(t * f * sp + (ph || 0)) * a * mv;
    const rgb = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0x3b63a8; return `${n >> 16},${(n >> 8) & 255},${n & 255}`; };
    rad(-60 + w(0.05, 40), -80 + w(0.04, 30), 900, rgb(O.cor1), 0.95);           // canto escuro
    rad(1900 + w(0.06, 70), -40 + w(0.05, 40, 1), 900, '172,160,250', 0.55);     // lilás em cima à direita
    rad(-40 + w(0.05, 50, 2), 1120 + w(0.04, 30), 820, rgb(O.cor4), 0.75);       // ciano embaixo à esquerda
    rad(520 + w(0.03, 120, 3), 470 + w(0.04, 80), 520, '255,255,255', 0.10);     // luz que passeia
    // fitas de trás
    for (let i = 0; i < 3; i++) desenharFita(c, FITAS[i], t, sp, mv, forca);
    // bolha grande e clara
    if (O.bolha !== false) {
      const bx = 1150 + w(0.045, 50), by = 560 + w(0.06, 35, 1), R = 470;
      c.save(); c.beginPath(); c.arc(bx, by, R, 0, Math.PI * 2); c.clip();
      const gb = c.createRadialGradient(bx + 80, by - 120, 40, bx, by, R);
      gb.addColorStop(0, 'rgba(246,249,255,0.50)'); gb.addColorStop(0.55, 'rgba(222,233,255,0.30)'); gb.addColorStop(0.9, 'rgba(190,205,245,0.16)'); gb.addColorStop(1, 'rgba(160,180,230,0.08)');
      c.fillStyle = gb; c.fillRect(bx - R, by - R, R * 2, R * 2);
      // sombra suave na borda esquerda (dá volume)
      const gs = c.createRadialGradient(bx + 140, by + 40, R * 0.6, bx + 60, by, R * 1.05);
      gs.addColorStop(0, 'rgba(90,120,180,0)'); gs.addColorStop(1, 'rgba(70,100,165,0.14)');
      c.fillStyle = gs; c.fillRect(bx - R, by - R, R * 2, R * 2);
      // brilho em cima
      c.translate(bx - 60, by - R * 0.7); c.scale(1.6, 0.6);
      const gh = c.createRadialGradient(0, 0, 0, 0, 0, 120); gh.addColorStop(0, 'rgba(255,255,255,0.45)'); gh.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gh; c.fillRect(-120, -120, 240, 240);
      c.restore();
      c.setTransform(k, 0, 0, k, (W - 1920 * k) / 2, (H - 1080 * k) / 2);
    }
    // fitas da frente
    for (let i = 3; i < FITAS.length; i++) desenharFita(c, FITAS[i], t, sp, mv, forca);
    // faixas brancas (opcional, desligadas por padrão)
    if (O.faixas) {
      const F = Math.max(0, +O.faixasForca || 0), top = +O.topo, base = +O.base, fina = +O.fina, fh = +O.finaAltura;
      c.beginPath(); c.moveTo(-10, top); c.quadraticCurveTo(960, top - 6, 1930, top + 9);
      c.lineTo(1930, base + 8); c.quadraticCurveTo(960, base - 42, -10, base); c.closePath();
      c.fillStyle = 'rgba(255,255,255,' + (0.30 * F).toFixed(3) + ')'; c.fill();
      c.beginPath(); c.moveTo(-10, base); c.quadraticCurveTo(960, base - 42, 1930, base + 8); c.lineTo(1930, fina); c.lineTo(-10, fina); c.closePath();
      c.fillStyle = 'rgba(30,115,205,' + (0.30 * F).toFixed(3) + ')'; c.fill();
      c.fillStyle = 'rgba(236,246,255,' + Math.min(1, 0.6 * F).toFixed(3) + ')'; c.fillRect(-10, fina, 1940, fh);
    }
  }
  function hexA(h, a) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return 'rgba(60,196,230,' + a + ')'; const n = parseInt(m[1], 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }

  function definirFundo(id, animar, aj) {
    const s = src(id);
    const url = s ? urlCss(s) : 'none';
    aj = aj || CFG.fundo;
    const tt = animar === true ? (CFG.tempos.fundo || 0) : (+animar || 0);
    const chave = JSON.stringify(ajusteCompleto(aj));
    if (url === fundoUrl) {
      // mesma imagem com outro ajuste: anima o zoom/posição/desfoque
      if (chave !== fundoAjChave) {
        fundoAjChave = chave;
        fundoFrente.style.transition = tt ? ['transform', 'filter', 'background-position', 'inset'].map((p) => p + ' ' + tt + 'ms ease').join(',') : 'none';
        aplicarAjuste(fundoFrente, aj);
        escurecerPara(aj, tt);
      }
      return;
    }
    fundoUrl = url; fundoAjChave = chave;
    const novo = fundoFrente === fundoA ? fundoB : fundoA, velho = fundoFrente;
    clearTimeout(tFundo);
    novo.style.transition = 'none';
    novo.style.opacity = '0';
    novo.style.backgroundImage = url;
    aplicarAjuste(novo, aj);
    escurecerPara(aj, animar === true ? (CFG.tempos.fundo || 0) : (+animar || 0));
    novo.style.zIndex = '2';
    velho.style.zIndex = '1';
    void novo.offsetWidth;
    const t = animar === true ? (CFG.tempos.fundo || 0) : (+animar || 0);
    novo.style.transition = t ? 'opacity ' + t + 'ms ease' : 'none';
    novo.style.opacity = '1';
    fundoFrente = novo;
    tFundo = setTimeout(() => { velho.style.transition = 'none'; velho.style.opacity = '0'; }, t + 30);
  }

  function aplicarEstilos() {
    const c = CFG.cores, t = CFG.tempos, z = CFG.tamanhos, st = document.documentElement.style;
    const v = (k, val) => st.setProperty(k, val);
    v('--numero-fundo', c.numeroFundo); v('--numero-texto', c.numeroTexto); v('--losango', c.losango);
    v('--pergunta-fundo', hexRgba(c.perguntaFundo, c.perguntaFundoAlfa)); v('--pergunta-texto', c.perguntaTexto);
    v('--respostas-fundo', hexRgba(c.respostasFundo, c.respostasFundoAlfa));
    v('--respostas-borda', hexRgba(c.respostasBorda, c.respostasBordaAlfa));
    v('--resposta-texto', c.respostaTexto); v('--hover1', c.hover1); v('--hover2', c.hover2);
    v('--spinner', c.spinner); v('--spinner-claro', hexRgba(c.spinner, 0.2));
    v('--res-fundo', hexRgba(c.resFundo, c.resFundoAlfa)); v('--res-borda', hexRgba(c.resBorda, c.resBordaAlfa));
    v('--titulo-fundo', c.tituloFundo); v('--titulo-texto', c.tituloTexto);
    v('--nome-cor', c.nome); v('--desc-cor', c.desc);
    v('--botao-fundo', c.botaoFundo); v('--botao-hover', c.botaoHover); v('--botao-texto', c.botaoTexto);
    v('--creditos-cor', c.creditos); v('--copyright-cor', c.copyright);
    v('--fundo-cor', CFG.fundo.cor);
    for (const k in z) v('--tam-' + k, z[k] + 'px');
    v('--t-reacao', t.transicaoReacao + 'ms'); v('--t-resultado', t.entradaResultado + 'ms');
    v('--t-sumir', t.sumir + 'ms'); v('--t-revelacao', t.revelacao + 'ms');
    aplicarIdle();
    carregarFonte(CFG.fonte);
    document.title = CFG.textos.tituloPagina || 'Jogo';
    aplicarFavicon();
    estiloFundo();
    $('final-copyright').textContent = CFG.textos.copyright;
    $('final-copyright').style.display = CFG.resultado.mostrarCopyright ? '' : 'none';
    aplicarMenu();
    montarLista();
  }

  // ícone da aba do navegador
  function aplicarFavicon() {
    const s = src(CFG.favicon);
    let l = document.querySelector('link[rel="icon"]');
    if (!s) { if (l) l.remove(); return; }
    if (!l) { l = document.createElement('link'); l.rel = 'icon'; document.head.appendChild(l); }
    if (l.getAttribute('href') !== s) l.setAttribute('href', s);
  }

  function sincronizarExtras() {
    const lista = CFG.extras || [];
    const ids = new Set(lista.map((x) => x.id));
    extrasEls.forEach((e, id) => { if (!ids.has(id)) { e.remove(); extrasEls.delete(id); } });
    lista.forEach((x) => {
      let e = extrasEls.get(x.id);
      if (!e) {
        e = document.createElement('div');
        e.className = 'el extra';
        e.dataset.el = 'extra:' + x.id;
        e.appendChild(document.createElement('img'));
        palco.appendChild(e);
        extrasEls.set(x.id, e);
      }
      e.style.zIndex = x.z;
      e.className = 'el extra' + (x.animacao && x.animacao !== 'nenhuma' ? ' anim-' + x.animacao : '');
      if (x.tela) {
        aplicarTela(e, x, x.nome || 'Imagem');
        e.style.transform = 'translate(-50%,-50%)';
        e.style.opacity = x.opacidade == null ? 1 : x.opacidade;
      } else {
        tirarTela(e);
        e.style.opacity = '';
        e.style.width = x.largura + 'px';
        e.firstChild.style.opacity = x.opacidade;
        posicionar(e, x, true);
        setImg(e.firstChild, x.imagem, x.nome || 'Imagem', 400, 300);
      }
    });
  }

  // cartão "Eu acho que" (palpite) ou etapa "Continuar"
  function cartaoDe(R, tipo) { return tipo === 'continuar' ? R.continuar : R.resultado; }
  // "Continuar" sem foto própria mantém a foto (e o ajuste) do palpite
  function fotoDe(R, tipo) { const c = cartaoDe(R, tipo); return tipo === 'continuar' && !c.imagem && !c.fotoPropria ? R.resultado.foto : c.foto; }
  // ao mexer na foto do "Continuar" ele passa a ter o ajuste dele (começa igual ao palpite)
  function fotoParaEditar(R, tipo) {
    if (tipo !== 'continuar') return R.resultado.foto;
    const c = R.continuar;
    if (!c.imagem && !c.fotoPropria) { c.foto = JSON.parse(JSON.stringify(R.resultado.foto)); c.fotoPropria = true; }
    return c.foto;
  }
  // personagem e painel podem ser diferentes numa pergunta específica
  function perguntaAtual() { const R = CFG.rodadas[estado.r]; return estado.tipo === 'pergunta' && R ? R.perguntas[estado.p] || null : null; }
  let ignorar = {}; // só no editor: "editando todas as perguntas" mostra o padrão
  // série: um trecho de perguntas da rodada (ex.: 5 a 10) com fundo/efeitos/personagem/painel próprios
  function serieDe(r, p) {
    const R = CFG.rodadas[r];
    if (!R || !Array.isArray(R.series)) return null;
    let s = null;
    R.series.forEach((x) => { if (x && x.ativo !== false && p >= x.de && p <= x.ate) s = x; });
    return s;
  }
  function serieAtual() { return estado.tipo === 'pergunta' ? serieDe(estado.r, estado.p) : null; }
  // ignorar (editor): false = mostra o da pergunta · 'q' = mostra o da série · true = mostra o padrão
  function proprioDe(chave) {
    const q = perguntaAtual(), s = serieAtual(), ig = ignorar[chave];
    if (q && q[chave] && !ig) return q[chave];
    if (s && s[chave] && ig !== true) return s[chave];
    return null;
  }
  function persAtual() {
    if (estado.tipo === 'menu') return (CFG.menu && CFG.menu.personagem) || CFG.personagem;
    return proprioDe('personagem') || CFG.personagem;
  }
  function painelAtual() { return proprioDe('painel') || CFG.painel; }

  function aplicarPosicoes() {
    garantirLoop();
    const p = persAtual();
    elPers.style.width = p.largura + 'px';
    elPers.style.height = p.altura + 'px';
    elPers.style.zIndex = p.z;
    posicionar(elPers, p, true);
    persSombra.classList.toggle('com-sombra', !!p.sombra);
    persSombra.style.opacity = p.opacidade;

    const pn = painelAtual();
    elPainel.style.width = pn.largura + 'px';
    posicionar(elPainel, pn, false);
    if (MODO === 'editor') {
      const q = perguntaAtual();
      elPers.classList.toggle('proprio', !!proprioDe('personagem') || (estado.tipo === 'menu' && !!(CFG.menu && CFG.menu.personagem)));
      elPainel.classList.toggle('proprio', !!proprioDe('painel'));
    }

    if (MODO === 'editor') desenharZona();
    const rs = CFG.resultado;
    elRes.style.width = rs.largura + 'px';
    posicionar(elRes, rs, false);
    topoBox.style.width = rs.topoLargura > 0 ? rs.topoLargura + 'px' : '100%';
    topoBox.style.height = rs.topoAltura > 0 ? rs.topoAltura + 'px' : '';
    fotoBox.style.width = rs.caixaLargura > 0 ? rs.caixaLargura + 'px' : '100%';
    fotoBox.style.height = rs.caixaAltura > 0 ? rs.caixaAltura + 'px' : '';
    if (rs.fotoPreencher) {
      fotoMoldura.style.flex = '1 1 ' + rs.fotoAltura + 'px';
      fotoMoldura.style.width = '100%';
    } else {
      fotoMoldura.style.flex = '0 1 ' + rs.fotoAltura + 'px';
      fotoMoldura.style.width = rs.fotoLargura + 'px';
    }

    const R = CFG.rodadas[estado.r];
    if (R) {
      const f = fotoDe(R, estado.tipo === 'menu' ? 'fim' : estado.tipo);
      fotoImg.style.objectFit = AJUSTES[f.ajuste] || 'cover';
      fotoImg.style.transform = 'translate(-50%,-50%) translate(' + f.offX + 'px,' + f.offY + 'px) rotate(' + (f.rotacao || 0) + 'deg) scale(' + (f.zoom * (f.espelharX ? -1 : 1)) + ',' + f.zoom + ')';
      const rv = R.revelacao;
      elRev.style.width = rv.largura + 'px';
      elRev.style.height = rv.altura + 'px';
      posicionar(elRev, rv, true);
      elRev.classList.toggle('com-sombra', !!rv.sombra && rv.estilo !== 'sombrio');
      if (R.tipo === 'revelacao') posImg2(rv);
    }
    if (CFG.menu) {
      posicionar(menuTitulo, CFG.menu.titulo, false); posicionar(menuBotao, CFG.menu.botao, false);
      if (CFG.menu.listaOp) posicionar(menuOpcoes, CFG.menu.listaOp, false);
      if (CFG.menu.rodape) posicionar(menuRodape, CFG.menu.rodape, false);
      if (CFG.menu.volume) posicionar(menuVol, CFG.menu.volume, false);
      if (CFG.menu.estrelas) posicionar(menuEstrelas, CFG.menu.estrelas, false);
      if (CFG.menu.figura) { menuFigura.style.height = alturaFigura(CFG.menu.figura) + 'px'; posicionar(menuFigura, Object.assign({}, CFG.menu.figura, { escala: CFG.menu.figura.escala || 1 }), true); }
    }
    if (!introAtiva) posicionarLista();
    sincronizarExtras();
    sincronizarItens();
  }

  function vis(e, on) { e.style.display = on ? '' : 'none'; }
  function visExtras(emRevelacao) {
    (CFG.extras || []).forEach((x) => {
      const e = extrasEls.get(x.id);
      if (!e) return;
      const onde = x.onde || (x.noMenu ? 'ambos' : 'jogo');
      if (estado.tipo === 'menu') vis(e, x.visivel !== false && onde !== 'jogo');
      else vis(e, x.visivel !== false && onde !== 'menu' && !(emRevelacao && x.esconderNaRevelacao));
    });
  }
  function numeroDe(r, p) {
    const q = CFG.rodadas[r] && CFG.rodadas[r].perguntas[p];
    if (q && q.numero != null && String(q.numero).trim() !== '') return q.numero; // número personalizado
    let n = 0;
    for (let i = 0; i < r; i++) n += CFG.rodadas[i].perguntas.length;
    return n + p + 1;
  }

  // ---------- animação do adivinhador: parado (idle) e pulinho ao trocar de imagem ----------
  const ANIM_PADRAO = { idle: { ativo: true, flutuar: 10, respirar: 1.5, balancar: 0.6, ciclo: 3.2, noEditor: true }, troca: { tipo: 'pulinho', altura: 22, esticar: 7, agachar: true, flutuar: 6, sempre: false } };
  function animCfg() {
    const a = CFG.animPersonagem || {};
    return { idle: Object.assign({}, ANIM_PADRAO.idle, a.idle), troca: Object.assign({}, ANIM_PADRAO.troca, a.troca) };
  }
  function aplicarIdle() {
    const I = animCfg().idle, ligado = I.ativo && (MODO !== 'editor' || I.noEditor);
    const st = persIdle.style, sp = (+I.respirar || 0) / 100;
    st.setProperty('--idle-y', -(+I.flutuar || 0) + 'px');
    st.setProperty('--idle-sx', String(1 - sp * 0.5)); st.setProperty('--idle-sy', String(1 + sp));
    st.setProperty('--idle-r', (+I.balancar || 0) + 'deg');
    st.setProperty('--idle-ciclo', Math.max(0.3, +I.ciclo || 3.2) + 's');
    const sig = ligado ? [I.flutuar, I.respirar, I.balancar, I.ciclo].join('|') : '';
    if (sig === persIdle._sig) return;
    persIdle._sig = sig;
    persIdle.classList.remove('idle');
    if (ligado) { void persIdle.offsetWidth; persIdle.classList.add('idle'); }
  }
  let trocaAnim = null, trocaTimer = 0, reacaoAtual;
  // pulinho: agacha, estica pra cima (troca a imagem lá no alto), cai com um amassadinho e dá uma flutuada antes de voltar
  function animarPulo(trocar) {
    const T = animCfg().troca, D = Math.max(120, (CFG.tempos && CFG.tempos.transicaoReacao) || 600);
    const h = +T.altura || 0, e = (+T.esticar || 0) / 100, ag = T.agachar ? e * 0.7 : 0, fl = +T.flutuar || 0;
    const k = [{ offset: 0, translate: '0 0', scale: '1 1', easing: 'ease-out' }];
    if (ag) k.push({ offset: 0.14, translate: '0 0', scale: `${1 + ag} ${1 - ag}`, easing: 'ease-out' });
    k.push({ offset: 0.4, translate: `0 ${-h}px`, scale: `${1 - e} ${1 + e}`, easing: 'ease-in' },
      { offset: 0.6, translate: '0 0', scale: `${1 + e * 0.6} ${1 - e * 0.6}`, easing: 'ease-out' },
      { offset: 0.8, translate: `0 ${-fl}px`, scale: '1 1', easing: 'ease-in-out' },
      { offset: 1, translate: '0 0', scale: '1 1' });
    if (trocaAnim) trocaAnim.cancel();
    try { trocaAnim = persTroca.animate(k, { duration: D }); } catch (err) { trocaAnim = null; }
    if (trocar) trocaTimer = setTimeout(trocar, D * 0.4);
  }
  // imagens já baixadas e decodificadas (a troca no alto do pulo não pode aparecer vazia)
  const imgPronta = new Map();
  function prepararImg(id, url) {
    const u = url || src(id);
    if (!u) return Promise.resolve();
    const v = imgPronta.get(u);
    if (v === true) return Promise.resolve();
    if (v) return v;
    const i = new Image();
    const pr = new Promise((ok) => {
      i.onload = () => { (i.decode ? i.decode() : Promise.resolve()).catch(() => {}).then(() => { imgPronta.set(u, true); ok(); }); };
      i.onerror = () => { imgPronta.set(u, true); ok(); };
    });
    imgPronta.set(u, pr); (window.__preImgs || (window.__preImgs = [])).push(i);
    i.src = u;
    return pr;
  }
  // já vai preparando as próximas reações enquanto a pessoa lê a pergunta
  function prepararProximas(r, p) {
    if (MODO === 'editor') return;
    const R = CFG.rodadas[r]; if (!R) return;
    [p + 1, p + 2].forEach((k) => { const q = R.perguntas[k]; if (q) prepararImg(q.reacao); });
    if (R.resultado) { prepararImg(R.resultado.imagem); prepararImg(R.resultado.reacao); }
    const N = CFG.rodadas[r + 1]; if (N) { prepararImg(N.reacaoInicio); if (N.perguntas[0]) prepararImg(N.perguntas[0].reacao); }
  }
  let trocaSeq = 0;
  function trocarReacao(id, animar) {
    clearTimeout(trocaTimer);
    trocaSeq++;
    // compara a imagem de verdade (duas reações com a mesma foto contam como iguais)
    const chave = src(id) || 'id:' + (id || '');
    const mesma = chave === reacaoAtual;
    reacaoAtual = chave;
    const por = () => setImg(akiImg, id, 'Reação', 320, 420);
    akiImg.classList.remove('transicao');
    if (animar === false) { if (trocaAnim) { trocaAnim.cancel(); trocaAnim = null; } por(); return; }
    const T = animCfg().troca;
    if (mesma && !T.sempre) { por(); return; } // mesma imagem da anterior: sem pulo, ele só continua no idle
    if (T.tipo === 'pulinho') {
      if (mesma) { por(); animarPulo(null); return; }
      const u = src(id);
      if (u && imgPronta.get(u) !== true && MODO !== 'editor') {
        // ainda não carregou: espera ficar pronta (no máx. 0,8 s) e só então pula, pra imagem nova já estar lá no alto
        const meu = trocaSeq;
        Promise.race([prepararImg(id), new Promise((ok) => setTimeout(ok, 800))]).then(() => { if (meu === trocaSeq) animarPulo(por); });
        return;
      }
      animarPulo(por); return; // troca lá no alto do pulo
    }
    por();
    if (T.tipo === 'nenhuma') return;
    void akiImg.offsetWidth;
    akiImg.classList.add('transicao');
  }


  function preencherPergunta(r, p) {
    qNum.textContent = numeroDe(r, p);
    qText.textContent = CFG.rodadas[r].perguntas[p].texto;
    montarRespostas(respostasDe(r, p));
    respostas.classList.remove('disabled');
    prepararProximas(r, p);
  }
  // base: no "Continuar", o palpite (texto da barra e créditos vazios = iguais ao palpite)
  function preencherCartao(c, imgPadrao, base) {
    base = base || {};
    const t = CFG.textos, bar = $('txt-acho'), cr = $('final-credits');
    bar.textContent = c.titulo || base.titulo || t.euAchoQue;
    vis(bar, c.mostrarTitulo !== false);
    $('final-name').textContent = c.nome || '';
    $('final-desc').textContent = c.desc || '';
    const creditos = c.creditos || base.creditos || '';
    cr.textContent = creditos;
    vis(cr, !!(CFG.resultado.mostrarCreditos && creditos));
    $('btn-sim').textContent = c.sim || t.sim;
    $('btn-nao').textContent = c.nao || t.nao;
    setImg(fotoImg, c.imagem || imgPadrao, 'Imagem: ' + (c.nome || ''), 420, 420);
  }
  function preencherRevelacao(R) {
    setImg(revImg, R.revelacao.imagem, 'Imagem final aqui', 900, 900);
  }

  function limpar() {
    [elPers, elPainel, elRes, elRev].forEach((e) => e.classList.remove('sumindo', 'aparecendo', 'carregando'));
    extrasEls.forEach((e) => e.classList.remove('sumindo'));
    revImg.classList.remove('revelando');
    akiImg.classList.remove('transicao');
  }

  // ======================================================================
  // MENU INICIAL
  // ======================================================================
  function aplicarMenu() {
    const m = CFG.menu;
    if (!m) return;
    const t = m.titulo, b = m.botao;
    // título: texto ou imagem
    const timg = src(t.imagem);
    vis(mtImg, !!t.imagem); vis(mtTexto, !t.imagem);
    if (t.imagem) { setImg(mtImg, t.imagem, 'Título', 900, 300); mtImg.style.width = (t.imagemLargura || 900) + 'px'; }
    mtTexto.textContent = t.texto || '';
    const ts = mtTexto.style;
    ts.fontFamily = fonteExtra(t.fonte);
    ts.fontSize = t.tamanho + 'px';
    ts.fontWeight = '700';
    ts.color = t.cor;
    ts.letterSpacing = (t.espacamento || 0) + 'px';
    ts.webkitTextStroke = t.contorno > 0 ? t.contorno + 'px ' + t.contornoCor : '';
    ts.paintOrder = 'stroke fill';
    ts.textShadow = t.sombra ? '0 ' + (t.sombraY || 0) + 'px ' + (t.sombraBlur || 0) + 'px ' + t.sombraCor : 'none';
    menuTitulo.className = 'el' + (t.animacao && t.animacao !== 'nenhuma' ? ' anim-' + t.animacao : '');
    ts.textAlign = t.alinhar || 'center';
    void timg;
    aplicarMenuTerror(m);
    aplicarWidgetVolume();
    aplicarEstrelas();
    // botão
    const bs = mb.style;
    bs.fontFamily = fonteExtra(b.fonte);
    bs.fontSize = b.tamanho + 'px';
    bs.fontWeight = b.negrito ? '800' : '400';
    bs.color = b.corTexto;
    const soImg = b.imagem && b.imagemModo === 'so';
    bs.background = soImg ? 'transparent' : b.corFundo;
    bs.backgroundImage = b.imagem && b.imagemModo === 'fundo' && src(b.imagem) ? urlCss(src(b.imagem)) : '';
    bs.backgroundSize = 'cover';
    bs.border = soImg || !(b.bordaLargura > 0) ? 'none' : b.bordaLargura + 'px solid ' + b.bordaCor;
    const raio = { pilula: '999px', retangulo: '0', arredondado: (b.raio || 0) + 'px', circulo: '50%' }[b.formato] || '999px';
    bs.borderRadius = raio;
    bs.padding = b.formato === 'circulo' ? '0' : '.45em 1.4em';
    let w = b.largura > 0 ? b.largura : 0, h = b.altura > 0 ? b.altura : 0;
    if (b.formato === 'circulo') { const d = Math.max(w, h) || b.tamanho * 4; w = d; h = d; }
    bs.width = w ? w + 'px' : ''; bs.height = h ? h + 'px' : '';
    bs.boxShadow = soImg ? 'none' : b.sombra === 'dura' ? '0 ' + Math.round(b.tamanho * 0.18) + 'px 0 ' + b.sombraCor : b.sombra === 'suave' ? '0 10px 26px ' + hexRgba(b.sombraCor, 0.55) : 'none';
    bs.setProperty('--mb-hover', b.hover || 1);
    mbTexto.textContent = b.texto || '';
    vis(mbTexto, !soImg && !!b.texto);
    vis(mbImg, !!b.imagem && (b.imagemModo === 'icone' || soImg));
    if (b.imagem) setImg(mbImg, b.imagem, 'Botão', 300, 300);
    mbImg.style.height = soImg ? (h || b.tamanho * 3) + 'px' : '1.4em';
    mbImg.style.width = soImg && w ? w + 'px' : 'auto';
    mbImg.style.objectFit = 'contain';
    menuBotao.className = 'el' + (b.animacao && b.animacao !== 'nenhuma' ? ' anim-' + b.animacao : '');
    // fundo do menu
    const f = m.fundo;
    menuFundo.style.backgroundColor = f.modo === 'cor' ? f.cor : 'transparent';
    if (f.modo === 'ondas') menuImg.style.backgroundImage = '';
    menuImg.style.backgroundImage = f.modo === 'imagem' && src(f.imagem) ? urlCss(src(f.imagem)) : '';
    aplicarAjuste(menuImg, f.ajuste);
    menuEscuro.style.opacity = f.escurecer || 0;
    document.documentElement.style.setProperty('--t-menu', Math.round((m.transicao || 0.6) * 1000) + 'ms');
  }
  // ======================================================================
  // MENU DE TERROR (estilo FNAF): opções em lista com ">>", rosto no escuro que "falha",
  // estática de TV, linhas, vinheta, luz piscando, aviso inicial e som ambiente
  // ======================================================================
  const OPS_PADRAO = { x: 330, y: 780, fonte: 'VT323', tamanho: 64, cor: '#ffffff', corAtiva: '#ffffff', seta: '>>', espaco: 10, escala: 1, rotacao: 0 };
  const opsDe = (m) => Object.assign({}, OPS_PADRAO, m.listaOp || {});
  let opSel = 0, opSig = '', menuVivo = false, menuRaf = 0, somMenu = null, avisoVisto = false;
  let atmoModo = null, atmoSumir = null, aoSairIntro = null;
  const transJogoCfg = () => Object.assign({ ativo: true, forca: 0.06, linhas: 0.12, volume: 0.08, sumir: 1.6 }, (CFG.menu && CFG.menu.transicaoJogo) || {});
  function iniciarAtmoIntro() {
    const T = transJogoCfg();
    if (!T.ativo || !CFG.menu || CFG.menu.estilo !== 'lista') { pararSomMenu(0.8); return false; }
    atmoModo = 'intro'; atmoSumir = null; menuVivo = true;
    menuAtmo.style.display = 'block'; maVinheta.style.opacity = '0'; maLuz.style.opacity = '0';
    if (!menuRaf) menuRaf = requestAnimationFrame(loopMenu);
    if (somMenu && somMenu.h) somMenu.h.vol(T.volume * (CFG.volumeEfeitos == null ? 1 : CFG.volumeEfeitos));
    return true;
  }
  function sumirAtmoIntro() {
    if (atmoModo !== 'intro' || atmoSumir) return;
    const T = transJogoCfg();
    atmoSumir = { t0: performance.now(), dur: Math.max(0.05, +T.sumir || 0.05) * 1000 };
    pararSomMenu(Math.max(0.05, +T.sumir || 0.05));
  }
  function montarOpcoes(m) {
    const O = opsDe(m), lista = (m.opcoes && m.opcoes.length ? m.opcoes : [{ texto: 'Novo Jogo', acao: 'comecar' }]);
    const sig = JSON.stringify([lista, O.seta, zeradas > 0]);
    if (sig !== opSig) {
      opSig = sig;
      menuOpcoes.innerHTML = '';
      lista.forEach((op, i) => {
        const d = document.createElement('div');
        d.className = 'mop' + (op.acao === 'trancado' || (op.acao === 'continuar' && zeradas <= 0) ? ' trancado' : '');
        const se = document.createElement('span'); se.className = 'mop-seta'; se.textContent = O.seta || '>>';
        const tx = document.createElement('span'); tx.className = 'mop-txt'; tx.textContent = op.texto || '';
        d.append(se, tx);
        d.addEventListener('pointerenter', () => marcarOp(i, true));
        d.addEventListener('click', (e) => { if (MODO === 'editor') return; e.stopPropagation(); acaoOp(i); });
        menuOpcoes.appendChild(d);
      });
      opSel = Math.min(opSel, lista.length - 1);
    }
    const st = menuOpcoes.style;
    st.fontFamily = fonteExtra(O.fonte); st.fontSize = O.tamanho + 'px'; st.color = O.cor; st.gap = (O.espaco || 0) + 'px';
    st.setProperty('--mop-ativa', O.corAtiva || O.cor);
    marcarOp(opSel, false);
  }
  function marcarOp(i, som) {
    const itens = menuOpcoes.children;
    if (!itens.length) return;
    i = (i + itens.length) % itens.length;
    if (som && i !== opSel) somMenuBip();
    opSel = i;
    const O = opsDe(CFG.menu);
    Array.from(itens).forEach((d, k) => { d.classList.toggle('ativo', k === i); d.style.color = k === i ? (O.corAtiva || O.cor) : ''; });
  }
  function acaoOp(i) {
    const m = CFG.menu, op = (m.opcoes || [])[i] || { acao: 'comecar' };
    if (estado.tipo !== 'menu' || ocupado) return;
    if (op.acao === 'comecar') { comecar(); return; }
    if (op.acao === 'continuar' && zeradas > 0) { comecar({ continuar: true }); return; }
    // trancado / nada: estática + tremidinha + som de erro
    rajadaMenu(0.35, 0.6);
    const d = menuOpcoes.children[i]; if (d) { d.classList.remove('erro'); void d.offsetWidth; d.classList.add('erro'); }
    tocarSomMenu('glitch', 0.8, 0.25);
  }
  function aplicarMenuTerror(m) {
    const lista = m.estilo === 'lista';
    vis(menuBotao, !lista); vis(menuOpcoes, lista);
    if (lista) { montarOpcoes(m); posicionar(menuOpcoes, opsDe(m), false); }
    // rodapé
    const r = Object.assign({ ativo: false, texto: '', x: 70, y: 1040, fonte: 'VT323', tamanho: 30, cor: '#9a9a9a' }, m.rodape || {});
    vis(menuRodape, !!(r.ativo && r.texto));
    menuRodape.textContent = r.texto || '';
    Object.assign(menuRodape.style, { fontFamily: fonteExtra(r.fonte), fontSize: r.tamanho + 'px', color: r.cor });
    posicionar(menuRodape, r, false);
    // rosto no escuro
    const F = Object.assign({ ativo: false, imagem: null, alt: null, x: 1400, y: 560, altura: 1000, opacidade: 0.9, brilho: 0.6, contraste: 1.3, pb: 0.5, espelharX: false, altEscala: 1, animacao: 'nenhuma', brilhoForca: 0, brilhoCor: '#ff0000' }, m.figura || {});
    const fig = F.imagem || m.reacao || (CFG.rodadas[0] && CFG.rodadas[0].perguntas[0] && CFG.rodadas[0].perguntas[0].reacao);
    vis(menuFigura, !!(F.ativo && fig));
    if (F.ativo && fig) {
      setImg(mfImg, fig, 'Rosto do menu', 600, 800);
      if (F.alt) setImg(mfAlt, F.alt, 'Rosto (falha)', 600, 800);
      menuFigura.style.height = alturaFigura(F) + 'px';
      menuFigura.style.opacity = F.opacidade;
      menuFigura.className = 'el' + (F.animacao && F.animacao !== 'nenhuma' ? ' anim-' + F.animacao : '');
      mfAlt.style.transform = 'scale(' + (+F.altEscala || 1) + ')';
      menuFigura._filtro = `grayscale(${F.pb}) brightness(${F.brilho}) contrast(${F.contraste})` + (+F.brilhoForca > 0 ? ` drop-shadow(0 0 ${+F.brilhoForca}px ${F.brilhoCor || '#ff0000'})` : '');
      menuFigura.style.filter = menuFigura._filtro;
      posicionar(menuFigura, F, true);
    }
    // estática, linhas, vinheta
    const A = atmoDe(m);
    maLinhas.style.opacity = A.linhas ? A.linhasForca : 0;
    maVinheta.style.opacity = A.vinheta || 0;
  }
  // "igual ao do jogo": o tamanho acompanha o adivinhador do jogo (mudar um muda o outro)
  function alturaFigura(F) { const P = CFG.personagem || {}; return F.tamanhoModo === 'jogo' ? (P.altura || 420) * (P.escala || 1) * (+F.fatorJogo || 1.5) : (+F.altura || 1000); }
  function atmoDe(m) { return Object.assign({ estatica: true, estaticaForca: 0.12, rajadas: true, rajadaForca: 0.5, linhas: true, linhasForca: 0.3, vinheta: 0.75, luz: true, luzForca: 0.3, twitch: 0.5, tremer: 14 }, m.atmosfera || {}); }
  let rajada = null, luzFim = 0, luzProx = 0, twitchFim = 0, twitchProx = 0, rajadaProx = 0, ultQuadroEst = 0;
  function rajadaMenu(forca, dur) { rajada = { t0: performance.now(), forca, dur: dur * 1000 }; }
  function desenharEstatica() {
    const c = maEst.getContext('2d'), w = maEst.width, h = maEst.height, img = c.createImageData(w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    c.putImageData(img, 0, 0);
  }
  function loopMenu(agora) {
    menuRaf = 0;
    if (!menuVivo) return;
    const m = CFG.menu, A = atmoDe(m);
    if (atmoModo === 'intro') {
      // chiado mais leve e transparente enquanto os itens aparecem; some aos poucos quando o jogo começa
      const T = transJogoCfg(), k = atmoSumir ? 1 - (agora - atmoSumir.t0) / atmoSumir.dur : 1;
      if (k <= 0) { atmoModo = null; atmoSumir = null; ligarAtmo(false); return; }
      if (agora - ultQuadroEst > 41) { ultQuadroEst = agora; desenharEstatica(); }
      maEst.style.opacity = (T.forca * k * (0.85 + 0.3 * Math.random())).toFixed(3);
      maLinhas.style.opacity = (T.linhas * k).toFixed(3);
      menuRaf = requestAnimationFrame(loopMenu);
      return;
    }
    // estática (a 24 quadros por segundo)
    if (agora - ultQuadroEst > 41) { ultQuadroEst = agora; if (A.estatica || rajada) desenharEstatica(); }
    let est = A.estatica ? A.estaticaForca : 0;
    if (A.rajadas && agora > rajadaProx) { if (rajadaProx) { rajadaMenu(A.rajadaForca, rnd(0.08, 0.3)); if (Math.random() < 0.6) tocarSomMenu('glitch', 0.5, 0.15); } rajadaProx = agora + rnd(3500, 9000); }
    if (rajada) { const k = 1 - (agora - rajada.t0) / rajada.dur; if (k <= 0) rajada = null; else est = Math.max(est, rajada.forca * (0.6 + 0.4 * Math.random())); }
    maEst.style.opacity = (est * (0.85 + 0.3 * Math.random())).toFixed(3);
    // luz falhando
    if (A.luz && agora > luzProx) { luzFim = agora + rnd(40, 160); luzProx = agora + rnd(400, 2600) / Math.max(0.05, A.luzForca * 2); }
    maLuz.style.opacity = A.luz && agora < luzFim ? (A.luzForca * rnd(0.6, 1.4)).toFixed(3) : '0';
    // rosto "falhando" (twitch)
    const F = m.figura || {};
    if (F.ativo && A.twitch > 0) {
      if (agora > twitchProx) { twitchFim = agora + rnd(70, 260); twitchProx = agora + rnd(1200, 6000) / Math.max(0.05, A.twitch); if (Math.random() < 0.5) rajadaMenu(A.rajadaForca * 0.6, 0.12); }
      const em = agora < twitchFim, tr = A.tremer || 0;
      menuFigura.style.translate = em ? `${rnd(-tr, tr).toFixed(0)}px ${rnd(-tr, tr).toFixed(0)}px` : '';
      vis(mfAlt, em && !!F.alt);
      mfImg.style.visibility = em && F.alt ? 'hidden' : '';
      menuFigura.style.filter = em ? menuFigura._filtro + ' brightness(1.6) hue-rotate(' + rnd(-40, 40).toFixed(0) + 'deg)' : menuFigura._filtro;
    }
    menuRaf = requestAnimationFrame(loopMenu);
  }
  function ligarAtmo(on) {
    if (!on && atmoModo === 'intro' && menuVivo) return; // o chiado leve do começo do jogo cuida de si
    if (on) { atmoModo = 'menu'; atmoSumir = null; }
    menuVivo = !!on;
    menuAtmo.style.display = on ? 'block' : 'none';
    if (on && !menuRaf) menuRaf = requestAnimationFrame(loopMenu);
    if (!on) { maEst.style.opacity = '0'; maLuz.style.opacity = '0'; menuFigura.style.translate = ''; vis(mfAlt, false); mfImg.style.visibility = ''; }
  }
  // ---- sons do menu ----
  function somMenuCfg() { return Object.assign({ tipo: 'estatica', som: null, volume: 0.25, bip: true, volumeBip: 0.35 }, CFG.menu.ambiente || {}); }
  function tocarSomMenu(tipo, vol, dur) {
    if (MODO === 'editor' || !window.MotorSom) return;
    const ac = audio(); if (!ac) return;
    const v = vol * (CFG.volumeEfeitos == null ? 1 : CFG.volumeEfeitos);
    MotorSom.buffer(tipo).then((b) => { if (b) MotorSom.tocar(ac, b, { volume: v, duracao: dur || 0, inicio: dur ? Math.random() * 0.3 : 0, fadeOut: 0.03 }); });
  }
  function somMenuBip() { const S = somMenuCfg(); if (S.bip) tocarSomMenu('menuBip', S.volumeBip); }
  function iniciarSomMenu() {
    if (MODO === 'editor' || somMenu || estado.tipo !== 'menu' || !window.MotorSom) return;
    const S = somMenuCfg(); if (S.tipo === 'mudo') return;
    const ac = audio(); if (!ac) return;
    somMenu = { h: null, morto: false };
    const meu = somMenu;
    const pb = S.tipo === 'proprio' ? MotorSom.decodificar(src(S.som)) : MotorSom.buffer(S.tipo === 'zumbido' ? 'menuZumbido' : 'menuEstatica');
    pb.then((b) => { if (!b || meu.morto) return; meu.h = MotorSom.tocar(ac, b, { volume: S.volume * (CFG.volumeEfeitos == null ? 1 : CFG.volumeEfeitos), loop: true, fadeIn: 1.2 }); });
  }
  function pararSomMenu(fade) { if (somMenu) { somMenu.morto = true; if (somMenu.h) somMenu.h.parar(fade == null ? 0.6 : fade); somMenu = null; } }
  // aviso inicial ("clique para continuar") — também libera o som do navegador
  function estiloAviso(m) {
    const av = Object.assign({ ativo: false, texto: '', dica: '(clique para continuar)', fonte: 'VT323', tamanho: 46, cor: '#ffffff', dicaTamanho: 22, dicaCor: '#ffffff', fundo: '#000000', alinhar: 'center' }, m.aviso || {});
    const tx = $('mav-texto'), di = $('mav-dica'), k = Math.max(0.2, escala || 1);
    tx.textContent = av.texto; di.textContent = av.dica;
    menuAviso.style.fontFamily = fonteExtra(av.fonte);
    menuAviso.style.background = av.fundo;
    Object.assign(tx.style, { fontSize: (+av.tamanho * k) + 'px', color: av.cor, textAlign: av.alinhar });
    Object.assign(di.style, { fontSize: (+av.dicaTamanho * k) + 'px', color: av.dicaCor });
    return av;
  }
  function mostrarAviso(m) {
    const av = estiloAviso(m);
    if (MODO === 'editor') { const ver = av.ativo && (verAviso || selecionado === 'menu-aviso'); menuAviso.style.display = ver ? 'flex' : 'none'; menuAviso.style.opacity = '1'; menuAviso.style.pointerEvents = 'none'; return; }
    if (avisoVisto || !av.ativo) { iniciarSomMenu(); return; }
    menuAviso.style.opacity = '1'; menuAviso.style.display = 'flex';
    const fechar = () => {
      menuAviso.removeEventListener('pointerdown', fechar); removeEventListener('keydown', fecharTecla, true);
      avisoVisto = true; audio(); iniciarSomMenu(); rajadaMenu(0.5, 0.35); tocarSomMenu('glitch', 0.6, 0.3);
      menuAviso.style.opacity = '0'; setTimeout(() => { menuAviso.style.display = 'none'; }, 650);
    };
    const fecharTecla = (e) => { if (/^( |Enter)$/.test(e.key)) { e.preventDefault(); fechar(); } };
    menuAviso.addEventListener('pointerdown', fechar); addEventListener('keydown', fecharTecla, true);
  }
  // teclado no menu: setas/W/S escolhem, Enter/Espaço confirmam
  addEventListener('keydown', (e) => {
    if (MODO === 'editor' || estado.tipo !== 'menu' || !CFG.menu || CFG.menu.estilo !== 'lista' || menuAviso.style.display === 'flex') return;
    if (/^(ArrowUp|w|W)$/.test(e.key)) { marcarOp(opSel - 1, true); e.preventDefault(); }
    else if (/^(ArrowDown|s|S)$/.test(e.key)) { marcarOp(opSel + 1, true); e.preventDefault(); }
    else if (/^(Enter| )$/.test(e.key)) { acaoOp(opSel); e.preventDefault(); }
  });
  // som ambiente começa no 1º clique (o navegador não deixa tocar antes)
  addEventListener('pointerdown', () => { if (estado.tipo === 'menu' && avisoVisto !== null) iniciarSomMenu(); }, true);

  function mostrarMenu() {
    const m = CFG.menu;
    estado = { tipo: 'menu', r: 0, p: 0 };
    pararFinal();
    limpar();
    aplicarPosicoes();
    vis(menuEl, true); menuFundo.style.display = 'block';
    menuEl.classList.remove('menu-saindo'); menuFundo.classList.remove('menu-saindo');
    [elPainel, elRes, elRev].forEach((e) => vis(e, false));
    vis(elPers, !!m.mostrarPersonagem);
    if (m.mostrarPersonagem) trocarReacao(m.reacao || (CFG.rodadas[0] && CFG.rodadas[0].perguntas[0] && CFG.rodadas[0].perguntas[0].reacao), false);
    definirFundo(CFG.fundo.imagem, false, m.fundo.modo === 'jogo' ? ajusteMenu(false) : CFG.fundo); fundoOrig = null;
    atualizarOndas();
    visExtras(false);
    pararIntro(); visLista();
    atualizarEfeitos(true, true);
    ligarAtmo(true);
    aplicarEstrelas();
    mostrarAviso(m);
    marcarSelecao();
  }
  function esconderMenu() { vis(menuEl, false); vis(menuFundo, false); ligarAtmo(false); if (MODO === 'editor') menuAviso.style.display = 'none'; }
  // "Continuar" (depois de zerar): joga de novo já com todos os itens na tela
  let modoContinuar = false;
  function comecar(op) {
    if (MODO === 'editor' || ocupado || estado.tipo !== 'menu') return;
    ocupado = true;
    modoContinuar = !!(op && op.continuar);
    audio();
    const d = Math.round((CFG.menu.transicao || 0.6) * 1000);
    const comChiado = CFG.menu.estilo === 'lista' && transJogoCfg().ativo;
    if (CFG.menu.estilo === 'lista') { rajadaMenu(0.9, d / 1000); tocarSomMenu('menuEntrar', somMenuCfg().volume * 2.4 + 0.2); }
    if (!comChiado) pararSomMenu(d / 1000);
    else if (somMenu && somMenu.h) somMenu.h.vol(transJogoCfg().volume * (CFG.volumeEfeitos == null ? 1 : CFG.volumeEfeitos));
    transicao.style.transition = 'opacity ' + d / 2 + 'ms ease';
    transicao.style.opacity = '1';
    agendarJogo(() => {
      esconderMenu();
      ocupado = false;
      const C = Object.assign({ comecaEm: 'inicio', apresentacao: false }, CFG.menu.continuar || {});
      const rIni = modoContinuar && C.comecaEm === 'final' ? Math.max(0, CFG.rodadas.map((R, i) => (R.tipo === 'revelacao' ? i : -1)).filter((i) => i >= 0).pop() || 0) : 0;
      iniciarJogo(rIni, 0);
      transicao.style.opacity = '0';
      if (comChiado && iniciarAtmoIntro()) aoSairIntro = sumirAtmoIntro;
      if (modoContinuar && !C.apresentacao) { aoSairIntro = null; sumirAtmoIntro(); }
      else mostrarIntro(() => { aoSairIntro = null; sumirAtmoIntro(); });
    }, d / 2 + 30);
  }

  // Mostra um momento do roteiro sem animação (usado no editor e no começo do jogo)
  function mostrarEstatico(est) {
    if (est.tipo === 'menu') { mostrarMenu(); return; }
    if (est.tipo === 'intro') { mostrarEstatico({ tipo: 'pergunta', r: 0, p: 0 }); mostrarIntroEstatica(); marcarSelecao(); return; }
    pararIntro();
    esconderMenu();
    estado = { tipo: est.tipo, r: est.r || 0, p: est.p || 0 };
    pararFinal();
    limpar();
    aplicarPosicoes();
    const R = CFG.rodadas[estado.r];
    let emRev = false;
    if (!R) {
      [elPainel, elRes, elRev].forEach((e) => vis(e, false));
      vis(elPers, true);
    } else if (estado.tipo === 'pergunta' && R.perguntas[estado.p]) {
      vis(elPainel, true); vis(elRes, false); vis(elRev, false); vis(elPers, true);
      preencherPergunta(estado.r, estado.p);
      trocarReacao(R.perguntas[estado.p].reacao, false);
    } else if (R.tipo === 'revelacao') {
      emRev = true;
      vis(elPainel, false); vis(elRes, false);
      preencherRevelacao(R);
      vis(elRev, true);
      if (R.revelacao.estilo === 'sombrio') {
        vis(elPers, false);
        preto.style.transition = 'none'; preto.style.opacity = '1';
        palco.classList.add('final-ativo');
        estiloFalas(R.revelacao);
        const f = (R.revelacao.falas || []).filter((x) => String(x).trim());
        falasEl.textContent = String(f[0] || '');
        falasEl.classList.toggle('esperando', porClique(R.revelacao) && setaLigada(R.revelacao));
        const i2 = img2De(R.revelacao);
        if (MODO === 'editor' && (verImg2 || selecionado === 'revelacao2') && i2) {
          setImg(revImg2, i2.imagem, 'Imagem 2', 900, 900); posImg2(R.revelacao); estiloImg2();
          revImg2.style.opacity = '1'; revImg2.style.filter = ''; vis(elRev2, true); revImg.style.opacity = '0.25';
        } else { vis(elRev2, false); revImg.style.opacity = ''; }
        finEstatico = R.revelacao;
        mostrarAtaqueEstatico(R.revelacao);
      } else vis(elPers, !R.revelacao.esconderPersonagem);
    } else {
      const cont = estado.tipo === 'continuar';
      const c = cartaoDe(R, cont ? 'continuar' : 'fim');
      vis(elPainel, false); vis(elRev, false); vis(elPers, true);
      preencherCartao(c, R.resultado.imagem, c === R.continuar ? R.resultado : null);
      vis(elRes, true);
      trocarReacao((cont && c.reacao) || R.resultado.reacao, false);
    }
    trocarFundo(false);
    visExtras(emRev);
    achados = achadosDoEstado(estado); atualizarAchados(); visLista(); posicionarLista();
    atualizarEfeitos(true, true);
    marcarSelecao();
  }

  // ---------------- JOGO ----------------
  function responder() {
    if (MODO === 'editor' || ocupado || introAtiva || estado.tipo !== 'pergunta') return;
    const R = CFG.rodadas[estado.r];
    if (!R) return;
    audio();
    ocupado = true;
    respostas.classList.add('disabled');
    qText.innerHTML = PONTOS;
    agendarJogo(() => {
      estado.p++;
      if (estado.p < R.perguntas.length) {
        aplicarPosicoes();
        preencherPergunta(estado.r, estado.p);
        trocarReacao(R.perguntas[estado.p].reacao);
        trocarFundo(true);
        atualizarEfeitos(true);
        ocupado = false;
      } else {
        fimDaRodada();
      }
    }, CFG.tempos.pensando);
  }

  function fimDaRodada() {
    const R = CFG.rodadas[estado.r];
    // revelação: o personagem some do jeito que estava na última pergunta
    if (R.tipo === 'revelacao') { revelar(R); return; }
    estado = { tipo: 'fim', r: estado.r, p: 0 };
    aplicarPosicoes();
    trocarFundo(true);
    mostrarResultado(R);
    if (CFG.lista && CFG.lista.achaEm === 'resultado') marcarAchado(estado.r, true);
    atualizarEfeitos(false);
  }

  function mostrarResultado(R) {
    vis(elPainel, false); vis(elRev, false); vis(elPers, true);
    preencherCartao(R.resultado);
    vis(elRes, true);
    elRes.classList.remove('aparecendo');
    void elRes.offsetWidth;
    elRes.classList.add('aparecendo');
    trocarReacao(R.resultado.reacao);
    ocupado = false;
  }

  // clique no "Sim"/"Não" do cartão
  function clicarCartao() {
    if (MODO === 'editor' || ocupado) return;
    const R = CFG.rodadas[estado.r];
    if (!R) return;
    audio();
    if (estado.tipo === 'fim' && R.tipo === 'resultado' && R.continuar && R.continuar.ativo) etapaContinuar(R);
    else if (estado.tipo === 'fim' || estado.tipo === 'continuar') proximaRodada();
  }

  // depois do palpite: carrega no próprio cartão, troca a foto e mostra "Continuar"
  function etapaContinuar(R) {
    ocupado = true;
    const c = R.continuar;
    elRes.classList.remove('aparecendo');
    elRes.classList.add('carregando');
    $('final-name').innerHTML = PONTOS;
    $('final-desc').textContent = ' '; // mantém a altura do cartão durante o carregamento
    if (c.reacao) trocarReacao(c.reacao);
    agendarJogo(() => {
      estado = { tipo: 'continuar', r: estado.r, p: 0 };
      aplicarPosicoes();
      preencherCartao(c, R.resultado.imagem, c === R.continuar ? R.resultado : null);
      elRes.classList.remove('carregando');
      trocarFundo(true);
      if (CFG.lista && CFG.lista.achaEm === 'continuar') marcarAchado(estado.r, true);
      atualizarEfeitos(false);
      ocupado = false;
    }, CFG.tempos.carregarCartao);
  }

  function proximaRodada() {
    const prox = estado.r + 1, R = CFG.rodadas[prox];
    if (!R) return;
    marcarAchado(estado.r, true);
    ocupado = true;
    estado = { tipo: 'pergunta', r: prox, p: 0 };
    aplicarPosicoes();
    visExtras(false);
    vis(elRes, false);
    elRes.classList.remove('aparecendo', 'carregando');
    if (R.perguntas.length) montarRespostas(respostasDe(prox, 0));   // já com as respostas certas (não encolhe)
    vis(elPainel, true);
    respostas.classList.add('disabled');
    qNum.textContent = numeroDe(prox, 0);
    qText.innerHTML = PONTOS;
    trocarReacao(R.reacaoInicio || CFG.reacaoErrou);
    agendarJogo(() => {
      if (R.perguntas.length) {
        preencherPergunta(prox, 0);
        trocarReacao(R.perguntas[0].reacao);
        trocarFundo(true);
        atualizarEfeitos(true);
        ocupado = false;
      } else {
        fimDaRodada();
      }
    }, CFG.tempos.pensando);
  }

  function revelar(R) {
    marcarAchado(estado.r, true);
    if (R.revelacao.estilo === 'sombrio') { revelarSombrio(R); return; }
    sumirLista();
    ocupado = true;
    const rv = R.revelacao;
    elPainel.classList.add('sumindo');
    elRes.classList.add('sumindo');
    if (rv.esconderPersonagem) elPers.classList.add('sumindo');
    (CFG.extras || []).forEach((x) => {
      const e = extrasEls.get(x.id);
      if (e && x.esconderNaRevelacao) e.classList.add('sumindo');
    });
    agendarJogo(() => {
      vis(elPainel, false); vis(elRes, false);
      if (rv.esconderPersonagem) vis(elPers, false);
      estado = { tipo: 'fim', r: estado.r, p: 0 };
      aplicarPosicoes();
      trocarFundo(true);
      preencherRevelacao(R);
      vis(elRev, true);
      revImg.classList.remove('revelando');
      void revImg.offsetWidth;
      revImg.classList.add('revelando');
      atualizarEfeitos(false);
    }, CFG.tempos.sumir);
  }

  function iniciarJogo(r, p) {
    const R = CFG.rodadas[r];
    if (!R) return;
    rodadaFx = null;
    p = Math.max(0, Math.min(p || 0, R.perguntas.length - 1));
    estado = { tipo: 'pergunta', r: r, p: p };
    if (R.perguntas.length) mostrarEstatico(estado);
    else { esconderMenu(); aplicarPosicoes(); visExtras(false); vis(elPainel, false); fimDaRodada(); }
  }

  // ======================================================================
  // SONS (gerados na hora, sem arquivos)
  // ======================================================================
  let actx = null;
  function audio() {
    try {
      if (!actx && MODO === 'editor') { try { if (parent !== window && parent.__actxEditor) actx = parent.__actxEditor; } catch (e) {} if (!actx) return null; }
      if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); if (window.MotorSom) MotorSom.volume(actx, volumeAtual()); }
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
    return actx;
  }
  // ---------- volume geral do jogo (o jogador pode mudar no menu; fica salvo no navegador dele) ----------
  const CHAVE_VOL = 'volume-jogo:' + location.pathname;
  let volJogador = null;
  const guardaVol = MODO !== 'editor' && location.protocol !== 'about:'; // no ▶ Testar do editor não guarda (vale o volume do editor)
  try { const v = guardaVol ? localStorage.getItem(CHAVE_VOL) : null; if (v != null) volJogador = Math.max(0, Math.min(1, +v)); } catch (e) {}
  function volumeAtual() { return volJogador != null ? volJogador : (CFG && CFG.volumeGeral != null ? +CFG.volumeGeral : 0.5); }
  const fatorHtml = () => volumeAtual() * 2; // pros <audio> (arquivos tocados sem o mestre)
  const volCfg = () => Object.assign({ ativo: true, texto: 'VOLUME', x: 330, y: 960, fonte: 'VT323', tamanho: 44, cor: '#ffffff', corBarra: '#ffffff', corVazia: 'rgba(255,255,255,0.18)', barras: 10, escala: 1, rotacao: 0, teclas: true, osd: true, osdCor: '#3cff6a', amostra: true }, (CFG && CFG.menu && CFG.menu.volume) || {});
  let volSig = '';
  function desenharVolume() {
    if (!CFG || !CFG.menu) return;
    const V = volCfg(), n = Math.max(2, Math.min(30, V.barras | 0)), nivel = Math.round(volumeAtual() * n);
    if (volSig !== n + '') {
      volSig = n + ''; mvBarras.innerHTML = ''; osdBarras.innerHTML = '';
      for (let i = 0; i < n; i++) {
        const b = document.createElement('span'); b.className = 'mv-b';
        b.addEventListener('click', (e) => { if (MODO === 'editor') return; e.stopPropagation(); const alvo = (i + 1) / n; mudarVolume(Math.abs(volumeAtual() - alvo) < 0.001 && i === 0 ? 0 : alvo); amostraVolume(); });
        mvBarras.appendChild(b); osdBarras.appendChild(document.createElement('i'));
      }
    }
    Array.from(mvBarras.children).forEach((b, i) => b.classList.toggle('on', i < nivel));
    Array.from(osdBarras.children).forEach((b, i) => b.classList.toggle('on', i < nivel));
  }
  // ⭐ estrelas no menu depois de zerar o jogo (igual FNAF 1)
  const CHAVE_ZEROU = 'zerou-jogo:' + location.pathname;
  let zeradas = 0, estrelaNova = false;
  const estCfg = () => Object.assign({ ativo: true, quantidade: 2, modo: 'fixo', max: 5, simbolo: '★', tamanho: 70, cor: '#ffffff', brilho: 12, espaco: 14, x: 330, y: 470, escala: 1, rotacao: 0, lembrar: true, verNoEditor: true }, (CFG && CFG.menu && CFG.menu.estrelas) || {});
  try { if (MODO !== 'editor' && location.protocol !== 'about:' && estCfg().lembrar) zeradas = +localStorage.getItem(CHAVE_ZEROU) || 0; } catch (e) {}
  function marcarZerou() {
    zeradas++; estrelaNova = true;
    try { if (location.protocol !== 'about:' && estCfg().lembrar) localStorage.setItem(CHAVE_ZEROU, String(zeradas)); } catch (e) {}
  }
  function aplicarEstrelas() {
    const E = estCfg();
    const z = MODO === 'editor' ? (E.verNoEditor ? Math.max(1, zeradas) : 0) : zeradas;
    const n = !E.ativo || z <= 0 ? 0 : E.modo === 'somar' ? Math.min(Math.max(1, E.max | 0), z) : Math.max(1, E.quantidade | 0);
    vis(menuEstrelas, n > 0);
    const sig = n + '|' + E.simbolo;
    if (menuEstrelas._sig !== sig || estrelaNova) {
      menuEstrelas._sig = sig; menuEstrelas.innerHTML = '';
      for (let i = 0; i < n; i++) { const s = document.createElement('span'); s.className = 'estrela' + (estrelaNova ? ' nova' : ''); if (estrelaNova) s.style.animationDelay = (0.25 + i * 0.35) + 's'; s.textContent = E.simbolo || '★'; menuEstrelas.appendChild(s); }
      estrelaNova = false;
    }
    Object.assign(menuEstrelas.style, { fontSize: E.tamanho + 'px' });
    menuEstrelas.style.setProperty('--est-cor', E.cor); menuEstrelas.style.setProperty('--est-gap', E.espaco + 'px'); menuEstrelas.style.setProperty('--est-brilho', (+E.brilho || 0) + 'px');
    posicionar(menuEstrelas, E, false);
  }
  function aplicarWidgetVolume() {
    const V = volCfg();
    vis(menuVol, !!V.ativo);
    mvRot.textContent = V.texto || '';
    Object.assign(menuVol.style, { fontFamily: fonteExtra(V.fonte), fontSize: V.tamanho + 'px', color: V.cor });
    menuVol.style.setProperty('--mv-cor', V.corBarra); menuVol.style.setProperty('--mv-vazia', V.corVazia);
    osdVol.style.setProperty('--osd-cor', V.osdCor);
    posicionar(menuVol, V, false);
    desenharVolume();
  }
  let tOsd = 0;
  function osdVolume() {
    if (MODO === 'editor' || !volCfg().osd) return;
    osdVol.classList.add('on'); clearTimeout(tOsd); tOsd = setTimeout(() => osdVol.classList.remove('on'), 1500);
  }
  // toca um efeito aleatório curtinho pra ouvir se o volume está bom
  let tAmostra = 0;
  function amostraVolume() {
    if (MODO === 'editor' || !volCfg().amostra || !window.MotorSom) return;
    clearTimeout(tAmostra);
    tAmostra = setTimeout(() => {
      const ac = audio(); if (!ac) return;
      const tipos = ['glitch', 'zoom', 'escuridao', 'aparicoes', 'batimento', 'filtro', 'menuEntrar'], t = tipos[Math.floor(Math.random() * tipos.length)];
      MotorSom.buffer(t).then((b) => { if (b) MotorSom.tocar(ac, b, { volume: 0.6, duracao: Math.min(0.7, b.duration), fadeOut: 0.15 }); });
    }, 120);
  }
  menuVol.addEventListener('wheel', (e) => { if (MODO === 'editor') return; e.preventDefault(); const n = Math.max(2, volCfg().barras | 0); mudarVolume(volumeAtual() + (e.deltaY < 0 ? 1 : -1) / n); amostraVolume(); }, { passive: false });
  // teclas: ← → no menu, e - / + em qualquer momento do jogo
  addEventListener('keydown', (e) => {
    if (MODO === 'editor' || !CFG || !CFG.menu) return;
    const V = volCfg(), n = Math.max(2, V.barras | 0);
    const noMenu = estado.tipo === 'menu' && V.ativo && menuAviso.style.display !== 'flex';
    let d = 0;
    if (noMenu && e.key === 'ArrowLeft') d = -1; else if (noMenu && e.key === 'ArrowRight') d = 1;
    else if (V.teclas && (e.key === '-' || e.key === '_')) d = -1; else if (V.teclas && (e.key === '+' || e.key === '=')) d = 1;
    if (!d) return;
    e.preventDefault(); mudarVolume(volumeAtual() + d / n); amostraVolume();
  });
  function mudarVolume(v, mostrar) {
    volJogador = Math.round(Math.max(0, Math.min(1, v)) * 100) / 100;
    try { if (guardaVol) localStorage.setItem(CHAVE_VOL, String(volJogador)); } catch (e) {}
    if (actx && window.MotorSom) MotorSom.volume(actx, volJogador);
    desenharVolume();
    if (mostrar !== false) osdVolume();
  }
  function blip(freq, vol) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = 'square'; o.frequency.value = freq * rnd(0.97, 1.03);
    g.gain.setValueAtTime(0.12 * vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.06);
  }
  function somBatida(vol) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
    o.type = 'sine'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.18);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.3);
  }
  function grito(vol, dur) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const ruido = a.createBufferSource(); ruido.buffer = buf;
    const filtro = a.createBiquadFilter(); filtro.type = 'bandpass'; filtro.Q.value = 2;
    filtro.frequency.setValueAtTime(900, t); filtro.frequency.exponentialRampToValueAtTime(2600, t + dur * 0.4); filtro.frequency.exponentialRampToValueAtTime(500, t + dur);
    const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(90, t + dur);
    const og = a.createGain(); og.gain.value = 0.35;
    const dist = a.createWaveShaper(), c = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 6); }
    dist.curve = c;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.42 * vol, t + 0.03); g.gain.setValueAtTime(0.42 * vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    ruido.connect(filtro); filtro.connect(dist); o.connect(og); og.connect(dist); dist.connect(g); g.connect(a.destination);
    ruido.start(t); o.start(t); ruido.stop(t + dur); o.stop(t + dur);
  }
  if (MODO !== 'editor') addEventListener('pointerdown', () => audio(), { once: true });
  // ninguém arrasta (sem querer) a imagem do adivinhador, dos itens etc. nem seleciona texto da tela
  addEventListener('dragstart', (e) => { if (!(e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable]'))) e.preventDefault(); }, true);
  addEventListener('selectstart', (e) => { if (!(e.target && e.target.closest && e.target.closest('input,textarea,[contenteditable]'))) e.preventDefault(); }, true);

  // ======================================================================
  // EFEITOS (glitch, tremor, escuridão, zoom, filtro, filme antigo, aparições, batimento)
  // ======================================================================
  const EF_PADRAO = {
    glitch: { intensidade: 0.5, frequencia: 0.5, duracao: 0, atraso: 0 },
    tremor: { intensidade: 6, modo: 'constante', duracao: 0, atraso: 0 },
    escuridao: { intensidade: 0.7, tamanho: 0.45, piscar: false, centro: 'tela', duracao: 0, atraso: 0 },
    zoom: { intensidade: 0.08, periodo: 2, duracao: 0, atraso: 0 },
    filtro: { pb: 0, escurecer: 0, contraste: 0, tom: '#8a0000', tomForca: 0.3, inverter: false, duracao: 0, atraso: 0 },
    filme: { intensidade: 0.6, sepia: true, duracao: 0, atraso: 0 },
    aparicoes: { imagem: null, imagens: [], emoji: '', quantidade: 3, opacidade: 0.1, tamanho: 320, ciclo: 6, animacao: 'flutuar', desfoque: 0, duracao: 0, atraso: 0 },
    batimento: { cor: '#8a0000', intensidade: 0.6, bpm: 70, zoom: true, som: false, volume: 0.7, duracao: 0, atraso: 0 },
    nevoa: { intensidade: 0.7, duracao: 0, atraso: 0 },
    imagem: { imagens: [], duracao: 3, atraso: 0, entrada: 1.2, saida: 1.2 }
  };
  const TIPOS_EF = Object.keys(EF_PADRAO);
  let fxPreview = MODO !== 'editor';
  let ativos = [], tCartao = performance.now(), cartaoFx = null, tPergunta = tCartao, tRodada = tPergunta, tMenu = tPergunta, rodadaFx = null, tSerie = tPergunta, serieFx = null, fxOrigem = null;

  function chaveEf(tipo, o) {
    // na "imagem que aparece", mover/aumentar/girar não recomeça a animação
    if (tipo === 'imagem') return tipo + JSON.stringify(Object.assign({}, o, { imagens: (o.imagens || []).map((i) => [i.imagem, i.animEntrada, i.animSaida, i.atraso, i.movimento]) }));
    return tipo + JSON.stringify(o);
  }
  function novoAtivo(tipo, o, t0, R, dono, nivel) { return { tipo, c: Object.assign({}, EF_PADRAO[tipo], o), t0, R, prox: 0, fimRaj: 0, dono: dono || null, nivel: nivel || 'r', chave: chaveEf(tipo, o) }; }
  function efeitosDoEstado() {
    const lista = [];
    if (fin) return lista;
    if (estado.tipo === 'menu') {
      const m = (CFG.menu && CFG.menu.efeitos) || {};
      TIPOS_EF.forEach((t) => { if (m[t] && m[t].ativo) lista.push(novoAtivo(t, m[t], tMenu, null, CFG.menu, 'm')); });
      return lista;
    }
    const R = CFG.rodadas[estado.r];
    if (!R) return lista;
    if (R.tipo === 'revelacao' && estado.tipo === 'fim' && R.revelacao.estilo === 'sombrio') return lista;
    const q = estado.tipo === 'pergunta' ? R.perguntas[estado.p] : null;
    const s = estado.tipo === 'pergunta' ? serieDe(estado.r, estado.p) : null;
    // fim da rodada (palpite "Eu acho que") e "Continuar" podem ter efeitos próprios
    const cart = R.tipo === 'resultado' ? (estado.tipo === 'fim' ? R.resultado : estado.tipo === 'continuar' ? R.continuar : null) : null;
    const er = R.efeitos || {}, eq = (q && q.efeitos) || {}, es = (s && s.efeitos) || {}, ec = (cart && cart.efeitos) || {};
    TIPOS_EF.forEach((t) => {
      if (ec[t] && ec[t].ativo) lista.push(novoAtivo(t, ec[t], tCartao, R, cart, 'c'));
      else if (eq[t] && eq[t].ativo) lista.push(novoAtivo(t, eq[t], tPergunta, R, q, 'q'));
      else if (es[t] && es[t].ativo) lista.push(novoAtivo(t, es[t], tSerie, R, s, 's'));
      else if (er[t] && er[t].ativo && !(cart && cart.semEfeitosRodada)) lista.push(novoAtivo(t, er[t], tRodada, R, R, 'r'));
    });
    return lista;
  }
  // quem manda nos efeitos agora (pra escolher a transição): pergunta > série > rodada
  function donoDosEfeitos(lista, est) {
    for (const nv of ['c', 'q', 's', 'r', 'm']) { const a = lista.find((x) => x.nivel === nv); if (a) return a.dono; }
    return null;
  }
  // instantaneo = sem transição (editor, começo do jogo)
  function atualizarEfeitos(novaPergunta, instantaneo) {
    const agora = performance.now();
    if (estado.tipo === 'menu') { if (novaPergunta) tMenu = agora; }
    else {
      if (novaPergunta) tPergunta = agora;
      if (rodadaFx !== estado.r) { rodadaFx = estado.r; tRodada = agora; }
      const kc = estado.tipo === 'fim' || estado.tipo === 'continuar' ? estado.tipo + estado.r : null;
      if (kc !== cartaoFx) { cartaoFx = kc; tCartao = agora; }
      const s = estado.tipo === 'pergunta' ? serieDe(estado.r, estado.p) : null;
      if (s !== serieFx) { serieFx = s; tSerie = agora; }
    }
    const novos = efeitosDoEstado();
    const dono = donoDosEfeitos(novos);
    // donos de antes: o efeito da pergunta anterior sai com a "saída" dela
    const donoAnt = fxOrigem;
    fxOrigem = dono || (estado.tipo === 'pergunta' ? (perguntaAtual() && perguntaAtual().transicao ? perguntaAtual() : serieAtual()) : null);
    if (instantaneo || MODO === 'editor' && !fxPreview) { ativos = novos; sincronizarItens(); garantirLoop(); return; }
    const T = tempoTroca(donoAnt, fxOrigem, CFG.tempos.efeitos == null ? 600 : CFG.tempos.efeitos) / 1000;
    const res = [];
    const usados = new Set();
    novos.forEach((n) => {
      // mesmo efeito, mesma origem e mesmo ajuste: continua rodando sem recomeçar
      const igual = ativos.find((a) => !a.saindo && !usados.has(a) && a.dono === n.dono && a.chave === n.chave && (n.nivel !== 'q' || !novaPergunta));
      if (igual) { usados.add(igual); if (igual.tipo === 'imagem') igual.c = n.c; res.push(igual); return; }
      n.criado = agora; n.fIn = T;
      if (MODO === 'editor' && n.tipo === 'imagem') { n.t0 = agora; n.criado = null; } // no editor: imagem nova/mudada já anima na hora
      res.push(n);
    });
    ativos.forEach((a) => {
      if (usados.has(a)) return;
      if (a.saindo) { if (agora - a.saindo < a.fOut * 1000) res.push(a); return; }
      if (fator(a, agora) <= 0) return;
      a.saindo = agora; a.fOut = T; res.push(a);
    });
    ativos = res;
    sincronizarItens();
    garantirLoop();
  }
  // 0..1: entra e sai suave, respeitando atraso e duração
  function fator(a, agora) {
    let t = (agora - a.t0) / 1000 - (a.c.atraso || 0);
    if (t < 0) return 0;
    // repete: toca de novo a cada X s (ex.: glitch de 1 s a cada 6 s), podendo cair num momento sorteado dentro de cada intervalo
    if (a.c.repetir > 0 && a.c.duracao > 0) {
      const per = Math.max(a.c.repetir, a.c.duracao + 0.05), k = Math.floor(t / per);
      t -= k * per;
      const al = clamp(+a.c.aleatorio || 0, 0, 1);
      if (al > 0 && k > 0) {
        const folga = Math.max(0, per - a.c.duracao - (a.c.saida == null ? 0.4 : +a.c.saida) - 0.05);
        const h = Math.sin((k + 1) * 12.9898 + (a.t0 % 997) * 78.233) * 43758.5453;
        t -= folga * al * (h - Math.floor(h));
        if (t < 0) return 0;
      }
    }
    const c = a.c, d = c.duracao || 0;
    const fi = c.entrada == null ? 0.4 : +c.entrada, fo = c.saida == null ? 0.4 : +c.saida;
    let f = fi > 0 ? Math.min(1, t / fi) : 1;
    if (d > 0) { if (t >= d + fo) return 0; if (t > d) f = Math.min(f, fo > 0 ? 1 - (t - d) / fo : 0); }
    // variação: constante, pulsando (sobe e desce) ou falhando (liga e desliga do nada)
    const per = Math.max(0.1, c.periodoVar || 1.5);
    if (c.variacao === 'pulsar') f *= 0.5 + 0.5 * (0.5 + 0.5 * Math.sin((t / per) * Math.PI * 2));
    else if (c.variacao === 'falhar') {
      if (!a.trocaVar || agora > a.trocaVar) { a.ligadoVar = Math.random() < 0.65; a.trocaVar = agora + rnd(0.05, per) * 1000; }
      if (!a.ligadoVar) f *= 0.08;
    }
    if (a.criado != null) f = a.fIn > 0 ? Math.min(f, (agora - a.criado) / (a.fIn * 1000)) : f;
    if (a.saindo != null) f = a.fOut > 0 ? Math.min(f, 1 - (agora - a.saindo) / (a.fOut * 1000)) : 0;
    return Math.max(0, f);
  }
  function aindaVai(a, agora) {
    if (a.saindo != null) return agora - a.saindo < (a.fOut || 0) * 1000;
    if (a.criado != null && agora - a.criado < (a.fIn || 0) * 1000) return true;
    const t = (agora - a.t0) / 1000 - (a.c.atraso || 0);
    if (a.c.repetir > 0) return true;
    return !(a.c.duracao > 0 && t >= a.c.duracao + (a.c.saida == null ? 0.4 : +a.c.saida));
  }

  let loopId = 0, ultimo = 0;
  function garantirLoop() { if (!loopId) { ultimo = performance.now(); loopId = requestAnimationFrame(quadro); } }
  function quadro(agora) {
    loopId = 0;
    const dt = Math.min(0.05, Math.max(0, (agora - ultimo) / 1000)); ultimo = agora;
    let continuar = false;
    try { continuar = passo(agora, dt); } catch (e) { console.warn('[efeitos]', e); }
    if (continuar) loopId = requestAnimationFrame(quadro);
  }

  function passo(agora, dt) {
    const S = { tx: 0, ty: 0, sc: 1, pb: 0, sep: 0, esc: 0, con: 0, inv: false, glitch: 0, escuro: 0, escuroTam: 0.45, escuroCentro: 'tela',
      tom: null, tomA: 0, filme: 0, pulso: 0, pulsoCor: '#8a0000', nevoa: 0, flash: 0, flashCor: '#ff0000' };
    let vivo = false;
    const fontes = [];
    if (ativos.some((a) => a.saindo != null && agora - a.saindo >= (a.fOut || 0) * 1000)) ativos = ativos.filter((a) => !(a.saindo != null && agora - a.saindo >= (a.fOut || 0) * 1000));
    if (fxPreview) {
      for (const a of ativos) {
        if (aindaVai(a, agora)) vivo = true;
        const f = fator(a, agora);
        somEfeito(a, f, agora);
        if (a.tipo === 'aparicoes') { fontes.push({ c: a.c, f, pool: poolAparicao(a.c.imagem, a.c, a.R && a.R.resultado && a.R.resultado.imagem) }); continue; }
        if (a.tipo === 'imagem') continue;
        if (f > 0) aplicarEfeito(a, f, agora, S);
      }
    }
    if (passoEfImagens(agora)) vivo = true;
    limparLacos();
    if (passoItens(agora, dt, S, fontes)) vivo = true;
    if (passoAparicoes(fontes, agora)) vivo = true;
    if (passoFinal(agora, S)) vivo = true;
    if (passoSacudida(agora, S)) vivo = true;
    if (finEstatico && fxPreview && finEstatico.filme && finEstatico.filme.ativo) {
      S.filme = Math.max(S.filme, finEstatico.filme.intensidade);
      if (finEstatico.filme.sepia) S.sep = Math.max(S.sep, 0.7);
      vivo = true;
    }
    aplicarSaida(S, agora);
    return vivo;
  }

  // ---------- SONS DOS EFEITOS (padrão, arquivo próprio ou mudo) — o som em si vem do MotorSom ----------
  const QUANDO_SOM = { glitch: 'rajada', tremor: 'inicio', escuridao: 'inicio', zoom: 'inicio', filtro: 'inicio', filme: 'loop', aparicoes: 'inicio', batimento: 'rajada', nevoa: 'loop', imagem: 'inicio' };
  function audioDe(tipo, c) {
    const A = c.audio || (tipo === 'batimento' ? { tipo: c.som ? 'padrao' : 'mudo', volume: c.volume == null ? 0.7 : c.volume } : {});
    let quando = A.quando || QUANDO_SOM[tipo];
    if (quando === 'rajada' && !temRajada(tipo, c)) quando = 'inicio';
    return { tipo: A.tipo || 'padrao', som: A.som || null, volume: A.volume == null ? 0.6 : +A.volume, quando,
      tom: A.tom || 1, variarTom: A.variarTom || 0, inicio: A.inicio || 0, duracao: A.duracao || 0, fadeIn: A.fadeIn || 0, fadeOut: A.fadeOut == null ? 0.05 : +A.fadeOut, intervalo: A.intervalo || 0 };
  }
  function temRajada(tipo, c) { return tipo === 'glitch' || tipo === 'batimento' || tipo === 'zoom' || (tipo === 'tremor' && c.modo === 'rajadas') || (tipo === 'escuridao' && c.piscar); }
  const podeSom = () => fxPreview && MODO !== 'editor';
  const volGeral = () => (CFG.volumeEfeitos == null ? 1 : Math.max(0, +CFG.volumeEfeitos));
  const M = window.MotorSom;
  function bufferDo(tipo, A) { if (!M) return Promise.resolve(null); return A.tipo === 'proprio' ? M.decodificar(src(A.som)) : M.buffer(tipo); }
  // se o navegador não conseguir ler o arquivo como buffer (ex.: jogo aberto direto do PC), toca com <audio>
  function porAudioEl(A, v, loop) {
    const u = src(A.som); if (!u) return null;
    const e = new Audio(u); e.loop = !!loop; e.volume = Math.min(1, v * fatorHtml()); e.playbackRate = Math.max(0.25, Math.min(4, A.tom || 1));
    try { e.currentTime = A.inicio || 0; } catch (err) {}
    const pr = e.play(); if (pr && pr.catch) pr.catch(() => {});
    if (!loop && A.duracao > 0) setTimeout(() => e.pause(), A.duracao * 1000 / (A.tom || 1));
    return { vol(x) { e.volume = Math.max(0, Math.min(1, x * fatorHtml())); }, parar() { e.pause(); } };
  }
  function dispararSom(tipo, A, f, ext, a) {
    const v = A.volume * f * volGeral();
    if (v <= 0.001) return;
    const agora = performance.now();
    if (a && A.intervalo > 0 && a.ultSom && agora - a.ultSom < A.intervalo * 1000) return;
    if (a) a.ultSom = agora;
    const ac = audio(); if (!ac) return;
    const p = Object.assign({}, A, { volume: v });
    if (tipo === 'glitch' && A.tipo !== 'proprio' && ext && !(A.duracao > 0)) { p.duracao = Math.min(0.6, ext + 0.04); p.inicio = Math.random() * Math.max(0, 0.6 - p.duracao); }
    bufferDo(tipo, A).then((buf) => { if (buf) M.tocar(ac, buf, p); else if (A.tipo === 'proprio') porAudioEl(A, v, false); });
  }
  const lacos = new Map();
  let lacosUsados = new Set();
  function somEfeito(a, f, agora) {
    if (!podeSom()) return;
    const A = audioDe(a.tipo, a.c);
    if (A.tipo === 'mudo' || (A.tipo === 'proprio' && !A.som)) return;
    if (A.quando === 'loop') {
      if (f <= 0.001) return;
      lacosUsados.add(a);
      const chave = A.tipo + (A.som || '') + A.tom + A.inicio + A.duracao;
      let L = lacos.get(a);
      if (L && L.chave !== chave) { L.parar(); L = null; lacos.delete(a); }
      if (!L) {
        L = { chave, h: null, morto: false, alvo: 0, vol(x) { this.alvo = x; if (this.h) this.h.vol(x); }, parar() { this.morto = true; if (this.h) this.h.parar(0.25); } };
        lacos.set(a, L);
        const ac = audio();
        if (ac) bufferDo(a.tipo, A).then((buf) => {
          if (L.morto) return;
          L.h = buf ? M.tocar(ac, buf, Object.assign({}, A, { volume: 0, loop: true, fadeIn: 0 })) : A.tipo === 'proprio' ? porAudioEl(A, 0, true) : null;
          if (L.h) L.h.vol(L.alvo);
        });
      }
      L.vol(A.volume * f * volGeral());
      return;
    }
    if (A.quando === 'inicio') {
      const on = f > 0.02;
      if (on && !a.somOn) dispararSom(a.tipo, A, Math.max(f, 0.6), 0, a);
      a.somOn = on;
    }
  }
  function eventoSom(a, f, ext) {
    if (!podeSom()) return;
    const A = audioDe(a.tipo, a.c);
    if (A.tipo === 'mudo' || A.quando !== 'rajada') return;
    dispararSom(a.tipo, A, f, ext, a);
  }
  function limparLacos() {
    lacos.forEach((L, a) => { if (!lacosUsados.has(a)) { L.parar(); lacos.delete(a); } });
    lacosUsados = new Set();
  }

  function aplicarEfeito(a, f, agora, S) {
    const c = a.c, k = escala;
    switch (a.tipo) {
      case 'tremor': {
        let amp = c.intensidade * f;
        if (c.modo === 'rajadas') {
          if (agora > a.fimRaj && agora > a.prox) { a.fimRaj = agora + rnd(220, 520); a.prox = a.fimRaj + rnd(700, 2600); eventoSom(a, f); }
          if (agora > a.fimRaj) amp = 0;
        }
        S.tx += rnd(-1, 1) * amp * k; S.ty += rnd(-1, 1) * amp * k;
        break;
      }
      case 'zoom': {
        const fase = ((agora - a.t0) / 1000 - (c.atraso || 0)) / Math.max(0.1, c.periodo);
        S.sc *= 1 + c.intensidade * f * (0.5 - 0.5 * Math.cos(fase * Math.PI * 2));
        const volta = Math.floor(fase);
        if (volta !== a.ultVolta) { if (a.ultVolta != null) eventoSom(a, f); a.ultVolta = volta; }
        break;
      }
      case 'glitch': {
        if (agora > a.fimRaj && agora > a.prox) {
          a.fimRaj = agora + rnd(90, 160 + 260 * c.intensidade);
          const media = 3200 - 2950 * clamp(c.frequencia, 0, 1);
          a.prox = a.fimRaj + rnd(media * 0.3, media * 1.4);
          eventoSom(a, f, (a.fimRaj - agora) / 1000);
        }
        if (agora <= a.fimRaj) { S.glitch = Math.max(S.glitch, c.intensidade * f); S.tx += rnd(-1, 1) * 22 * c.intensidade * f * k; }
        break;
      }
      case 'escuridao': {
        let v = c.intensidade * f;
        if (c.piscar) {
          if (!a.luz || agora > a.trocaLuz) { a.luz = Math.random() < 0.2 ? rnd(1.15, 1.5) : rnd(0.94, 1.03); a.trocaLuz = agora + rnd(40, 240); if (a.luz > 1.1 && (!a.ultPisca || agora - a.ultPisca > 700)) { a.ultPisca = agora; eventoSom(a, f * 0.6); } }
          v = Math.min(1, v * a.luz);
        }
        if (v > S.escuro) { S.escuro = v; S.escuroTam = c.tamanho; S.escuroCentro = c.centro; }
        break;
      }
      case 'filtro': {
        S.pb = Math.max(S.pb, c.pb * f); S.esc = Math.max(S.esc, c.escurecer * f); S.con = Math.max(S.con, c.contraste * f);
        if (c.inverter && f > 0.5) S.inv = true;
        if (c.tomForca > 0) { S.tom = c.tom; S.tomA = Math.max(S.tomA, c.tomForca * f); }
        break;
      }
      case 'filme': S.filme = Math.max(S.filme, c.intensidade * f); if (c.sepia) S.sep = Math.max(S.sep, 0.65 * f); break;
      case 'nevoa': S.nevoa = Math.max(S.nevoa, c.intensidade * f); break;
      case 'batimento': {
        const per = 60 / Math.max(20, c.bpm), seg = (agora - a.t0) / 1000, t = (seg % per) / per;
        const bat = Math.max(Math.exp(-Math.pow((t - 0.06) / 0.05, 2)), 0.7 * Math.exp(-Math.pow((t - 0.27) / 0.055, 2)));
        if (bat * c.intensidade * f > S.pulso) { S.pulso = bat * c.intensidade * f; S.pulsoCor = c.cor; }
        if (c.zoom) S.sc *= 1 + 0.025 * bat * f;
        const batida = Math.floor(seg / per);
        if (batida !== a.ultBatida && t < 0.1) { a.ultBatida = batida; eventoSom(a, f); }
        break;
      }
    }
  }

  // ---------- saída de tudo na tela ----------
  let ultTransf = '', ultFiltro = '', ultGlitch = 0, ultBarras = 0;
  const ctxFilme = cvFilme.getContext('2d');
  let filmeImg = null, ultFilme = 0, riscos = [];
  function aplicarSaida(S, agora) {
    let transf = '';
    if (S.tx || S.ty || S.sc !== 1) {
      const m = 1 + 2.4 * (Math.abs(S.tx) + Math.abs(S.ty)) / Math.max(200, Math.min(innerWidth, innerHeight));
      transf = 'translate(' + S.tx.toFixed(1) + 'px,' + S.ty.toFixed(1) + 'px) scale(' + (S.sc * m).toFixed(4) + ')';
    }
    if (transf !== ultTransf) { tela.style.transform = transf; ultTransf = transf; }
    const fl = [];
    if (S.pb > 0.002) fl.push('grayscale(' + S.pb.toFixed(3) + ')');
    if (S.sep > 0.002) fl.push('sepia(' + S.sep.toFixed(3) + ')');
    if (S.esc > 0.002) fl.push('brightness(' + (1 - S.esc).toFixed(3) + ')');
    if (S.con > 0.002) fl.push('contrast(' + (1 + S.con).toFixed(3) + ')');
    if (S.inv) fl.push('invert(1)');
    if (S.glitch > 0) {
      if (agora - ultGlitch > 55) {
        ultGlitch = agora;
        glTurb.setAttribute('seed', String(Math.floor(rnd(1, 999))));
        glTurb.setAttribute('baseFrequency', '0.00001 ' + rnd(0.02, 0.16).toFixed(3));
        glDesl.setAttribute('scale', String(Math.round((20 + 140 * S.glitch) * rnd(0.4, 1))));
        const d = rnd(2, 4 + 16 * S.glitch).toFixed(1);
        glOffR.setAttribute('dx', d); glOffC.setAttribute('dx', '-' + d);
      }
      fl.push('url(#fx-glitch)');
    }
    const filtro = fl.join(' ');
    if (filtro !== ultFiltro) { tela.style.filter = filtro; ultFiltro = filtro; }
    // faixas do glitch
    if (S.glitch > 0) {
      if (agora - ultBarras > 70) {
        ultBarras = agora;
        const cores = ['rgba(0,255,255,.35)', 'rgba(255,0,90,.35)', 'rgba(255,255,255,.3)', 'rgba(0,255,90,.25)'];
        let h = '';
        for (let i = 0, n = Math.round(rnd(1, 3 + 5 * S.glitch)); i < n; i++) h += '<div style="top:' + rnd(0, 100).toFixed(1) + '%;height:' + rnd(2, 6 + 40 * S.glitch).toFixed(0) + 'px;background:' + cores[i % 4] + ';transform:translateX(' + rnd(-40, 40).toFixed(0) + 'px)"></div>';
        fxBarras.innerHTML = h;
      }
      fxBarras.style.display = 'block';
    } else if (fxBarras.style.display !== 'none') fxBarras.style.display = 'none';
    // escuridão (luz no meio)
    if (S.escuro > 0.002) {
      let cx = innerWidth / 2, cy = innerHeight / 2;
      if (S.escuroCentro === 'personagem' && elPers.style.display !== 'none') {
        const r = persSombra.getBoundingClientRect();
        if (r.width) { cx = r.left + r.width / 2; cy = r.top + r.height / 2; }
      }
      const diag = Math.hypot(innerWidth, innerHeight), r0 = diag * (0.04 + 0.5 * S.escuroTam), r1 = r0 + diag * 0.32;
      fxEscuro.style.background = 'radial-gradient(circle at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, rgba(0,0,0,' + (S.escuro * 0.12).toFixed(3) + ') 0, rgba(0,0,0,' + (S.escuro * 0.4).toFixed(3) + ') ' + r0.toFixed(0) + 'px, rgba(0,0,0,' + Math.min(1, S.escuro * 1.05).toFixed(3) + ') ' + r1.toFixed(0) + 'px)';
      fxEscuro.style.display = 'block';
    } else if (fxEscuro.style.display !== 'none') fxEscuro.style.display = 'none';
    // tom de cor
    if (S.tomA > 0.002) { fxTom.style.background = S.tom; fxTom.style.opacity = S.tomA.toFixed(3); fxTom.style.display = 'block'; }
    else if (fxTom.style.display !== 'none') fxTom.style.display = 'none';
    // névoa, batimento, flash
    fxNevoa.style.opacity = S.nevoa > 0.002 ? S.nevoa.toFixed(3) : '0';
    if (S.pulso > 0.002) { fxPulso.style.background = 'radial-gradient(ellipse at center, transparent 45%, ' + hexRgba(S.pulsoCor, 0.85) + ' 100%)'; fxPulso.style.opacity = S.pulso.toFixed(3); }
    else fxPulso.style.opacity = '0';
    if (S.flash > 0.002) { fxFlash.style.background = S.flashCor; fxFlash.style.opacity = S.flash.toFixed(3); }
    else fxFlash.style.opacity = '0';
    desenharFilme(S.filme, agora);
  }

  function desenharFilme(v, agora) {
    if (v <= 0.002) { if (cvFilme.style.display !== 'none') cvFilme.style.display = 'none'; return; }
    cvFilme.style.display = 'block';
    if (agora - ultFilme < 42) return;
    ultFilme = agora;
    const W = 320, H = 180;
    if (!filmeImg) filmeImg = ctxFilme.createImageData(W, H);
    const d = filmeImg.data, a = 90 * v;
    for (let i = 0; i < d.length; i += 4) { const g = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = Math.random() * a; }
    ctxFilme.putImageData(filmeImg, 0, 0);
    if (Math.random() < 0.35 * v) riscos.push({ x: Math.random() * W, vida: Math.round(rnd(2, 12)), a: rnd(0.15, 0.55) });
    riscos = riscos.filter((r) => r.vida-- > 0);
    riscos.forEach((r) => { r.x += rnd(-1.5, 1.5); ctxFilme.fillStyle = 'rgba(255,255,235,' + (r.a * v).toFixed(3) + ')'; ctxFilme.fillRect(r.x, 0, 0.7, H); });
    for (let i = 0, n = Math.floor(rnd(0, 7) * v); i < n; i++) {
      ctxFilme.fillStyle = Math.random() < 0.6 ? 'rgba(0,0,0,' + (0.7 * v).toFixed(3) + ')' : 'rgba(255,255,255,' + (0.45 * v).toFixed(3) + ')';
      ctxFilme.beginPath(); ctxFilme.arc(Math.random() * W, Math.random() * H, rnd(0.3, 1.8), 0, 7); ctxFilme.fill();
    }
    const gr = ctxFilme.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, W * 0.62);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,' + (0.8 * v).toFixed(3) + ')');
    ctxFilme.fillStyle = gr; ctxFilme.fillRect(0, 0, W, H);
    if (Math.random() < 0.3) { ctxFilme.fillStyle = 'rgba(255,255,255,' + (rnd(0, 0.07) * v).toFixed(3) + ')'; ctxFilme.fillRect(0, 0, W, H); }
    cvFilme.style.opacity = (1 - Math.random() * 0.15 * v).toFixed(3);
  }

  // ---------- IMAGEM QUE APARECE (efeito): entra com animação, fica, sai com animação ----------
  const efImgEls = new Map(); // chave -> elemento
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeBack = (x) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const easeBounce = (x) => { const n1 = 7.5625, d1 = 2.75; if (x < 1 / d1) return n1 * x * x; if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75; if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375; return n1 * (x -= 2.625 / d1) * x + 0.984375; };
  const hash01 = (n) => { const h = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return h - Math.floor(h); };
  // pose da animação em p (0 = fora, 1 = no lugar)
  function poseEfImg(an, p, seg, seed) {
    const P = { op: 1, tx: 0, ty: 0, sc: 1, sx: 1, rot: 0, blur: 0, clip: '', hue: 0 };
    if (p >= 1) return P;
    if (p <= 0) { P.op = 0; return P; }
    const e = easeOut(p);
    switch (an) {
      case 'nenhuma': P.op = 1; break;
      case 'zoom': P.sc = Math.max(0.001, e); P.op = Math.min(1, p * 2); break;
      case 'zoomOut': P.sc = 1 + (1 - e) * 1.4; P.op = p; break;
      case 'pop': P.sc = Math.max(0.001, easeBack(p)); P.op = Math.min(1, p * 3); break;
      case 'esquerda': P.tx = -(1 - e) * 1300; P.op = Math.min(1, p * 1.6); break;
      case 'direita': P.tx = (1 - e) * 1300; P.op = Math.min(1, p * 1.6); break;
      case 'cima': P.ty = -(1 - e) * 900; P.op = Math.min(1, p * 1.6); break;
      case 'baixo': P.ty = (1 - e) * 900; P.op = Math.min(1, p * 1.6); break;
      case 'quicar': P.ty = -(1 - easeBounce(p)) * 900; P.op = Math.min(1, p * 4); break;
      case 'girar': P.rot = -(1 - e) * 540; P.sc = Math.max(0.001, e); P.op = Math.min(1, p * 2); break;
      case 'esticar': P.sx = 1 + Math.sin(p * Math.PI * 2.5) * (1 - p) * 0.6; P.sc = Math.max(0.001, easeBack(p)); P.op = Math.min(1, p * 3); break;
      case 'desfoque': P.blur = (1 - p) * 28; P.sc = 1 + (1 - p) * 0.12; P.op = p; break;
      case 'cortina': P.clip = 'inset(0 0 ' + ((1 - e) * 100).toFixed(1) + '% 0)'; break;
      case 'piscar': P.op = hash01(Math.floor(seg * 16) + seed) < p * 0.85 + 0.08 ? 1 : 0; break;
      case 'glitch': {
        const k = Math.floor(seg * 22) + seed;
        P.op = hash01(k) < p + 0.15 ? 1 : 0.15;
        P.tx = (hash01(k + 3) - 0.5) * 90 * (1 - p); P.ty = (hash01(k + 7) - 0.5) * 30 * (1 - p);
        P.hue = Math.round(hash01(k + 11) * 360 * (1 - p));
        const a = hash01(k + 5) * 80, b = hash01(k + 9) * (100 - a);
        if (hash01(k + 13) < 0.6 * (1 - p)) P.clip = 'inset(' + a.toFixed(0) + '% 0 ' + b.toFixed(0) + '% 0)';
        break;
      }
      default: P.op = p; // 'fade'
    }
    return P;
  }
  // mexendo enquanto está na tela
  function movEfImg(m, seg, forca, seed, P) {
    const k = forca == null ? 1 : +forca;
    if (m === 'flutuar') P.ty += Math.sin(seg * 2.2 + seed) * 14 * k;
    else if (m === 'tremer') { P.tx += (Math.random() - 0.5) * 9 * k; P.ty += (Math.random() - 0.5) * 9 * k; }
    else if (m === 'pulsar') P.sc *= 1 + 0.06 * k * Math.sin(seg * 4 + seed);
    else if (m === 'balancar') P.rot += Math.sin(seg * 1.8 + seed) * 6 * k;
    else if (m === 'girar') P.rot += seg * 40 * k;
    else if (m === 'piscar') { if (hash01(Math.floor(seg * 9) + seed * 3) < 0.18 * Math.min(2, k)) P.op *= 0.15; }
    else if (m === 'passear') { P.tx += Math.sin(seg * 0.5 + seed) * 60 * k; P.ty += Math.sin(seg * 0.37 + seed * 2) * 30 * k; }
  }
  function passoEfImagens(agora) {
    const vistos = new Set();
    let vivo = false;
    const estatico = MODO === 'editor' && !fxPreview;
    const principal = ativos.find((a) => a.tipo === 'imagem' && a.saindo == null);
    ativos.forEach((a, ia) => {
      if (a.tipo !== 'imagem') return;
      if (!estatico && !fxPreview) return;
      if (estatico && a !== principal) return;
      const lista = Array.isArray(a.c.imagens) ? a.c.imagens : [];
      if (!a.subs) a.subs = [];
      lista.forEach((im, i) => {
        if (!im) return;
        const ch = (a.uid || (a.uid = 'efi' + Math.random().toString(36).slice(2))) + ':' + i;
        let f = 1, seg = (agora - a.t0) / 1000, P;
        if (!estatico) {
          const sub = a.subs[i] || (a.subs[i] = { c: a.c, sai: false, ult: 0, seed: i * 7.3 + 1 });
          sub.c = a.c; sub.t0 = a.t0 + (+im.atraso || 0) * 1000; sub.criado = a.criado; sub.fIn = a.fIn; sub.saindo = a.saindo; sub.fOut = a.fOut;
          f = fator(sub, agora);
          if (aindaVai(sub, agora)) vivo = true;
          if (f >= 0.999) sub.sai = false; else if (f < sub.ult - 1e-4) sub.sai = true; else if (f > sub.ult + 1e-4) sub.sai = false;
          sub.ult = f;
          seg = (agora - sub.t0) / 1000;
          const fantasmaEd = f <= 0 && MODO === 'editor' && a === principal && selecionado === 'efimg:' + i;
          if (f <= 0 && !fantasmaEd) { const e0 = efImgEls.get(ch); if (e0) e0.style.display = 'none'; vistos.add(ch); if (!(seg < 0)) sub.sai = false; return; }
          if (fantasmaEd) { P = poseEfImg('nenhuma', 1, 0, 0); P.op = 0.3; } else {
          P = poseEfImg(sub.sai ? (im.animSaida || 'fade') : (im.animEntrada || 'fade'), f, seg, sub.seed);
          if (im.movimento && im.movimento !== 'nada') { movEfImg(im.movimento, seg, im.forcaMov, sub.seed, P); vivo = true; }
          }
        } else P = poseEfImg('nenhuma', 1, 0, 0);
        let e = efImgEls.get(ch);
        if (!e) {
          e = document.createElement('div');
          e.className = 'el ef-imagem';
          e.appendChild(document.createElement('img'));
          palco.appendChild(e);
          efImgEls.set(ch, e);
        }
        vistos.add(ch);
        e.style.display = '';
        e.style.transition = 'none';
        if (a === principal && MODO === 'editor') e.dataset.el = 'efimg:' + i; else delete e.dataset.el;
        e.style.pointerEvents = MODO === 'editor' && a === principal ? '' : 'none';
        e.style.zIndex = im.z == null ? 25 : im.z;
        if (im.tela) {
          aplicarTela(e, im, 'Imagem do efeito');
          e.style.transform = 'translate(-50%,-50%) translate(' + P.tx.toFixed(1) + 'px,' + P.ty.toFixed(1) + 'px) rotate(' + P.rot.toFixed(2) + 'deg) scale(' + (P.sc * P.sx).toFixed(4) + ',' + P.sc.toFixed(4) + ')';
        } else {
        tirarTela(e);
        e.style.width = (im.largura || 400) + 'px';
        e.style.left = (im.x == null ? 960 : im.x) + 'px';
        e.style.top = (im.y == null ? 540 : im.y) + 'px';
        const s = (im.escala == null ? 1 : im.escala) * P.sc, fx = im.espelharX ? -1 : 1, fy = im.espelharY ? -1 : 1;
        e.style.transform = 'translate(-50%,-50%) translate(' + P.tx.toFixed(1) + 'px,' + P.ty.toFixed(1) + 'px) rotate(' + ((im.rotacao || 0) + P.rot).toFixed(2) + 'deg) scale(' + (s * fx * P.sx).toFixed(4) + ',' + (s * fy).toFixed(4) + ')';
        }
        e.style.opacity = Math.max(0, Math.min(1, (im.opacidade == null ? 1 : +im.opacidade) * P.op)).toFixed(3);
        const fl = [];
        if (P.blur > 0.05) fl.push('blur(' + P.blur.toFixed(1) + 'px)');
        if (P.hue) fl.push('hue-rotate(' + P.hue + 'deg) saturate(2)');
        e.style.filter = fl.join(' ');
        e.style.clipPath = P.clip || '';
        if (!im.tela) setImg(e.firstChild, im.imagem, 'Imagem do efeito', 400, 300);
        if (MODO === 'editor') e.classList.toggle('selecionado', selecionado === 'efimg:' + i && a === principal);
      });
    });
    efImgEls.forEach((e, ch) => { if (!vistos.has(ch)) { e.remove(); efImgEls.delete(ch); } });
    return vivo;
  }

  // ---------- aparições (imagens quase transparentes) ----------
  const fantasmas = [];
  // de onde sorteia cada aparição: imagem principal + até 3 imagens + emoji (sem nada = foto do palpite)
  function poolAparicao(principal, c, padrao) {
    const p = [principal].concat(c.imagens || []).filter(Boolean).map((id) => ({ img: id }));
    if (c.emoji) p.push({ emoji: c.emoji });
    return p.length ? p : [{ img: padrao }];
  }
  function passoAparicoes(fontes, agora) {
    const fonte = fontes.find((x) => x.f > 0) || null;
    const c = fonte ? fonte.c : null;
    const n = fonte ? Math.max(0, Math.round(c.quantidade)) : 0;
    while (fantasmas.length < n) {
      const d = document.createElement('div');
      d.className = 'fantasma';
      const img = document.createElement('img'); img.alt = '';
      const emo = document.createElement('span');
      d.append(img, emo);
      aparLayer.appendChild(d);
      fantasmas.push({ el: d, img, emo, fimCiclo: 0, ini: 0, dur: 1, i: fantasmas.length, op: 0 });
    }
    let vivo = n > 0;
    fantasmas.forEach((g, i) => {
      let op = 0;
      if (i < n) {
        if (agora >= g.fimCiclo) {
          const primeiro = !g.fimCiclo;
          g.dur = c.ciclo * 1000 * rnd(0.8, 1.25);
          g.ini = agora + (primeiro ? i * (c.ciclo * 1000 / n) * 0.8 : rnd(150, c.ciclo * 500));
          g.fimCiclo = g.ini + g.dur;
          g.x = rnd(120, 1800); g.y = rnd(120, 960); g.dx = rnd(-70, 70); g.dy = rnd(-50, 25); g.fase = rnd(0, 6.28);
          g.el.style.width = c.tamanho + 'px';
          g.el.style.scale = (Math.random() < 0.5 ? '-1 1' : '1 1');
          const pool = fonte.pool || [];
          const esc = pool[Math.floor(Math.random() * pool.length)] || {};
          vis(g.img, !esc.emoji); vis(g.emo, !!esc.emoji);
          if (esc.emoji) { g.emo.textContent = esc.emoji; g.emo.style.fontSize = Math.round(c.tamanho * 0.85) + 'px'; }
          else setImg(g.img, esc.img, 'Aparição', 300, 300);
          g.el.style.filter = c.desfoque > 0 ? 'blur(' + c.desfoque + 'px)' : '';
        }
        if (agora >= g.ini) {
          const t = Math.min(1, (agora - g.ini) / g.dur), seg = (agora - g.ini) / 1000;
          const curva = t < 0.35 ? t / 0.35 : t > 0.65 ? (1 - t) / 0.35 : 1;
          let x = g.x, y = g.y, sc = 1, fl = 1;
          const an = c.animacao || 'flutuar';
          if (an === 'flutuar') { x += g.dx * t; y += g.dy * t + Math.sin(seg * 2.2 + g.fase) * 10; }
          else if (an === 'subir') { y -= 160 * t; x += Math.sin(seg * 1.6 + g.fase) * 14; }
          else if (an === 'tremer') { x += rnd(-6, 6); y += rnd(-6, 6); }
          else if (an === 'pulsar') sc = 1 + 0.08 * Math.sin(seg * 4 + g.fase);
          else if (an === 'piscar') { if (!g.trocaP || agora > g.trocaP) { g.on = Math.random() < 0.6; g.trocaP = agora + rnd(40, 260); } fl = g.on ? 1 : 0.15; }
          op = c.opacidade * curva * fonte.f * fl;
          g.el.style.left = x.toFixed(1) + 'px';
          g.el.style.top = y.toFixed(1) + 'px';
          g.el.style.transform = 'translate(-50%,-50%)' + (sc !== 1 ? ' scale(' + sc.toFixed(3) + ')' : '');
        }
      } else op = Math.max(0, g.op - 0.01);
      g.op = op;
      g.el.style.opacity = op.toFixed(3);
      if (op > 0) vivo = true;
    });
    for (let i = fantasmas.length - 1; i >= n; i--) if (fantasmas[i].op <= 0) { fantasmas[i].el.remove(); fantasmas.splice(i, 1); }
    return vivo;
  }

  // ======================================================================
  // LISTA DE ITENS (fica num canto; itens em preto até serem achados)
  // ======================================================================
  const listaEl = $('lista'), listaTit = $('lista-titulo'), listaItens = $('lista-itens');
  const introDesf = $('intro-desfoque');
  function desfocarFundo(px, seg) {
    const tr = seg ? 'backdrop-filter ' + seg + 's ease,-webkit-backdrop-filter ' + seg + 's ease' : 'none';
    introDesf.style.transition = tr;
    introDesf.style.backdropFilter = introDesf.style.webkitBackdropFilter = 'blur(' + Math.max(0, px || 0) + 'px)';
  }
  const introFundo = $('intro-fundo'), introTexto = $('intro-texto'), itTexto = $('it-texto'), itDica = $('it-dica');
  let achados = new Set(), chaveLista = '', introAtiva = false, introEstatica = false;
  const slotEls = new Map();
  function slotsLista() {
    if (!CFG.lista) return [];
    return CFG.rodadas.map((R, i) => ({ R, i })).filter(({ R }) => R.lista && R.lista.ativo !== false && (R.tipo === 'resultado' || R.tipo === 'revelacao'));
  }
  function nomeSlot(R) { return (R.lista && R.lista.nome) || (R.tipo === 'revelacao' ? 'Fantasma' : R.resultado.nome); }
  function ocultoSlot(R) { const o = R.lista.oculto; if (o === 'proprio') return ''; if (o) return o; return R.tipo === 'revelacao' && !R.lista.emoji && !R.lista.imagem ? '👤' : ''; }
  function imgSlot(R) { return R.lista.imagem || (R.tipo === 'revelacao' ? R.revelacao.imagem : R.resultado.imagem); }
  function estiloTexto(el, t) {
    const s = el.style;
    s.fontFamily = fonteExtra(t.fonte);
    s.fontSize = t.tamanho + 'px';
    s.fontWeight = '700';
    s.color = t.cor;
    s.webkitTextStroke = t.contorno > 0 ? t.contorno + 'px ' + t.contornoCor : '';
    s.paintOrder = 'stroke fill';
    s.textShadow = t.sombra ? '0 ' + (t.sombraY || 0) + 'px ' + (t.sombraBlur || 0) + 'px ' + t.sombraCor : 'none';
  }
  function montarLista() {
    const L = CFG.lista;
    if (!L) return;
    const sl = slotsLista();
    const st = listaEl.style;
    st.setProperty('--li-tam', L.tamanho + 'px');
    st.setProperty('--li-pad', (L.fundo ? L.padding : 0) + 'px');
    st.setProperty('--li-raio', L.raio + 'px');
    st.setProperty('--li-fundo', L.fundo ? hexRgba(L.fundoCor, L.fundoAlfa) : 'transparent');
    st.setProperty('--li-sil', L.silhuetaOpacidade);
    st.setProperty('--li-nome-tam', L.nomeTamanho + 'px');
    st.setProperty('--li-nome-cor', L.nomeCor);
    st.setProperty('--li-dur', (L.achar.duracao || 0.9) + 's');
    st.setProperty('--li-brilho', L.achar.cor);
    st.setProperty('--li-onda', L.intro.ondaCor || '#ffffff');
    aplicarDirecao();
    listaTit.textContent = L.titulo || '';
    vis(listaTit, !!L.titulo);
    listaTit.style.fontSize = L.tituloTamanho + 'px';
    listaTit.style.color = L.tituloCor;
    const chave = JSON.stringify([sl.map(({ R, i }) => [i, R.lista, nomeSlot(R), imgSlot(R), ocultoSlot(R)]), L.animacao, L.nomes]);
    if (chave !== chaveLista) {
      chaveLista = chave;
      listaItens.innerHTML = ''; slotEls.clear();
      sl.forEach(({ R, i }, k) => {
        const d = document.createElement('div');
        d.className = 'li-slot' + (L.animacao && L.animacao !== 'nenhuma' ? ' anim-' + L.animacao : '');
        d.style.animationDelay = (k * 0.22).toFixed(2) + 's';
        const ic = document.createElement('div'); ic.className = 'li-icone';
        if (R.lista.emoji && !R.lista.imagem) { const e = document.createElement('span'); e.className = 'li-emoji li-real'; e.textContent = R.lista.emoji; ic.appendChild(e); }
        else { const img = document.createElement('img'); img.alt = ''; img.className = 'li-real'; setImg(img, imgSlot(R), nomeSlot(R), 200, 200); ic.appendChild(img); }
        const oc = ocultoSlot(R);
        if (oc) { const o = document.createElement('span'); o.className = 'li-oculto'; o.textContent = oc; ic.appendChild(o); d.classList.add('tem-oculto'); }
        const raio = document.createElement('div'); raio.className = 'li-raio';
        const nome = document.createElement('div'); nome.className = 'li-nome'; nome.dataset.nome = nomeSlot(R);
        d.append(ic, raio, nome);
        listaItens.appendChild(d);
        slotEls.set(i, d);
      });
    }
    estiloTexto(itTexto, L.intro.texto);
    itTexto.textContent = L.intro.texto.texto || '';
    itDica.textContent = L.intro.dica || '';
    itDica.style.color = L.intro.texto.cor;
    introFundo.style.background = '#000';
    atualizarAchados();
  }
  function atualizarAchados() {
    const L = CFG.lista;
    if (!L) return;
    slotEls.forEach((d, i) => {
      const ok = achados.has(i);
      d.classList.toggle('achado', ok);
      const n = d.querySelector('.li-nome');
      const mostrar = L.nomes === 'sempre' || (L.nomes === 'achado' && ok) || (introAtiva || introEstatica) && L.intro.nomes;
      n.textContent = mostrar ? n.dataset.nome : (L.nomes === 'achado' ? '???' : '');
      vis(n, L.nomes !== 'nunca' || ((introAtiva || introEstatica) && L.intro.nomes));
    });
  }
  function posicionarLista() {
    const L = CFG.lista;
    if (!L) return;
    if (introAtiva || introEstatica) { posicionar(listaEl, L.intro, false); listaEl.dataset.el = 'lista-intro'; }
    else { posicionar(listaEl, L, false); listaEl.dataset.el = 'lista'; }
    posicionar(introTexto, L.intro.texto, false);
  }
  function achadosDoEstado(est) {
    const s = new Set();
    if (!CFG.lista || est.tipo === 'menu') return s;
    if (modoContinuar) CFG.rodadas.forEach((R, i) => { if (R.tipo === 'resultado') s.add(i); });
    const em = CFG.lista.achaEm;
    CFG.rodadas.forEach((R, i) => {
      if (i < est.r) { s.add(i); return; }
      if (i > est.r) return;
      if (R.tipo === 'revelacao') { if (est.tipo === 'fim') s.add(i); return; }
      if (est.tipo === 'fim' && em === 'resultado') s.add(i);
      if (est.tipo === 'continuar' && em !== 'proxima') s.add(i);
    });
    return s;
  }
  function visLista() {
    const L = CFG.lista;
    const R = CFG.rodadas[estado.r];
    const finalEscondido = R && R.tipo === 'revelacao' && estado.tipo === 'fim' && R.revelacao.estilo === 'sombrio' && L && L.esconderNoFinal && !fin;
    vis(listaEl, !!(L && L.ativo && estado.tipo !== 'menu' && !finalEscondido && slotsLista().length));
  }
  function somAchou(vol) {
    const a = audio(); if (!a) return;
    [880, 1318.5].forEach((f, k) => {
      const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + k * 0.09;
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25 * vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.5);
    });
  }
  function marcarAchado(i, animar) {
    const L = CFG.lista;
    if (!L || !L.ativo || achados.has(i)) return;
    achados.add(i);
    atualizarAchados();
    const d = slotEls.get(i);
    if (!d || !animar) return;
    const ani = L.achar.animacao;
    if (ani && ani !== 'nenhuma') {
      const ic = d.querySelector('.li-icone'), raio = d.querySelector('.li-raio');
      ic.className = 'li-icone'; void ic.offsetWidth; ic.classList.add('li-ani-' + ani);
      if (L.achar.raio) { raio.classList.remove('ativo'); void raio.offsetWidth; raio.classList.add('ativo'); }
    }
    if (L.achar.som) somAchou(L.achar.volume);
  }
  // direção e espaço: na apresentação usa os da apresentação, no jogo os da lista
  function aplicarDirecao() {
    const L = CFG.lista;
    if (!L) return;
    const emIntro = introAtiva || introEstatica, I = L.intro;
    listaEl.classList.toggle('vertical', (emIntro ? I.direcao : L.direcao) === 'vertical');
    listaEl.style.setProperty('--li-gap', (emIntro && I.espaco != null ? I.espaco : L.espaco) + 'px');
  }
  // tremida rápida da tela (impacto)
  let sacudida = null;
  function sacudir(forca, dur) {
    if (!(forca > 0)) return;
    sacudida = { t0: performance.now(), dur: dur * 1000, forca: forca };
    garantirLoop();
  }
  function passoSacudida(agora, S) {
    if (!sacudida) return false;
    const k = 1 - (agora - sacudida.t0) / sacudida.dur;
    if (k <= 0) { sacudida = null; return false; }
    S.tx += rnd(-1, 1) * sacudida.forca * k * escala; S.ty += rnd(-1, 1) * sacudida.forca * k * escala;
    return true;
  }
  function somImpacto(vol) {
    const a = audio(); if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(36, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.95 * vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.35);
    const n = Math.floor(a.sampleRate * 0.12), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
    const r = a.createBufferSource(); r.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900;
    const gr = a.createGain(); gr.gain.value = 0.5 * vol;
    r.connect(f); f.connect(gr); gr.connect(a.destination); r.start(t);
  }
  // em que parte da animação de entrada acontece o "impacto"
  const MOMENTO_IMPACTO = { impacto: 0.55, cair: 0.6, pop: 0.45, girar: 0.7, deslizar: 0.7, surgir: 0.9 };
  function entrarSlot(d, I) {
    const ent = I.entrada || 'impacto';
    d.classList.remove('li-espera');
    if (ent === 'nenhuma') return;
    const ic = d.querySelector('.li-icone'), raio = d.querySelector('.li-raio');
    const dur = Math.max(0.05, I.entradaDuracao || 0.5);
    ic.classList.add('li-ent-' + ent);
    setTimeout(() => {
      if (I.tremor > 0) sacudir(I.tremor, 0.28);
      if (I.som) somImpacto(I.volume == null ? 0.7 : I.volume);
      if (I.onda) { raio.classList.remove('ativo', 'onda'); void raio.offsetWidth; raio.classList.add('onda'); }
    }, dur * 1000 * (MOMENTO_IMPACTO[ent] || 0.5));
    setTimeout(() => { ic.classList.remove('li-ent-' + ent); raio.classList.remove('onda'); }, dur * 1000 + 80);
  }
  function pararIntro() {
    introEstatica = false;
    vis(introFundo, false); vis(introTexto, false); vis(introDesf, false);
    listaEl.classList.remove('na-intro');
    palco.classList.remove('intro-bloqueio');
    aplicarDirecao();
  }
  function mostrarIntroEstatica() {
    const L = CFG.lista;
    if (!L) return;
    introEstatica = true;
    introFundo.style.transition = 'none'; introFundo.style.opacity = L.intro.escurecer;
    vis(introFundo, true); vis(introTexto, true);
    desfocarFundo(L.intro.desfoque, 0); vis(introDesf, (L.intro.desfoque || 0) > 0);
    vis(itDica, !!(L.intro.esperarClique && L.intro.dica));
    listaEl.classList.add('na-intro');
    aplicarDirecao();
    vis(listaEl, true);
    posicionarLista();
    atualizarAchados();
  }
  // apresentação depois do "Começar":
  // escurece → texto → itens entram um por um (impacto) → tela clareia → itens voam pro lugar → jogo começa
  function mostrarIntro(fim) {
    const L = CFG.lista, I = L && L.intro;
    if (!L || !L.ativo || !I.ativo || !slotsLista().length) { fim(); return; }
    ocupado = true; introAtiva = true;
    palco.classList.add('intro-bloqueio');
    achados = new Set(); atualizarAchados();
    listaEl.classList.add('na-intro');
    aplicarDirecao();
    listaEl.style.transition = 'none';
    listaEl.style.opacity = '1';
    posicionarLista();
    const slots = Array.from(listaItens.children);
    const ent = I.entrada || 'impacto';
    listaEl.style.setProperty('--li-ent', Math.max(0.05, I.entradaDuracao || 0.5) + 's');
    slots.forEach((d) => d.classList.add('li-espera'));
    vis(listaEl, true);
    [introFundo, introTexto].forEach((e) => { e.style.transition = 'none'; e.style.opacity = '0'; vis(e, true); });
    vis(itDica, false);
    void listaEl.offsetWidth;
    introFundo.style.transition = 'opacity .6s ease'; introFundo.style.opacity = I.escurecer;
    vis(introDesf, (I.desfoque || 0) > 0); desfocarFundo(0, 0); void introDesf.offsetWidth; desfocarFundo(I.desfoque, 0.6);
    introTexto.style.transition = 'opacity .6s ease'; introTexto.style.opacity = '1';
    const ini = 750, intv = ent === 'nenhuma' ? 0 : Math.max(0, I.entradaIntervalo == null ? 0.45 : I.entradaIntervalo) * 1000;
    const durEnt = ent === 'nenhuma' ? 0 : Math.max(0.05, I.entradaDuracao || 0.5) * 1000;
    slots.forEach((d, k) => agendarJogo(() => entrarSlot(d, I), ini + k * intv));
    const todos = ini + Math.max(0, slots.length - 1) * intv + durEnt;
    let saiu = false;
    const epIntro = epoca;
    const sair = () => {
      if (saiu || epIntro !== epoca) return;
      saiu = true;
      if (typeof aoSairIntro === 'function') { const f = aoSairIntro; aoSairIntro = null; f(); }
      vis(itDica, false);
      // a tela clareia e volta ao foco: junto com os itens indo pro lugar (ou antes deles irem)
      const cl = Math.max(0, I.clarear == null ? 0.9 : I.clarear);
      introFundo.style.transition = 'opacity ' + cl + 's ease'; introFundo.style.opacity = '0';
      desfocarFundo(0, cl);
      introTexto.style.transition = 'opacity ' + Math.min(cl, 0.4) + 's ease'; introTexto.style.opacity = '0';
      if ((I.clarearQuando || 'junto') === 'junto') voar(cl); else agendarJogo(() => voar(0), cl * 1000);
    };
    // 2) cada item voa do lugar da apresentação pro lugar da lista (FLIP)
    const voar = (aindaClareando) => {
      const antes = slots.map((d) => d.getBoundingClientRect());
      introAtiva = false;
      listaEl.style.transition = 'none';
      listaEl.style.background = 'transparent';
      listaTit.style.opacity = '0';
      listaEl.classList.remove('na-intro');
      aplicarDirecao();
      posicionarLista();
      atualizarAchados();
      const depois = slots.map((d) => d.getBoundingClientRect());
      const sF = (L.escala || 1) * escala;
      slots.forEach((d, k) => {
        const a = antes[k], b = depois[k];
        if (!b.width) return;
        const dx = (a.left + a.width / 2 - (b.left + b.width / 2)) / sF, dy = (a.top + a.height / 2 - (b.top + b.height / 2)) / sF;
        d.style.transition = 'none';
        d.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + (a.width / b.width).toFixed(3) + ')';
      });
      void listaEl.offsetWidth;
      const tm = Math.max(0.1, I.voo || 0.9), passo = Math.min(0.08, tm / 8);
      listaEl.style.transition = 'background ' + tm + 's ease';
      listaEl.style.background = '';
      listaTit.style.transition = 'opacity ' + tm + 's ease'; listaTit.style.opacity = '';
      slots.forEach((d, k) => {
        d.style.transition = 'transform ' + tm + 's cubic-bezier(.6,0,.3,1) ' + (k * passo).toFixed(2) + 's';
        d.style.transform = '';
      });
      agendarJogo(() => {
        slots.forEach((d) => { d.style.transition = ''; d.style.transform = ''; });
        listaEl.style.transition = ''; listaTit.style.transition = '';
        palco.classList.remove('intro-bloqueio');
        ocupado = false; fim();
      }, (tm + slots.length * passo) * 1000 + 60);
      // esconde o escuro/desfoque só quando terminar de clarear
      setTimeout(() => { vis(introFundo, false); vis(introTexto, false); vis(introDesf, false); }, Math.max(tm + slots.length * passo, aindaClareando || 0) * 1000 + 80);
    };
    agendarJogo(() => {
      if (I.esperarClique) {
        vis(itDica, !!I.dica);
        const f = (e) => { if (e && e.target && e.target.closest && e.target.closest('#dbg')) return; removeEventListener('pointerdown', f, true); sair(); };
        addEventListener('pointerdown', f, true);
      } else agendarJogo(sair, Math.max(0, I.parado == null ? 1.2 : I.parado) * 1000);
    }, todos);
  }

  // ======================================================================
  // ITENS ACHADOS (continuam na tela depois do palpite)
  // ======================================================================
  const itensVivos = new Map();
  const ctxS = cvSujeira.getContext('2d'), ctxG = cvGotas.getContext('2d');
  let manchas = [], gotas = [], redesenharSujeira = false;
  function itemCfg(R) { return R && R.tipo === 'resultado' && R.item && R.item.comportamento && R.item.comportamento !== 'nenhum' ? R.item : null; }
  function itemPresente(i) {
    if (estado.tipo === 'menu') return false;
    if (modoContinuar && CFG.rodadas[i] && CFG.rodadas[i].tipo === 'resultado') return !!itemCfg(CFG.rodadas[i]);
    const it = itemCfg(CFG.rodadas[i]);
    if (!it) return false;
    if (i < estado.r) return true;
    if (i > estado.r) return false;
    if (estado.tipo === 'fim') return it.desde === 'resultado';
    if (estado.tipo === 'continuar') return it.desde !== 'proxima';
    return false;
  }
  function centroNoPalco(el) {
    const r = el.getBoundingClientRect(), pr = palco.getBoundingClientRect();
    if (!r.width || !pr.width) return null;
    const k = pr.width / 1920;
    return { x: (r.left + r.width / 2 - pr.left) / k, y: (r.top + r.height / 2 - pr.top) / k };
  }
  function sincronizarItens() {
    if (!CFG || !CFG.rodadas) return;
    const presentes = new Set();
    CFG.rodadas.forEach((R, i) => { if (itemPresente(i)) presentes.add(i); });
    itensVivos.forEach((v, i) => { if (!presentes.has(i)) { v.el.remove(); itensVivos.delete(i); } });
    let frente = null;
    presentes.forEach((i) => {
      const R = CFG.rodadas[i], c = R.item;
      let v = itensVivos.get(i);
      if (!v) {
        const el = document.createElement('div');
        el.className = 'item'; el.dataset.el = 'item:' + i;
        const img = document.createElement('img'); img.alt = '';
        const emo = document.createElement('span'); emo.className = 'item-emoji';
        el.append(img, emo); itensLayer.appendChild(el);
        v = { el, img, emo, x: c.x, y: c.y, vx: 0, vy: 0, ang: Math.random() * 6.283, nasceu: performance.now(), proxMancha: 0, proxGota: 0, saindoZona: true };
        // onde nasce: parado = no lugar dele; andando = longe do meio (ou na posição inicial, ou saindo da foto do cartão)
        const anda = c.comportamento === 'andar' || c.comportamento === 'andarSujar';
        const nascer = c.nascer || 'longe';
        v.daFoto = !!(anda && nascer === 'foto' && MODO !== 'editor' && estado.r === i);
        if (anda && nascer === 'longe' && (MODO !== 'editor' || fxPreview)) { const q = pontoLonge(c); v.x = q.x; v.y = q.y; }
        itensVivos.set(i, v);
      }
      v.R = R; v.c = c;
      v.el.style.width = c.largura + 'px';
      const usaEmoji = !!(c.emoji && !c.imagem);
      vis(v.img, !usaEmoji); vis(v.emo, usaEmoji);
      if (usaEmoji) { v.emo.textContent = c.emoji; v.emo.style.fontSize = Math.round(c.largura * 0.86) + 'px'; v.emo.style.opacity = c.opacidade; }
      else { v.img.style.opacity = c.opacidade; setImg(v.img, c.imagem || R.resultado.imagem, R.resultado.nome || 'Item', 300, 300); }
      vis(v.el, c.comportamento !== 'aparicoes');
      if (c.comportamento === 'fixo' || !fxPreview) { v.x = c.x; v.y = c.y; }
      if (c.comportamento === 'andarSujar' && frente === null) frente = !!c.sujeira.frente;
      desenharItem(v, performance.now());
    });
    // camadas: itens parados (túmulo) por baixo · sujeira do veneno · itens que andam (faca, veneno) por cima
    const anda = (c) => c.comportamento === 'andar' || c.comportamento === 'andarSujar';
    let zParados = 0;
    itensVivos.forEach((v) => { if (v.c.comportamento === 'fixo') zParados = Math.max(zParados, +v.c.z || 0); });
    const zSuj = frente === false ? Math.max(12, zParados + 1) : 45;
    cvSujeira.style.zIndex = String(zSuj);
    cvGotas.style.zIndex = String(zSuj + 1);
    itensVivos.forEach((v) => {
      let z = +v.c.z || 0;
      if (anda(v.c) && v.c.porCima !== false) z = Math.max(z, zParados + 1, frente === false ? zSuj + 2 : 0);
      v.el.style.zIndex = String(z);
    });
    // sem veneno na tela (ou sem prévia no editor): limpa a sujeira
    const temSujeira = [...itensVivos.values()].some((v) => v.c.comportamento === 'andarSujar');
    if (!temSujeira || !fxPreview) { if (manchas.length || gotas.length) { manchas = []; gotas = []; ctxS.clearRect(0, 0, 1920, 1080); ctxG.clearRect(0, 0, 1920, 1080); } }
    if (MODO === 'editor') marcarSelecao();
  }
  // um lugar longe do meio da tela, fora da borda do adivinhador
  function pontoLonge(c) {
    const meio = (c.largura * (c.escala || 1)) / 2, A = c.area || { x1: 0, x2: 1920, y1: 0, y2: 1080 };
    const xmin = Math.min(A.x1 + meio, 960), xmax = Math.max(A.x2 - meio, 960), ymin = Math.min(A.y1 + meio, 540), ymax = Math.max(A.y2 - meio, 540);
    const Z = zonaDe(c), r = meio * 0.6;
    const fora = (p) => !Z || p.x < Z.x1 - r || p.x > Z.x2 + r || p.y < Z.y1 - r || p.y > Z.y2 + r;
    const cands = [];
    for (let t = 0; t < 40; t++) { const p = { x: rnd(xmin, xmax), y: rnd(ymin, ymax) }; if (fora(p)) { p.d = Math.hypot((p.x - 960) / 1.6, p.y - 540); cands.push(p); } }
    if (!cands.length) return { x: c.x, y: c.y };
    cands.sort((a, b) => b.d - a.d);
    return cands[Math.floor(Math.random() * Math.max(1, Math.ceil(cands.length * 0.3)))];
  }
  // animação de surgir: pop / suave / girando / nenhuma
  function fatorSurgir(c, t) {
    const tipo = c.surgir || 'pop', d = Math.max(0.05, c.surgirDuracao || 0.6);
    const k = clamp(t / d, 0, 1);
    if (tipo === 'nenhuma' || k >= 1) return { s: 1, o: 1, r: 0 };
    if (tipo === 'suave') return { s: 0.85 + 0.15 * (1 - Math.pow(1 - k, 3)), o: k, r: 0 };
    if (tipo === 'girar') { const e = 1 - Math.pow(1 - k, 3); return { s: e, o: Math.min(1, k * 3), r: (1 - e) * -360 }; }
    const c1 = 1.9, c3 = c1 + 1, e = 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);   // easeOutBack (quica)
    return { s: Math.max(0, e), o: Math.min(1, k * 4), r: 0 };
  }
  function desenharItem(v, agora) {
    const c = v.c;
    const sg = MODO === 'editor' && !fxPreview ? { s: 1, o: 1, r: 0 } : fatorSurgir(c, (agora - v.nasceu) / 1000);
    const s = (c.escala || 1) * sg.s;
    v.el.style.opacity = sg.o < 1 ? sg.o.toFixed(3) : '';
    let rot = (c.rotacao || 0) + sg.r;
    if (c.balancar && fxPreview && c.comportamento !== 'fixo') rot += Math.sin(agora / 170 + v.ang) * 10;
    const fx = (c.virar && v.vx < -3 ? -1 : 1) * (c.espelharX ? -1 : 1);
    v.el.style.left = v.x.toFixed(1) + 'px';
    v.el.style.top = v.y.toFixed(1) + 'px';
    v.el.style.transform = 'translate(-50%,-50%) rotate(' + rot.toFixed(1) + 'deg) scale(' + (s * fx).toFixed(3) + ',' + s.toFixed(3) + ')';
  }
  function retPersonagem() {
    const p = persAtual(), s = Math.abs(p.escala == null ? 1 : p.escala);
    const w = p.largura * s, h = p.altura * s;
    return { x1: p.x - w / 2, x2: p.x + w / 2, y1: p.y - h / 2, y2: p.y + h / 2 };
  }
  // o segmento (x1,y1)-(x2,y2) passa por dentro do retângulo? (Liang–Barsky)
  function cruza(x1, y1, x2, y2, E) {
    let t0 = 0, t1 = 1;
    const dx = x2 - x1, dy = y2 - y1;
    const p = [-dx, dx, -dy, dy], q = [x1 - E.x1, E.x2 - x1, y1 - E.y1, E.y2 - y1];
    for (let i = 0; i < 4; i++) {
      if (p[i] === 0) { if (q[i] <= 0) return false; continue; }
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; } else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
    return t1 - t0 > 1e-4;
  }
  // borda proibida: em volta do adivinhador (com margem) ou um retângulo livre
  function zonaDe(c) {
    const z = c.zona || {}, modo = z.modo || 'adivinhador';
    if (modo === 'nenhuma') return null;
    if (modo === 'livre') return { x1: z.x - z.w / 2, x2: z.x + z.w / 2, y1: z.y - z.h / 2, y2: z.y + z.h / 2 };
    const P = retPersonagem(), d = z.margem != null ? +z.margem : 40;
    const lado = (k) => (z.porLado && z[k] != null ? +z[k] : d);
    return { x1: P.x1 - lado('esq'), x2: P.x2 + lado('dir'), y1: P.y1 - lado('cima'), y2: P.y2 + lado('baixo') };
  }
  // anda pela tela toda; bate nas paredes e na borda do adivinhador e volta pro lado contrário
  function mover(v, dt) {
    const c = v.c, vel = c.velocidade, meio = (c.largura * (c.escala || 1)) / 2, r = meio * 0.6;
    const A = c.area || { x1: 0, x2: 1920, y1: 0, y2: 1080 };
    const xmin = Math.min(A.x1 + meio, 960), xmax = Math.max(A.x2 - meio, 960), ymin = Math.min(A.y1 + meio, 540), ymax = Math.max(A.y2 - meio, 540);
    const Z = zonaDe(c);
    const E = Z && { x1: Z.x1 - r, x2: Z.x2 + r, y1: Z.y1 - r, y2: Z.y2 + r };
    const dentro = (x, y) => E && x > E.x1 && x < E.x2 && y > E.y1 && y < E.y2;
    if (v.saindoZona && !dentro(v.x, v.y)) v.saindoZona = false;
    if (v.saindoZona) {
      // nasceu (ou ficou) dentro da borda: sai andando pelo lado mais perto, sem teletransportar
      const dl = v.x - E.x1, dr = E.x2 - v.x, du = v.y - E.y1, dd = E.y2 - v.y, m = Math.min(dl, dr, du, dd);
      v.ang = m === dl ? Math.PI : m === dr ? 0 : m === du ? -Math.PI / 2 : Math.PI / 2;
    } else {
      // vai passeando: escolhe destinos espalhados pela tela toda (fora da borda) e vai até eles
      const agora = performance.now();
      // anda pela tela: guarda por onde passou; se ficou 2,5 s no mesmo pedaço ou bateu muito, troca de destino
      if (!v.hist) v.hist = [];
      if (!v.tHist || agora - v.tHist > 500) { v.hist.push({ x: v.x, y: v.y }); if (v.hist.length > 14) v.hist.shift(); v.tHist = agora; }
      const h5 = v.hist.length >= 6 ? v.hist[v.hist.length - 6] : null;
      const preso = h5 && Math.hypot(v.x - h5.x, v.y - h5.y) < 140;
      v.batidas = (v.batidas || []).filter((t) => agora - t < 1800);
      const outros = [...itensVivos.values()].filter((o) => o !== v && (o.c.comportamento === 'andar' || o.c.comportamento === 'andarSujar'));
      if (!v.alvo || Math.hypot(v.alvo.x - v.x, v.alvo.y - v.y) < 90 || agora > v.alvo.ate || dentro(v.alvo.x, v.alvo.y) || preso || v.batidas.length >= 3) {
        let melhor = null;
        for (let t = 0; t < 18; t++) {
          const p = { x: rnd(xmin, xmax), y: rnd(ymin, ymax) };
          if (dentro(p.x, p.y)) continue;
          // longe de onde está, de onde já passou e dos outros itens (e dos destinos deles)
          let perto = Infinity;
          outros.forEach((o) => { perto = Math.min(perto, Math.hypot(p.x - o.x, p.y - o.y), o.alvo ? Math.hypot(p.x - o.alvo.x, p.y - o.alvo.y) : Infinity); });
          v.hist.forEach((q) => { perto = Math.min(perto, Math.hypot(p.x - q.x, p.y - q.y) * 1.3); });
          p.d = Math.min(Math.hypot(p.x - v.x, p.y - v.y), perto === Infinity ? 1e9 : perto * 1.5);
          if (!melhor || p.d > melhor.d) melhor = p;
        }
        v.alvo = melhor ? { x: melhor.x, y: melhor.y, ate: agora + rnd(4500, 8000) } : { x: v.x, y: v.y, ate: agora + 1000 };
        v.batidas = [];
        if (preso) v.hist = v.hist.slice(-2);
      }
      // se a borda está no caminho, contorna: menor caminho passando pelos cantos (sem ficar indo e voltando)
      let mira = v.alvo;
      if (E && cruza(v.x, v.y, v.alvo.x, v.alvo.y, E)) {
        const pd = 30;
        const nos = [{ x: v.x, y: v.y }, { x: v.alvo.x, y: v.alvo.y }].concat([[E.x1 - pd, E.y1 - pd], [E.x2 + pd, E.y1 - pd], [E.x1 - pd, E.y2 + pd], [E.x2 + pd, E.y2 + pd]]
          .map(([x, y]) => ({ x: clamp(x, xmin, xmax), y: clamp(y, ymin, ymax) })).filter((q) => !dentro(q.x, q.y)));
        const N = nos.length, dist = Array(N).fill(Infinity), ant = Array(N).fill(-1), feito = Array(N).fill(false);
        dist[0] = 0;
        for (let it = 0; it < N; it++) {
          let u = -1;
          for (let k = 0; k < N; k++) if (!feito[k] && (u < 0 || dist[k] < dist[u])) u = k;
          if (u < 0 || dist[u] === Infinity) break;
          feito[u] = true;
          for (let k = 0; k < N; k++) {
            if (feito[k] || cruza(nos[u].x, nos[u].y, nos[k].x, nos[k].y, E)) continue;
            const nd = dist[u] + Math.hypot(nos[k].x - nos[u].x, nos[k].y - nos[u].y);
            if (nd < dist[k]) { dist[k] = nd; ant[k] = u; }
          }
        }
        if (dist[1] < Infinity) { let k = 1; while (ant[k] > 0) k = ant[k]; mira = nos[k]; }
        else v.alvo.ate = 0;   // sem passagem: escolhe outro destino
      }
      let diff = Math.atan2(mira.y - v.y, mira.x - v.x) - v.ang;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      // contornando a borda: vira firme (senão a curva aberta joga ele de volta na borda)
      v.contornando = mira !== v.alvo;
      v.ang += diff * Math.min(1, dt * (v.contornando ? 7 : 1.6)) + (v.contornando ? 0 : rnd(-1, 1) * 1.2 * dt);
    }
    // um item desvia do outro (não ficam se batendo)
    if (!v.saindoZona) itensVivos.forEach((o) => {
      if (o === v || !(o.c.comportamento === 'andar' || o.c.comportamento === 'andarSujar')) return;
      const lim = (meio + (o.c.largura * (o.c.escala || 1)) / 2) * 1.15, dx = v.x - o.x, dy = v.y - o.y, d = Math.hypot(dx, dy);
      if (d < lim && d > 0.1) {
        const fora = Math.atan2(dy, dx);
        let df = fora - v.ang;
        while (df > Math.PI) df -= 2 * Math.PI;
        while (df < -Math.PI) df += 2 * Math.PI;
        v.ang += df * Math.min(1, dt * 4 * (1 - d / lim + 0.3));
        const emp = (1 - d / lim) * 260 * dt;
        const px = v.x + (dx / d) * emp, py = v.y + (dy / d) * emp;
        if (!dentro(px, py)) { v.x = clamp(px, xmin, xmax); v.y = clamp(py, ymin, ymax); }
      }
    });
    const tx = Math.cos(v.ang) * vel, ty = Math.sin(v.ang) * vel, resp = v.contornando ? 7 : 2.5;
    v.vx += (tx - v.vx) * Math.min(1, dt * resp);
    v.vy += (ty - v.vy) * Math.min(1, dt * resp);
    let nx = v.x + v.vx * dt, ny = v.y + v.vy * dt, bateu = false;
    // paredes da área
    if (nx < xmin) { nx = xmin; v.vx = Math.abs(v.vx); bateu = true; }
    if (nx > xmax) { nx = xmax; v.vx = -Math.abs(v.vx); bateu = true; }
    if (ny < ymin) { ny = ymin; v.vy = Math.abs(v.vy); bateu = true; }
    if (ny > ymax) { ny = ymax; v.vy = -Math.abs(v.vy); bateu = true; }
    // borda do adivinhador
    if (!v.saindoZona && dentro(nx, ny)) {
      const foraX = v.x <= E.x1 || v.x >= E.x2, foraY = v.y <= E.y1 || v.y >= E.y2;
      if (!foraX && !foraY) v.saindoZona = true;   // a borda veio pra cima dele (personagem mudou de lugar)
      else {
        const px = foraX ? Math.min(Math.abs(nx - E.x1), Math.abs(E.x2 - nx)) : Infinity, py = foraY ? Math.min(Math.abs(ny - E.y1), Math.abs(E.y2 - ny)) : Infinity;
        if (px <= py) { nx = v.x <= E.x1 ? E.x1 : E.x2; v.vx = v.x <= E.x1 ? -Math.abs(v.vx) : Math.abs(v.vx); }
        else { ny = v.y <= E.y1 ? E.y1 : E.y2; v.vy = v.y <= E.y1 ? -Math.abs(v.vy) : Math.abs(v.vy); }
        bateu = true;
      }
    }
    if (bateu) { v.ang = Math.atan2(v.vy, v.vx); if (!v.contornando) (v.batidas = v.batidas || []).push(performance.now()); }
    v.x = nx; v.y = ny;
  }
  // editor: mostra a borda do item selecionado
  let zonaVis = null;
  function desenharZona() {
    if (MODO !== 'editor') return;
    if (!zonaVis) { zonaVis = document.createElement('div'); zonaVis.id = 'zona-vis'; zonaVis.appendChild(document.createElement('span')); palco.appendChild(zonaVis); }
    const m = selecionado && /^(item|zona):(\d+)$/.exec(selecionado);
    const R = m ? CFG.rodadas[+m[2]] : null, c = R && R.item;
    const ok = c && (c.comportamento === 'andar' || c.comportamento === 'andarSujar') && (!c.zona || c.zona.mostrar !== false) && estado.tipo !== 'menu';
    const Z = ok ? zonaDe(c) : null;
    if (!Z) { zonaVis.style.display = 'none'; zonaVis.removeAttribute('data-el'); return; }
    const livre = c.zona && c.zona.modo === 'livre';
    zonaVis.style.display = 'block';
    zonaVis.style.left = Z.x1 + 'px'; zonaVis.style.top = Z.y1 + 'px';
    zonaVis.style.width = (Z.x2 - Z.x1) + 'px'; zonaVis.style.height = (Z.y2 - Z.y1) + 'px';
    zonaVis.firstChild.textContent = livre ? '⛔ Borda (arraste · roda = tamanho)' : '⛔ Borda: o item não entra aqui';
    if (livre) zonaVis.dataset.el = 'zona:' + m[2]; else zonaVis.removeAttribute('data-el');
  }
  function sujar(v, agora, dt) {
    const s = v.c.sujeira;
    if (agora > v.proxMancha) {
      if (v.proxMancha && agora - v.nasceu > 600) novaMancha(v.x + rnd(-12, 12), v.y + rnd(-12, 12), s);
      v.proxMancha = agora + Math.max(0.15, s.frequencia) * 1000 * rnd(0.6, 1.4);
    }
    if (s.gotas && agora > v.proxGota) {
      v.proxGota = agora + rnd(40, 110);
      gotas.push({ x: v.x + rnd(-20, 20), y: v.y + rnd(-5, 20), vx: rnd(-70, 70), vy: rnd(-160, 10), g: 700, r: rnd(3, 8), vida: rnd(0.5, 1.1), max: 1, cor: s.cor, a: 0.9 });
    }
    if (s.fumaca && Math.random() < dt * 7) gotas.push({ x: v.x + rnd(-25, 25), y: v.y + rnd(-25, 0), vx: rnd(-15, 15), vy: rnd(-90, -40), g: -15, r: rnd(4, 11), vida: rnd(0.8, 1.6), max: 1, cor: s.cor, a: 0.3, bolha: true });
  }
  function novaMancha(x, y, s) {
    const pts = [];
    for (let i = 0; i < 14; i++) pts.push(rnd(0.62, 1.18));
    const sat = [];
    for (let i = 0, m = Math.floor(rnd(2, 7)); i < m; i++) sat.push({ a: rnd(0, 6.283), d: rnd(1.15, 2), r: rnd(0.06, 0.2) });
    manchas.push({ x, y, r: s.tamanho * rnd(0.6, 1.25), pts, sat, t0: performance.now(), cor: s.cor, alfa: s.opacidade, vida: s.duraNaTela == null ? 30 : +s.duraNaTela, someEm: Math.max(0.1, s.someEm == null ? 3 : +s.someEm), escorre: s.escorrer && Math.random() < 0.7 ? rnd(30, 170) : 0, escX: rnd(-0.25, 0.25) });
    while (manchas.length > Math.max(1, s.max)) manchas.shift();
    redesenharSujeira = true;
  }
  function desenharSujeira(agora) {
    // depois de um tempo cada mancha vai sumindo aos poucos
    const sumindo = (m) => m.vida > 0 && agora - m.t0 > m.vida * 1000;
    if (manchas.length && manchas.some((m) => sumindo(m))) {
      redesenharSujeira = true;
      manchas = manchas.filter((m) => !(sumindo(m) && agora - m.t0 > (m.vida + m.someEm) * 1000));
      if (!manchas.length) { ctxS.clearRect(0, 0, 1920, 1080); redesenharSujeira = false; return false; }
    }
    if (!redesenharSujeira) return false;
    ctxS.clearRect(0, 0, 1920, 1080);
    let crescendo = false;
    manchas.forEach((m) => {
      const t = Math.min(1, (agora - m.t0) / 700), e = 1 - Math.pow(1 - t, 3);
      const te = Math.min(1, (agora - m.t0) / 4000);
      if (t < 1 || (m.escorre && te < 1)) crescendo = true;
      const fade = sumindo(m) ? Math.max(0, 1 - ((agora - m.t0) / 1000 - m.vida) / m.someEm) : 1;
      if (fade < 1) crescendo = true;
      const r = m.r * e, n = m.pts.length;
      ctxS.globalAlpha = m.alfa * fade; ctxS.fillStyle = m.cor; ctxS.strokeStyle = m.cor;
      const P = m.pts.map((k, i) => { const a = (i / n) * Math.PI * 2; return [m.x + Math.cos(a) * r * k, m.y + Math.sin(a) * r * k]; });
      ctxS.beginPath();
      ctxS.moveTo((P[0][0] + P[n - 1][0]) / 2, (P[0][1] + P[n - 1][1]) / 2);
      for (let i = 0; i < n; i++) { const p = P[i], q = P[(i + 1) % n]; ctxS.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      ctxS.fill();
      m.sat.forEach((s) => { ctxS.beginPath(); ctxS.arc(m.x + Math.cos(s.a) * r * s.d, m.y + Math.sin(s.a) * r * s.d, Math.max(0.5, r * s.r), 0, 7); ctxS.fill(); });
      if (m.escorre && r > 2) {
        const L = m.escorre * te, ex = m.x + m.escX * L, ey = m.y + r * 0.6 + L;
        ctxS.lineWidth = r * 0.22; ctxS.lineCap = 'round';
        ctxS.beginPath(); ctxS.moveTo(m.x, m.y); ctxS.lineTo(ex, ey); ctxS.stroke();
        ctxS.beginPath(); ctxS.arc(ex, ey, r * 0.17, 0, 7); ctxS.fill();
      }
      ctxS.globalAlpha = m.alfa * 0.35 * fade; ctxS.fillStyle = '#ffffff';
      ctxS.beginPath(); ctxS.arc(m.x - r * 0.3, m.y - r * 0.32, Math.max(0.5, r * 0.14), 0, 7); ctxS.fill();
    });
    ctxS.globalAlpha = 1;
    redesenharSujeira = crescendo;
    return crescendo;
  }
  function desenharGotas(dt) {
    if (!gotas.length) { if (desenharGotas.sujo) { ctxG.clearRect(0, 0, 1920, 1080); desenharGotas.sujo = false; } return false; }
    ctxG.clearRect(0, 0, 1920, 1080);
    desenharGotas.sujo = true;
    gotas = gotas.filter((g) => (g.vida -= dt) > 0);
    gotas.forEach((g) => {
      g.vy += g.g * dt; g.x += g.vx * dt; g.y += g.vy * dt;
      ctxG.globalAlpha = Math.min(1, g.vida * 1.8) * g.a;
      ctxG.fillStyle = g.cor;
      ctxG.beginPath(); ctxG.arc(g.x, g.y, g.bolha ? g.r * (1.3 - g.vida * 0.3) : g.r, 0, 7); ctxG.fill();
    });
    ctxG.globalAlpha = 1;
    return true;
  }
  function passoItens(agora, dt, S, fontes) {
    let vivo = false;
    itensVivos.forEach((v) => {
      const c = v.c;
      if (v.daFoto) {
        v.daFoto = false;
        const p = elRes.style.display !== 'none' ? centroNoPalco(fotoMoldura) : null;
        if (p) { v.x = p.x; v.y = p.y; v.nasceu = agora; }
      }
      const f = Math.min(1, (agora - v.nasceu) / 2000);
      if (c.comportamento === 'aparicoes') {
        if (fxPreview) {
          const ca = Object.assign({}, EF_PADRAO.aparicoes, c.aparicoes);
          // ficam mais fortes aos poucos (rampa)
          fontes.push({ c: ca, f: Math.min(1, (agora - v.nasceu) / (Math.max(0.1, ca.rampa == null ? 1.5 : ca.rampa) * 1000)), pool: poolAparicao(c.imagem, ca, v.R.resultado.imagem) });
          vivo = true;
        }
      } else if (fxPreview) {
        if (c.comportamento === 'andar' || c.comportamento === 'andarSujar') { mover(v, dt); vivo = true; }
        if (c.comportamento === 'andarSujar') sujar(v, agora, dt);
        if (agora - v.nasceu < Math.max(500, (c.surgirDuracao || 0.6) * 1000 + 50) || c.balancar) vivo = true;
        desenharItem(v, agora);
      }
      if ((fxPreview || MODO === 'editor') && c.clima && c.clima.ativo) {
        const k = c.clima;
        // no final sombrio o clima some junto com a tela escurecendo
        const fk = fin ? clamp(1 - (agora - fin.t0) / 1000 / Math.max(0.2, fin.rv.tempoPreto), 0, 1) : 1;
        if (fin && fk > 0) vivo = true;
        const f = (fxPreview ? Math.min(1, (agora - v.nasceu) / 2000) : 1) * fk;
        S.esc = Math.max(S.esc, k.escurecer * f); S.pb = Math.max(S.pb, k.dessaturar * f);
        if (k.tomForca > 0 && k.tomForca * f > S.tomA) { S.tom = k.tom; S.tomA = k.tomForca * f; }
        if (k.vinheta * f > S.escuro) { S.escuro = k.vinheta * f; S.escuroTam = 0.55; S.escuroCentro = 'tela'; }
        S.nevoa = Math.max(S.nevoa, k.nevoa * f);
        if (f < 1) vivo = true;
      }
    });
    if (desenharSujeira(agora)) vivo = true;
    if (desenharGotas(dt)) vivo = true;
    return vivo;
  }

  // ======================================================================
  // FINAL SOMBRIO (tela preta, filme antigo, falas, susto)
  // ======================================================================
  let fin = null, finEstatico = null;
  function estiloFalas(rv) {
    const se = Object.assign({ ativo: true, texto: '▼', cor: '#ffffff', tamanho: 0.7, animacao: 'pular', posicao: 'fim' }, rv.seta || {});
    falasEl.style.setProperty('--seta-txt', JSON.stringify(String(se.texto || '▼')));
    falasEl.style.setProperty('--seta-cor', se.cor);
    falasEl.style.setProperty('--seta-tam', (+se.tamanho || 0.7) + 'em');
    falasEl.style.setProperty('--seta-anim', se.animacao === 'piscar' ? 'setaPisca' : se.animacao === 'nenhuma' ? 'setaParada' : 'setaPula');
    falasEl.classList.toggle('seta-abaixo', se.posicao === 'abaixo');
    falasEl.style.left = (rv.falaX == null ? 960 : rv.falaX) + 'px';
    falasEl.style.top = rv.falaY + 'px';
    falasEl.style.fontSize = rv.falaTamanho + 'px';
    falasEl.style.color = rv.falaCor;
    falasEl.style.fontFamily = fonteExtra(rv.falaFonte);
  }
  // ---------- ATAQUE (corte vermelho do final) ----------
  const ATAQUE_PADRAO = { src: 'IMG/ataque-padrao.png', quadros: 5, larg: 240, alt: 984, duracoes: [100, 100, 100, 100, 200], golpe: 2 };
  const ataqueEl = $('ataque'), tamImgs = {};
  if (MODO !== 'editor' && $('palco-topo')) $('palco-topo').appendChild(ataqueEl);
  function dadosAtaque(a) {
    const u = a && a.imagem ? src(a.imagem) : null;
    if (!u) return ATAQUE_PADRAO;
    const n = Math.max(1, (a.quadros | 0) || 1);
    return { src: u, quadros: n, duracoes: a.duracoes && a.duracoes.length === n ? a.duracoes : Array(n).fill(n > 1 ? 100 : 700), golpe: a.golpe != null ? Math.min(n - 1, a.golpe) : Math.floor(n / 2) };
  }
  function estiloAtaque(a, quadro) {
    const d = dadosAtaque(a), h = a.altura || 760;
    let prop = d === ATAQUE_PADRAO ? d.larg / d.alt : null;
    if (prop == null) {
      const t = tamImgs[d.src];
      if (t) prop = t.w / d.quadros / t.h;
      else { prop = 0.4; const im = new Image(); im.onload = () => { tamImgs[d.src] = { w: im.naturalWidth, h: im.naturalHeight }; if (ataqueEl.style.display !== 'none') estiloAtaque(a, quadro); }; im.src = d.src; }
    }
    ataqueEl.style.width = Math.round(h * prop) + 'px';
    ataqueEl.style.height = Math.round(h) + 'px';
    ataqueEl.style.backgroundImage = 'url("' + d.src + '")';
    ataqueEl.style.backgroundSize = d.quadros * 100 + '% 100%';
    ataqueEl.style.backgroundPosition = d.quadros > 1 ? (quadro / (d.quadros - 1)) * 100 + '% 0' : '0 0';
    posicionar(ataqueEl, { x: a.x, y: a.y, escala: 1, rotacao: a.rotacao || 0, espelharX: !!a.espelhar }, true);
  }
  function mostrarAtaqueEstatico(rv) {
    const a = rv && rv.ataque;
    if (MODO !== 'editor' || !a || !a.ativo) { vis(ataqueEl, false); return; }
    vis(ataqueEl, true); ataqueEl.style.clipPath = '';
    // só fica clicável quando está selecionado (senão atrapalha clicar na imagem do final)
    const sel = selecionado === 'ataque';
    ataqueEl.style.opacity = sel ? '0.95' : '0.45';
    ataqueEl.classList.toggle('nao-clica', !sel);
    estiloAtaque(a, dadosAtaque(a).golpe);
  }
  function somCorte(vol) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, dur = 0.26, n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const r = a.createBufferSource(); r.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4;
    f.frequency.setValueAtTime(5200, t); f.frequency.exponentialRampToValueAtTime(700, t + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.55 * vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    r.connect(f); f.connect(g); g.connect(a.destination); r.start(t); r.stop(t + dur);
  }
  function somBug(vol, dur) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    let v = 0, seg = 0;
    for (let i = 0; i < n; i++) { if (--seg <= 0) { v = Math.random() < 0.5 ? 0 : Math.random() * 2 - 1; seg = Math.floor(rnd(30, 900)); } d[i] = v * (Math.random() < 0.7 ? 1 : 0) + (Math.random() * 2 - 1) * 0.15; }
    const r = a.createBufferSource(); r.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.6;
    const g = a.createGain(); g.gain.setValueAtTime(0.35 * vol, t); g.gain.setValueAtTime(0.35 * vol, t + dur * 0.85); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    r.connect(f); f.connect(g); g.connect(a.destination); r.start(t); r.stop(t + dur);
  }
  function somGolpe(vol) {
    const a = audio(); if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'square'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.22);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400;
    o.connect(lp); lp.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.32);
    const n = Math.floor(a.sampleRate * 0.14), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const r = a.createBufferSource(); r.buffer = buf;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2400;
    const gr = a.createGain(); gr.gain.value = 0.6 * vol;
    r.connect(f); f.connect(gr); gr.connect(a.destination); r.start(t);
  }
  // ---------- 2ª imagem do final ----------
  function img2De(rv) { const i = rv && rv.imagem2; return i && i.imagem ? i : null; }
  const img2Leve = (rv) => { const i = img2De(rv); return !!i && (i.modo || 'leve') === 'leve'; };
  // a imagem 2 passa a ter posição própria (começa no mesmo lugar e tamanho da imagem 1)
  function img2Propria(rv) {
    const i = rv.imagem2;
    if (i.x == null) Object.assign(i, { x: rv.x + (+i.dx || 0), y: rv.y + (+i.dy || 0), largura: rv.largura, altura: rv.altura, escala: (rv.escala || 1) * (+i.escala || 1), rotacao: rv.rotacao || 0, espelharX: !!rv.espelharX, espelharY: !!rv.espelharY, dx: 0, dy: 0 });
    return i;
  }
  function posImg2(rv) {
    const i = rv.imagem2 || {}, sc = i.x == null ? (rv.escala || 1) * (+i.escala || 1) : (+i.escala || 1);
    const o = { x: i.x == null ? rv.x + (+i.dx || 0) : i.x, y: i.y == null ? rv.y + (+i.dy || 0) : i.y, escala: sc, rotacao: i.x == null ? rv.rotacao : (i.rotacao || 0), espelharX: i.x == null ? rv.espelharX : i.espelharX, espelharY: i.x == null ? rv.espelharY : i.espelharY };
    elRev2.style.width = (i.largura || rv.largura) + 'px';
    elRev2.style.height = (i.altura || rv.altura) + 'px';
    posicionar(elRev2, o, true);
  }
  function estiloImg2() { revImg2.style.transform = ''; }
  function mostrarImg2(rv, t) {
    const i = img2De(rv); if (!i) return;
    setImg(revImg2, i.imagem, 'Imagem 2', 900, 900);
    posImg2(rv); estiloImg2();
    revImg2.style.transition = 'none'; revImg2.style.opacity = '0'; revImg2.style.filter = '';
    vis(elRev2, true);
    fin.tI2 = t;
  }
  function passoImg2(rv, t) {
    const i = img2De(rv); if (!i || fin.fase === 'bugado' || fin.fase === 'susto' || fin.fase === 'fim') return;
    const p = t - fin.tI2, ap = Math.max(0.001, +i.tempoAparecer || 0), k = clamp(p / ap, 0, 1);
    let op = 1, sc = 1;
    if (i.aparecer === 'suave') op = k;
    else if (i.aparecer === 'pop') { op = Math.min(1, k * 2); sc = k < 1 ? 0.6 + 0.55 * Math.sin(k * Math.PI * 0.75) : 1; }
    else if (i.aparecer === 'piscar') op = k < 1 ? (Math.floor(p * 22) % 2 ? 1 : 0.1) : 1;
    if (img2Leve(rv)) op *= clamp(+i.forca || 1, 0, 1);
    revImg2.style.opacity = op.toFixed(3);
    const tr = Math.max(0, +i.tremer || 0) * clamp(1 - p / 0.6, 0, 1);
    revImg2.style.transform = `translate(${rnd(-tr, tr)}px, ${rnd(-tr, tr) * 0.5}px) scale(${sc.toFixed(3)})`;
    revImg2.style.filter = i.piscarVermelho && p < 0.35 && Math.floor(p * 16) % 2 ? 'sepia(1) saturate(9) hue-rotate(-45deg) brightness(1.1)' : '';
  }
  function depoisDoAtaque(rv, t) {
    // modo leve sem tela bugada: a imagem 2 aparece fraquinha, fica um pouco e acaba
    if (img2Leve(rv) && fin.tI2 == null && !(rv.bug && rv.bug.ativo)) { mostrarImg2(rv, t); fin.fase = 'img2'; return; }
    if (rv.bug && rv.bug.ativo) { fin.fase = 'antesBug'; fin.tBi = t + Math.max(0, rv.bug.depois || 0); }
    else { fin.fase = 'antesSusto'; fin.tSusto = t + (rv.jumpscare ? rv.jumpscare.depois : 0); }
  }
  const fimJogoCfg = () => Object.assign({ voltarMenu: true, segundos: 5, transicao: 1.5, estatica: true }, CFG.fimJogo || {});
  // depois da tela preta do final: volta pro menu (e ganha as estrelas)
  function voltarAoMenu() {
    const FJ = fimJogoCfg();
    marcarZerou();
    modoContinuar = false;
    aplicarMenu();
    avisoVisto = true; // o aviso só aparece na 1ª vez
    transicao.style.transition = 'none'; transicao.style.opacity = '1';
    ocupado = false;
    mostrarMenu();
    void transicao.offsetWidth;
    transicao.style.transition = 'opacity ' + Math.max(0.05, +FJ.transicao || 0.05) + 's ease';
    transicao.style.opacity = '0';
    if (FJ.estatica && CFG.menu.estilo === 'lista') { rajadaMenu(0.8, Math.max(0.2, +FJ.transicao || 0.2)); tocarSomMenu('menuEntrar', 0.5); }
  }
  function pararFinal() {
    if (fin && fin.timerMenu) clearTimeout(fin.timerMenu);
    fin = null; finEstatico = null;
    if (typeof atualizarOndas === 'function') setTimeout(atualizarOndas, 0);
    limparListaFinal();
    vis(elRev2, false); elRev2.style.translate = ''; revImg2.style.filter = ''; esperarClique(false, {});
    listaEl.classList.remove('sumindo'); listaEl.style.transition = '';
    vis(ataqueEl, false); elRev.style.translate = ''; revImg.style.filter = ''; revImg.style.transition = '';
    falasEl.style.transition = ''; falasEl.style.opacity = '';
    preto.style.transition = 'none'; preto.style.opacity = '0';
    palco.classList.remove('final-ativo');
    falasEl.textContent = '';
    elRev.style.scale = ''; elRev.style.filter = ''; revImg.style.opacity = '';
  }
  function listaFinalCfg() { return Object.assign({ modo: 'umPorUm', depois: 0.6, intervalo: 0.7, duracao: 0.6, animacao: 'glitch', ultimoEspera: 0.9, depoisDeTudo: 0.9, som: true, volume: 0.5, centro: true, centroX: 960, centroY: 540, centroEscala: 2.6, centroDuracao: 1.1, centroEspera: 0.6, centroTitulo: false }, (CFG.lista && CFG.lista.final) || {}); }
  // monta a fila: cada item some depois do outro (o último, o do final, por último)
  function planoListaFinal(rv) {
    const LF = listaFinalCfg();
    if (LF.modo !== 'umPorUm' || !CFG.lista || !CFG.lista.ativo || listaEl.style.display === 'none') return null;
    const itens = Array.from(listaItens.children);
    if (!itens.length) return null;
    const t0c = (rv.tempoPreto || 0) + Math.max(0, +LF.depois || 0);
    const centro = LF.centro ? { t0: t0c, dur: Math.max(0.05, +LF.centroDuracao || 0.05), x: +LF.centroX, y: +LF.centroY, s: Math.max(0.1, +LF.centroEscala || 1), comecou: false } : null;
    const ini = t0c + (centro ? centro.dur + Math.max(0, +LF.centroEspera || 0) : 0), iv = Math.max(0, +LF.intervalo || 0), dur = Math.max(0.05, +LF.duracao || 0.05);
    const seq = itens.map((el, k) => ({ el, t0: ini + k * iv + (k === itens.length - 1 && itens.length > 1 ? Math.max(0, +LF.ultimoEspera || 0) : 0), som: false }));
    return { seq, dur, anim: LF.animacao, fim: seq[seq.length - 1].t0 + dur, apagou: false, LF, centro };
  }
  function passoListaFinal(t) {
    const P = fin && fin.lista; if (!P) return;
    // 1) a lista sai de onde estava (posição e tamanho) e vai pro centro, grande e em linha
    const C = P.centro;
    if (C && t >= C.t0 && !C.acabou) {
      if (!C.comecou) {
        // mede cada item onde está, monta a lista já no centro (em linha) e anima cada item do lugar antigo até o novo (FLIP),
        // assim uma lista em coluna vira linha deslizando, sem pular
        C.comecou = true;
        const itens = Array.from(listaItens.children), meio = (r) => [r.left + r.width / 2, r.top + r.height / 2];
        const antes = itens.map((d) => d.getBoundingClientRect());
        listaEl.style.transition = 'background .5s ease';
        listaEl.style.background = 'transparent';
        listaEl.classList.remove('vertical');
        listaItens.style.transition = 'none';
        posicionar(listaEl, { x: C.x, y: C.y, escala: C.s, rotacao: 0 }, false);
        const depois = itens.map((d) => d.getBoundingClientRect()), f = escala * C.s;
        C.flip = itens.map((d, i) => {
          const a = meio(antes[i]), b = meio(depois[i]);
          return { d, dx: (a[0] - b[0]) / f, dy: (a[1] - b[1]) / f, r: antes[i].width / Math.max(1, depois[i].width) };
        });
        C.flip.forEach((x) => { x.d.style.transition = 'none'; x.d.style.transform = `translate(${x.dx}px, ${x.dy}px) scale(${x.r})`; });
        if (!P.LF.centroTitulo) { listaTit.style.transition = 'opacity .4s ease'; listaTit.style.opacity = '0'; }
      }
      const n = C.flip.length, atraso = Math.min(0.08, C.dur / 6), durItem = Math.max(0.05, C.dur - atraso * (n - 1));
      let tudo = true;
      C.flip.forEach((x, i) => {
        const k0 = clamp((t - C.t0 - i * atraso) / durItem, 0, 1), k = k0 < 0.5 ? 4 * k0 * k0 * k0 : 1 - Math.pow(-2 * k0 + 2, 3) / 2;
        if (k0 < 1) tudo = false;
        x.d.style.transform = k0 >= 1 ? '' : `translate(${(x.dx * (1 - k)).toFixed(1)}px, ${(x.dy * (1 - k)).toFixed(1)}px) scale(${(x.r + (1 - x.r) * k).toFixed(4)})`;
      });
      if (tudo) C.acabou = true;
    }
    P.seq.forEach((it) => {
      if (t < it.t0) return;
      const k = clamp((t - it.t0) / P.dur, 0, 1), st = it.el.style;
      if (!it.som) { it.som = true; if (P.LF.som) tocarSomMenu('glitch', P.LF.volume, 0.18); }
      let op = 1 - k, tf = '';
      if (P.anim === 'encolher') tf = `scale(${(1 - k).toFixed(3)})`;
      else if (P.anim === 'cair') tf = `translateY(${(k * k * 140).toFixed(1)}px) rotate(${(k * 35).toFixed(1)}deg)`;
      else if (P.anim === 'tremer') tf = `translate(${rnd(-9, 9) * (1 - k * 0.5)}px, ${rnd(-4, 4)}px)`;
      else if (P.anim === 'glitch') { tf = `translateX(${rnd(-14, 14).toFixed(0)}px)`; op = k >= 1 ? 0 : Math.random() < 0.45 ? 0 : (1 - k * 0.7); st.filter = k < 1 ? 'hue-rotate(' + rnd(-90, 90).toFixed(0) + 'deg) contrast(1.6)' : ''; }
      st.transition = 'none'; st.opacity = op.toFixed(3); st.transform = k >= 1 ? '' : tf;
    });
    if (!P.apagou && t >= P.fim) { P.apagou = true; listaEl.style.transition = 'opacity .35s ease'; listaEl.classList.add('sumindo'); }
  }
  function limparListaFinal() { Array.from(listaItens.children).forEach((d) => { d.style.opacity = ''; d.style.transform = ''; d.style.filter = ''; d.style.transition = ''; }); listaTit.style.opacity = ''; listaTit.style.transition = ''; listaEl.style.background = ''; if (CFG && CFG.lista) { aplicarDirecao(); posicionarLista(); } }
  function sumirLista() {
    const L = CFG.lista;
    if (!L || !L.esconderNoFinal) return;
    listaEl.style.transition = 'opacity ' + Math.max(0, L.sumirDuracao == null ? 1.5 : L.sumirDuracao) + 's ease';
    listaEl.classList.add('sumindo');
  }
  // ---------- falas que passam com clique ----------
  const porClique = (rv) => (rv.avancar || 'clique') === 'clique';
  const setaLigada = (rv) => !rv.seta || rv.seta.ativo !== false;
  function esperarClique(on, rv) {
    falasEl.classList.toggle('esperando', !!on && setaLigada(rv));
    document.body.classList.toggle('espera-clique', !!on);
  }
  function cliqueFala(e) {
    if (!fin || fin.fase !== 'falas' || MODO === 'editor') return;
    if (e && e.target && e.target.closest && e.target.closest('#dbg')) return;
    if (e && e.type === 'keydown' && !/^( |Enter|z|Z)$/.test(e.key)) return;
    if (e && e.type === 'pointerdown' && e.button !== 0) return;
    const rv = fin.rv;
    if (!porClique(rv)) return;
    if (fin.digitando) { if (rv.cliqueCompleta !== false) fin.completar = true; return; }
    if (fin.esperaClique) fin.clicou = true;
  }
  addEventListener('pointerdown', cliqueFala, true);
  addEventListener('keydown', cliqueFala, true);
  function revelarSombrio(R) {
    ocupado = true;
    const rv = R.revelacao;
    fin = { R, rv, t0: performance.now(), fase: 'preto' };
    // lista: some junto com o escuro, ou um item de cada vez depois que tudo escureceu
    const LF = listaFinalCfg();
    if (LF.modo === 'junto') sumirLista();
    else if (LF.modo === 'umPorUm') {
      fin.lista = planoListaFinal(rv);
      if (fin.lista) fin.extraLista = Math.max(0, fin.lista.fim + Math.max(0, +LF.depoisDeTudo || 0) - ((rv.tempoPreto || 0) + (rv.espera || 0)));
    }
    ativos = [];
    estiloFalas(rv);
    preto.style.transition = 'opacity ' + Math.max(0.05, rv.tempoPreto) + 's ease';
    void preto.offsetWidth;
    preto.style.opacity = '1';
    palco.classList.add('final-ativo');
    (CFG.extras || []).forEach((x) => { const e = extrasEls.get(x.id); if (e && x.esconderNaRevelacao) e.classList.add('sumindo'); });
    garantirLoop();
  }
  function passoFinal(agora, S) {
    if (!fin) return false;
    const rv = fin.rv, t = (agora - fin.t0) / 1000;
    const T1 = rv.tempoPreto, T2 = T1 + rv.espera + (fin.extraLista || 0);
    passoListaFinal(t);
    if (fin.fase === 'preto' && t >= T1) {
      fin.fase = 'espera'; atualizarOndas();
      if (CFG.lista && CFG.lista.esconderNoFinal && listaFinalCfg().modo === 'junto') listaEl.classList.add('sumindo');
      vis(elPainel, false); vis(elRes, false); vis(elPers, false);
      estado = { tipo: 'fim', r: estado.r, p: 0 };
      aplicarPosicoes();
      preencherRevelacao(fin.R);
      revImg.classList.remove('revelando');
      revImg.style.opacity = '0';
      vis(elRev, true);
    }
    if (fin.fase === 'espera' && t >= T2) fin.fase = 'aparecer';
    if (fin.fase === 'aparecer') {
      const p = clamp((t - T2) / Math.max(0.01, rv.tempoAparecer), 0, 1);
      const op = rv.aparecer === 'degraus' ? Math.floor(p * Math.max(1, rv.degraus) + 1e-6) / Math.max(1, rv.degraus) : p;
      revImg.style.opacity = op.toFixed(3);
      if (p >= 1) { fin.fase = 'falas'; fin.linha = -1; fin.proxEm = t + 0.5; fin.digitando = false; }
    }
    if (t >= T2 && rv.filme && rv.filme.ativo && !fin.semFilme) {
      const k = clamp((t - T2) / 0.6, 0, 1);
      S.filme = Math.max(S.filme, rv.filme.intensidade * k);
      if (rv.filme.sepia) S.sep = Math.max(S.sep, 0.7 * k);
      if (fin.fase !== 'susto') elRev.style.filter = 'brightness(' + rnd(0.86, 1.08).toFixed(3) + ')';
    }
    if (fin.fase === 'falas') {
      const falas = (rv.falas || []).map((x) => String(x).replace(/\\n/g, '\n')).filter((x) => x.trim());
      if (fin.digitando) {
        if (fin.completar) { fin.completar = false; fin.tDig = -1e9; }
        const n = Math.min(fin.texto.length, Math.floor((t - fin.tDig) * Math.max(1, rv.falaVelocidade)));
        if (n > fin.mostrados) {
          if (n - fin.mostrados < 8) for (let i = fin.mostrados; i < n; i++) if (rv.falaSom && /\S/.test(fin.texto[i])) { blip(rv.falaTom, rv.falaVolume); break; }
          fin.mostrados = n;
          falasEl.textContent = fin.texto.slice(0, n);
        }
        if (n >= fin.texto.length) {
          fin.digitando = false;
          if (porClique(rv)) { fin.esperaClique = true; fin.clicou = false; esperarClique(true, rv); fin.proxEm = Infinity; }
          else fin.proxEm = t + rv.falaPausa;
        }
      } else if (fin.esperaClique) {
        if (fin.clicou) { fin.esperaClique = false; fin.clicou = false; esperarClique(false, rv); fin.proxEm = t; }
      }
      if (!fin.digitando && !fin.esperaClique && t >= fin.proxEm) {
        fin.linha++;
        if (fin.linha < falas.length) { fin.texto = falas[fin.linha]; fin.mostrados = 0; fin.digitando = true; fin.tDig = t; falasEl.textContent = ''; falasEl.style.transition = 'none'; falasEl.style.opacity = ''; }
        else {
          // o texto some (aos poucos) e, se escolhido, o personagem também
          const ts = Math.max(0, rv.textoSome == null ? 0.4 : rv.textoSome);
          falasEl.style.transition = 'opacity ' + ts + 's ease'; falasEl.style.opacity = '0';
          if (rv.someAposFalas) { revImg.style.transition = 'opacity ' + Math.min(ts, 0.2) + 's ease'; revImg.style.opacity = '0'; }
          const depois = t + ts;
          if (rv.ataque && rv.ataque.ativo) { fin.fase = 'antesAtaque'; fin.tA = depois + Math.max(0, rv.ataque.depois || 0); }
          else if (img2De(rv)) { fin.fase = 'antesImg2'; fin.tA = depois; }
          else if (rv.bug && rv.bug.ativo) { fin.fase = 'antesBug'; fin.tBi = depois; }
          else { fin.fase = 'antesSusto'; fin.tSusto = depois + (rv.jumpscare ? rv.jumpscare.depois : 0); }
        }
      }
    }
    if (fin.fase === 'antesAtaque' && t >= fin.tA) {
      fin.fase = 'ataque'; fin.tAt = t; fin.golpeRep = -1;
      ataqueEl.style.opacity = '1'; ataqueEl.style.clipPath = '';
      vis(ataqueEl, true);
      if (rv.ataque.som) somCorte(rv.ataque.volume == null ? 0.6 : rv.ataque.volume);
    }
    if (fin.fase === 'ataque') {
      const a = rv.ataque, d = dadosAtaque(a), vel = Math.max(0.05, a.velocidade || 1);
      const total = d.duracoes.reduce((x, y) => x + y, 0) / 1000, vezes = Math.max(1, (a.vezes | 0) || 1);
      const e = (t - fin.tAt) * vel, rep = Math.floor(e / total), dentro = e - rep * total;
      if (rep >= vezes) {
        vis(ataqueEl, false);
        const i2 = img2De(rv);
        if (i2 && img2Leve(rv)) depoisDoAtaque(rv, t);
        else if (i2 && i2.quando !== 'golpe') { mostrarImg2(rv, t); fin.fase = 'img2'; }
        else if (i2 && fin.tI2 != null) fin.fase = 'img2';
        else depoisDoAtaque(rv, t);
      } else {
        let acc = 0, q = 0;
        for (; q < d.quadros - 1; q++) { acc += d.duracoes[q] / 1000; if (dentro < acc) break; }
        estiloAtaque(a, q);
        if (d.quadros === 1) {
          // imagem parada: risca de cima pra baixo e some
          const k = dentro / total;
          ataqueEl.style.clipPath = 'inset(0 0 ' + ((1 - clamp(k / 0.3, 0, 1)) * 100).toFixed(1) + '% 0)';
          ataqueEl.style.opacity = k > 0.65 ? (1 - (k - 0.65) / 0.35).toFixed(3) : '1';
        }
        if (q >= d.golpe && fin.golpeRep < rep) {
          fin.golpeRep = rep; fin.tGolpe = t; fin.golpeLimpo = false;
          const i2 = img2De(rv);
          if (i2 && !img2Leve(rv) && i2.quando === 'golpe' && fin.tI2 == null) mostrarImg2(rv, t);
          if (a.som) somGolpe(a.volume == null ? 0.6 : a.volume);
        }
      }
    }
    if (fin.tGolpe != null && !fin.golpeLimpo) {
      const a = rv.ataque, g = t - fin.tGolpe;
      if (g < 0.5) {
        const k = 1 - g / 0.5;
        if (a.tremor) { S.tx += rnd(-1, 1) * a.tremor * k * escala; S.ty += rnd(-1, 1) * a.tremor * 0.4 * k * escala; }
        if (a.flash && g < 0.32) { S.flash = Math.max(S.flash, (a.flashForca == null ? 0.3 : a.flashForca) * (1 - g / 0.32)); S.flashCor = a.flashCor || '#ff0000'; }
        if (a.tremerAlvo) elRev.style.translate = (Math.sin(g * 70) * 22 * k).toFixed(1) + 'px 0';
        if (a.piscarAlvo) revImg.style.filter = Math.floor(g * 18) % 2 ? 'sepia(1) saturate(9) hue-rotate(-45deg) brightness(1.15)' : '';
      } else { fin.golpeLimpo = true; elRev.style.translate = ''; revImg.style.filter = ''; }
    }
    if (fin.fase === 'antesImg2' && t >= fin.tA) { mostrarImg2(rv, t); fin.fase = 'img2'; }
    if (fin.tI2 != null) passoImg2(rv, t);
    if (fin.fase === 'img2' && t >= fin.tI2 + Math.max(0, img2De(rv).fica || 0) + (img2Leve(rv) ? Math.max(0, img2De(rv).tempoAparecer || 0) : 0)) { if (img2Leve(rv)) { fin.fase = 'antesSusto'; fin.tSusto = t; } else depoisDoAtaque(rv, t); }
    // tela "bugando" depois do ataque, antes do susto
    if (fin.fase === 'antesBug' && t >= fin.tBi) { if (img2Leve(rv)) { mostrarImg2(rv, t); revImg.style.opacity = '0'; } fin.fase = 'bugado'; fin.tB = t; if (rv.bug.som) somBug(rv.bug.volume == null ? 0.4 : rv.bug.volume, Math.max(0.1, rv.bug.duracao)); }
    if (fin.fase === 'bugado') {
      const b = rv.bug, p = t - fin.tB, k = clamp(1 - p / Math.max(0.05, b.duracao) * 0.3, 0, 1);
      S.glitch = Math.max(S.glitch, (b.glitch == null ? 1 : b.glitch) * k);
      if (b.tremor) { S.tx += rnd(-1, 1) * b.tremor * escala; S.ty += rnd(-1, 1) * b.tremor * 0.5 * escala; }
      if (b.cores && Math.random() < 0.12) S.inv = true;
      if (b.cores && Math.random() < 0.15) { S.flash = Math.max(S.flash, rnd(0.1, 0.35)); S.flashCor = Math.random() < 0.5 ? '#ff0000' : '#ffffff'; }
      if (b.imagem !== false || img2Leve(rv)) {
        elRev.style.translate = rnd(-28, 28).toFixed(0) + 'px ' + rnd(-8, 8).toFixed(0) + 'px'; elRev2.style.translate = elRev.style.translate;
        revImg.style.transition = 'none';
        if (img2Leve(rv)) {
          // a imagem 2 pisca no lugar da imagem 1 (do mesmo jeito que a 1 piscava) enquanto dá o glitch
          const forca = clamp(+img2De(rv).forca || 1, 0, 1);
          revImg.style.opacity = '0';
          revImg2.style.transition = 'none';
          revImg2.style.opacity = (forca * (rv.someAposFalas ? (Math.random() < 0.3 ? rnd(0.2, 0.9) : 0) : rnd(0.35, 1))).toFixed(2);
        } else {
          revImg.style.opacity = (rv.someAposFalas ? (Math.random() < 0.3 ? rnd(0.2, 0.9) : 0) : rnd(0.35, 1)).toFixed(2);
          if (fin.tI2 != null) revImg2.style.opacity = img2De(rv).noBug === false ? '0' : (Math.random() < 0.25 ? rnd(0, 0.4) : rnd(0.7, 1)).toFixed(2);
        }
      }
      if (p >= b.duracao) {
        elRev.style.translate = ''; elRev2.style.translate = ''; revImg.style.opacity = rv.someAposFalas || img2Leve(rv) ? '0' : '1';
        // acabou o glitch: a imagem 2 some junto (ou fica parada um pouco, se escolheu)
        if (img2Leve(rv)) revImg2.style.opacity = (+img2De(rv).fica || 0) > 0 ? String(clamp(+img2De(rv).forca || 1, 0, 1)) : '0';
        fin.fase = 'antesSusto'; fin.tSusto = t + (rv.jumpscare ? rv.jumpscare.depois : 0);
        // modo leve: a imagem do fim fica parada mais um pouco antes do preto
        if (img2Leve(rv) && (+img2De(rv).fica || 0) > 0) { fin.fase = 'img2Fim'; fin.tF2 = t + (+img2De(rv).fica); }
      }
    }
    if (fin.fase === 'img2Fim' && t >= fin.tF2) { fin.fase = 'antesSusto'; fin.tSusto = t + (rv.jumpscare ? rv.jumpscare.depois : 0); }
    if (fin.fase === 'antesSusto') {
      if (!rv.jumpscare || !rv.jumpscare.ativo) { fin.fase = 'fim'; vis(elRev, false); vis(elRev2, false); falasEl.textContent = ''; fin.semFilme = true; }   // sem susto: acaba no preto
      else if (t >= fin.tSusto) { fin.fase = 'susto'; fin.tS = t; revImg.style.transition = 'none'; revImg.style.opacity = '1'; vis(elRev2, false); if (rv.jumpscare.grito) grito(rv.jumpscare.volume, Math.max(0.3, rv.jumpscare.duracao + 0.2)); }
    }
    if (fin.fase === 'susto') {
      const j = rv.jumpscare, p = t - fin.tS;
      const cresc = clamp(p / 0.22, 0, 1);
      elRev.style.scale = (1 + (j.zoom - 1) * (1 - Math.pow(1 - cresc, 3))).toFixed(3);
      elRev.style.filter = 'contrast(1.4) brightness(' + rnd(0.8, 1.3).toFixed(2) + ')';
      if (j.tremor) { S.tx += rnd(-1, 1) * j.tremor * escala; S.ty += rnd(-1, 1) * j.tremor * escala; }
      if (j.glitch) S.glitch = Math.max(S.glitch, 0.9);
      if (j.flash) { S.flash = Math.max(S.flash, (Math.random() < 0.5 ? 0.55 : 0.12) * (1 - p / Math.max(0.1, j.duracao))); S.flashCor = j.flashCor; }
      if (p >= j.duracao) {
        fin.fase = 'fim';
        if (j.fim === 'preto') { vis(elRev, false); vis(elRev2, false); falasEl.textContent = ''; fin.semFilme = true; }
        else { elRev.style.scale = ''; elRev.style.filter = ''; }
      }
    }
    if (fin.fase === 'fim') {
      if (!fin.agendouMenu) {
        fin.agendouMenu = true;
        const FJ = fimJogoCfg();
        if (FJ.voltarMenu && CFG.menu && CFG.menu.ativo && MODO !== 'editor') fin.timerMenu = setTimeout(voltarAoMenu, Math.max(0, +FJ.segundos || 0) * 1000);
      }
      if (!fin.limpou) { fin.limpou = (fin.limpou || 0) + 1; return true; }
      if (fin.limpou < 3) { fin.limpou++; return true; }
      return !fin.semFilme && !!(rv.filme && rv.filme.ativo);
    }
    return true;
  }

  // ---------------- AO VIVO (ADM no site: ver a fase, editar textos e resetar) ----------------
  let BASE_CFG = null;
  function mesclarAoVivo(alvo, patch) {
    if (!patch || typeof patch !== 'object') return alvo;
    Object.keys(patch).forEach((k) => {
      const v = patch[k], a = alvo[k];
      if (v === null || v === undefined) return;
      if (Array.isArray(v) && Array.isArray(a) && (a.length === 0 || typeof a[0] !== 'object')) alvo[k] = v.slice();
      else if (typeof v === 'object' && a && typeof a === 'object') mesclarAoVivo(a, v);
      else alvo[k] = v;
    });
    return alvo;
  }
  function aplicarAjustesAoVivo(patch) {
    if (!BASE_CFG) BASE_CFG = JSON.parse(JSON.stringify(CFG));
    CFG = mesclarAoVivo(JSON.parse(JSON.stringify(BASE_CFG)), patch || {});
    aplicarEstilos();
    atualizarOndas();
    if (estado.tipo === 'pergunta' && !ocupado) {
      const R = CFG.rodadas[estado.r];
      if (R && R.perguntas[estado.p]) { qText.textContent = R.perguntas[estado.p].texto; montarRespostas(respostasDe(estado.r, estado.p)); }
    }
  }
  function iniciarAoVivo() {
    if (MODO === 'editor' || location.protocol === 'file:') return;
    let tent = 0;
    (function esperar() {
      if (!window.Trava || !window.Trava.ready) { if (++tent < 120) setTimeout(esperar, 100); return; }
      window.Trava.ready.then(async (st) => {
        if (st && st.open === false && !st.admin) return;
        if (!window.firebase || !firebase.database || !window.DB_ROOT) return;
        try { if (firebase.auth && !firebase.auth().currentUser) await firebase.auth().signInAnonymously(); } catch (e) {}
        const db = firebase.database(), raiz = window.DB_ROOT;
        db.ref(raiz + '/ao-vivo/ajustes').on('value', (s) => aplicarAjustesAoVivo(s.val()), () => {});
        let visto;
        db.ref(raiz + '/ao-vivo/comando').on('value', (s) => {
          const c = s.val(), id = c && c.id;
          if (visto === undefined) { visto = id || null; return; }   // comando antigo: ignora
          if (!c || id === visto) return;
          visto = id;
          if (c.tipo === 'ir') { location.hash = 'ir=' + (c.estado || 'pergunta') + '-' + (c.r | 0) + '-' + (c.p | 0); location.reload(); }
          else if (c.tipo === 'reset') { apagarSalvos(false); irRecarregando('menu-0-0'); }
          else if (c.tipo === 'limparTudo') { apagarSalvos(true); irRecarregando('menu-0-0'); }
          else if (c.tipo === 'zerou') { marcarZerou(); irRecarregando('menu-0-0'); }
          else if (c.tipo === 'avancar') dbgAvancar();
          else if (c.tipo === 'proxima') dbgRodada(1);
          else if (c.tipo === 'anterior') dbgRodada(-1);
          else location.reload();
        }, () => {});
        // presença: o ADM vê em que parte cada um está
        const sid = 'j' + Math.random().toString(36).slice(2, 10), ref = db.ref(raiz + '/jogadores/' + sid);
        try { ref.onDisconnect().remove(); } catch (e) {}
        const desde = Date.now();
        let ult = '', ultT = 0;
        setInterval(() => {
          const R = CFG.rodadas[estado.r];
          const info = { tipo: estado.tipo, r: estado.r, p: estado.p, final: fin ? fin.fase : '', texto: estado.tipo === 'pergunta' && R && R.perguntas[estado.p] ? String(R.perguntas[estado.p].texto).slice(0, 120) : '' };
          const k = JSON.stringify(info);
          if (k === ult && Date.now() - ultT < 15000) return;
          ult = k; ultT = Date.now();
          try { ref.set(Object.assign(info, { desde, quando: firebase.database.ServerValue.TIMESTAMP })).catch(() => {}); } catch (e) {}
        }, 1000);
      }).catch(() => {});
    })();
  }

  // ======================================================================
  // TELA DE CARREGAMENTO: carrega todas as imagens e sons antes de começar
  // ======================================================================
  function precarregar(fim) {
    const C = Object.assign({ ativo: true, texto: 'CARREGANDO', cor: '#ffffff', fundo: '#000000', minimo: 0.6 }, CFG.carregamento || {});
    if (!C.ativo) { fim(); return; }
    const ehSom = (u) => /^data:audio\//i.test(u) || /\.(mp3|wav|ogg|oga|m4a|aac|webm|opus|flac)([?#]|$)/i.test(u);
    // tudo o que o jogo usa (todas as reações, fundos, itens, cartões, final, sons…); o que não é usado fica de fora
    const json = JSON.stringify(CFG);
    const urls = Array.from(new Set(Object.keys(ASSETS || {}).filter((id) => json.indexOf('"' + id + '"') >= 0).map((id) => ASSETS[id]).filter((u) => typeof u === 'string' && u)));
    const tarefas = urls.map((u) => ehSom(u)
      ? () => (window.MotorSom ? MotorSom.decodificar(u) : fetch(u))
      : () => prepararImg(null, u));
    if (window.MotorSom && MotorSom.tipos) MotorSom.tipos.forEach((t) => tarefas.push(() => MotorSom.buffer(t)));
    if (document.fonts && document.fonts.ready) tarefas.push(() => Promise.race([document.fonts.ready, new Promise((ok) => setTimeout(ok, 4000))]));
    const total = tarefas.length, t0 = performance.now();
    let feitos = 0, i = 0, acabou = false, tela = null, barras = null, pct = null;
    const N = 12;
    const desenhar = () => {
      if (!tela) return;
      const f = total ? feitos / total : 1, on = Math.round(f * N);
      barras.textContent = '▮'.repeat(on) + '▯'.repeat(N - on);
      pct.textContent = Math.round(f * 100) + '%';
    };
    // só aparece se demorar (no 2º acesso quase sempre já está tudo pronto)
    const tMostrar = setTimeout(() => {
      tela = document.createElement('div'); tela.id = 'carregando';
      tela.style.background = C.fundo; tela.style.color = C.cor;
      tela.innerHTML = '<div class="cg-caixa"><div class="cg-txt"></div><div class="cg-barras"></div><div class="cg-pct"></div></div><div class="cg-linhas"></div>';
      tela.querySelector('.cg-txt').textContent = String(C.texto || '');
      barras = tela.querySelector('.cg-barras'); pct = tela.querySelector('.cg-pct');
      document.body.appendChild(tela); desenhar();
    }, 200);
    const acabar = () => {
      if (acabou) return; acabou = true; clearTimeout(tMostrar); clearTimeout(tLimite);
      if (!tela) { fim(); return; }
      desenhar();
      const resta = Math.max(0, (+C.minimo || 0) * 1000 - (performance.now() - t0));
      setTimeout(() => { fim(); tela.classList.add('saindo'); setTimeout(() => tela.remove(), 700); }, resta);
    };
    const tLimite = setTimeout(acabar, 40000); // nunca trava o jogo
    const prox = () => {
      if (i >= total) return;
      const f = tarefas[i++];
      Promise.resolve().then(f).catch(() => {}).then(() => { feitos++; desenhar(); if (feitos >= total) acabar(); else prox(); });
    };
    if (!total) acabar();
    for (let k = 0; k < Math.min(6, total); k++) prox();
  }

  // ======================================================================
  // DEBUG (F2): pular pergunta/rodada, ir pro final, menu, resetar
  // ======================================================================
  let dbgEl = null, dbgInfo = null, dbgTimer = 0;
  function rodadaFinal() { const l = CFG.rodadas.map((R, i) => (R.tipo === 'revelacao' ? i : -1)).filter((i) => i >= 0); return l.length ? l[l.length - 1] : CFG.rodadas.length - 1; }
  function apagarSalvos(tudo) {
    zeradas = 0; estrelaNova = false; modoContinuar = false;
    try {
      localStorage.removeItem(CHAVE_ZEROU);
      if (tudo) { localStorage.removeItem(CHAVE_VOL); volJogador = null; if (actx && window.MotorSom) MotorSom.volume(actx, volumeAtual()); desenharVolume(); }
    } catch (e) {}
  }
  function irRecarregando(alvo) {
    if (location.protocol === 'about:') { // ▶ Testar do editor: não dá pra recarregar, faz na hora
      const [t, r, p] = alvo.split('-');
      if (t === 'menu') dbgMenu(true); else if (t === 'final') dbgFinal(); else dbgIr(+r, +p);
      return;
    }
    location.hash = 'ir=' + alvo; location.reload();
  }
  // para tudo o que estava acontecendo (timers, apresentação, final) antes de pular
  function dbgParar() {
    epoca++;
    ocupado = false; introAtiva = false; aoSairIntro = null;
    try { sumirAtmoIntro(); } catch (e) {}
    pararIntro(); pararFinal();
    transicao.style.transition = 'none'; transicao.style.opacity = '0';
    respostas.classList.remove('disabled');
    elRes.classList.remove('carregando', 'aparecendo');
    listaEl.style.transition = ''; listaEl.style.background = ''; listaTit.style.opacity = ''; listaTit.style.transition = '';
    try { montarLista(); } catch (e) {}
  }
  function dbgIr(r, p, tipo) {
    if (!CFG.rodadas[r]) return;
    dbgParar();
    if (tipo === 'fim' || tipo === 'continuar') { esconderMenu(); mostrarEstatico({ tipo, r, p: 0 }); }
    else iniciarJogo(r, p || 0);
    dbgAtualizar();
  }
  function dbgMenu(aviso) {
    dbgParar();
    if (aviso) avisoVisto = false;
    if (CFG.menu && CFG.menu.ativo) { aplicarMenu(); mostrarMenu(); } else iniciarJogo(0, 0);
    dbgAtualizar();
  }
  function dbgFinal() { dbgParar(); esconderMenu(); iniciarPrevia({ qual: 'final', r: rodadaFinal() }); dbgAtualizar(); }
  function dbgRodada(d) {
    if (estado.tipo === 'menu') { dbgIr(0, 0); return; }
    const r = Math.max(0, Math.min(CFG.rodadas.length - 1, (estado.r || 0) + d));
    dbgIr(r, 0);
  }
  // avança um passo, como se tivesse clicado
  function dbgAvancar() {
    if (fin && fin.fase === 'falas') { cliqueFala(); return; }
    if (estado.tipo === 'menu') { dbgIr(0, 0); return; }
    if (introAtiva) { dbgIr(estado.r, estado.p); return; }
    if (ocupado) { // no meio de uma animação: pula direto pro próximo ponto
      if (estado.tipo === 'pergunta') { const R = CFG.rodadas[estado.r]; if (R && estado.p + 1 < R.perguntas.length) dbgIr(estado.r, estado.p + 1); else dbgIr(estado.r, 0, 'fim'); }
      return;
    }
    if (estado.tipo === 'pergunta') responder();
    else if (estado.tipo === 'fim' || estado.tipo === 'continuar') clicarCartao();
  }
  function nomeEstado() {
    if (!CFG) return '';
    if (estado.tipo === 'menu') return '🏠 Menu';
    const R = CFG.rodadas[estado.r]; if (!R) return '';
    const nome = R.tipo === 'revelacao' ? '★ final' : (R.resultado && R.resultado.nome) || '';
    let t = 'Rodada ' + (estado.r + 1) + ' (' + nome + ')';
    if (introAtiva) t += ' · apresentação da lista';
    else if (estado.tipo === 'pergunta') t += ' · pergunta ' + (estado.p + 1) + '/' + R.perguntas.length;
    else if (estado.tipo === 'fim') t += fin ? ' · final: ' + (fin.fase || '') : ' · palpite';
    else if (estado.tipo === 'continuar') t += ' · continuar';
    return t + (zeradas > 0 ? ' · ⭐ zerado ' + zeradas + 'x' : '');
  }
  function dbgAtualizar() { if (dbgInfo) dbgInfo.textContent = nomeEstado(); }
  function instalarDebug() {
    if (MODO === 'editor') return;
    addEventListener('keydown', (e) => {
      if (e.key !== 'F2') return;
      if (CFG.debug && CFG.debug.ativo === false) return;
      e.preventDefault(); e.stopPropagation();
      if (dbgEl) { fecharDebug(); return; }
      abrirDebug();
    }, true);
  }
  function fecharDebug() { if (dbgEl) dbgEl.remove(); dbgEl = null; dbgInfo = null; clearInterval(dbgTimer); }
  function abrirDebug() {
    const d = document.createElement('div'); d.id = 'dbg';
    const b = (txt, fn, cls, tit) => { const x = document.createElement('button'); x.textContent = txt; if (cls) x.className = cls; if (tit) x.title = tit; x.addEventListener('click', (e) => { e.stopPropagation(); fn(); x.blur(); }); return x; };
    const linha = (...els) => { const l = document.createElement('div'); l.className = 'dbg-l'; els.forEach((e) => l.appendChild(e)); return l; };
    const tit = document.createElement('div'); tit.className = 'dbg-t'; tit.textContent = '🐞 DEBUG'; const fx = b('✕', fecharDebug, 'dbg-x', 'Fechar (F2)'); tit.appendChild(fx);
    dbgInfo = document.createElement('div'); dbgInfo.className = 'dbg-info';
    const sel = document.createElement('select');
    const op = (v, t) => { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); };
    op('', 'Ir para…');
    CFG.rodadas.forEach((R, r) => {
      const nome = R.tipo === 'revelacao' ? '★ final' : (R.resultado && R.resultado.nome) || '';
      R.perguntas.forEach((q, p) => op('pergunta-' + r + '-' + p, 'R' + (r + 1) + ' · ' + (p + 1) + '. ' + String(q.texto || '').replace(/\\n/g, ' ').slice(0, 48)));
      if (R.tipo === 'resultado') { op('fim-' + r + '-0', 'R' + (r + 1) + ' · palpite (' + nome + ')'); if (R.continuar && R.continuar.ativo) op('continuar-' + r + '-0', 'R' + (r + 1) + ' · continuar'); }
    });
    sel.addEventListener('change', () => { const v = sel.value.split('-'); if (v.length === 3) dbgIr(+v[1], +v[2], v[0]); sel.value = ''; sel.blur(); });
    const rods = document.createElement('div'); rods.className = 'dbg-l dbg-rods';
    CFG.rodadas.forEach((R, r) => rods.appendChild(b(String(r + 1) + (R.tipo === 'revelacao' ? '★' : ''), () => dbgIr(r, 0), '', 'Começo da rodada ' + (r + 1) + (R.tipo === 'revelacao' ? ' (final)' : ' — ' + ((R.resultado && R.resultado.nome) || '')))));
    d.append(tit, dbgInfo,
      linha(b('⏭ Avançar', dbgAvancar, 'dbg-p', 'Próxima pergunta / passa o palpite / passa a fala'), b('⏮ Rodada', () => dbgRodada(-1), '', 'Volta pra rodada anterior'), b('⏩ Próxima rodada', () => dbgRodada(1), 'dbg-p', 'Pula pra próxima fase')),
      (() => { const l = document.createElement('div'); l.className = 'dbg-s'; l.textContent = 'Rodadas:'; return l; })(), rods,
      linha(sel),
      linha(b('💀 Ver o final agora', dbgFinal), b('🏠 Menu', () => dbgMenu(false))),
      (() => { const l = document.createElement('div'); l.className = 'dbg-s'; l.textContent = 'Salvo neste navegador:'; return l; })(),
      linha(b('⭐ Fingir que zerou', () => { marcarZerou(); aplicarEstrelas(); if (estado.tipo === 'menu') dbgMenu(false); dbgAtualizar(); }, '', 'Libera o Continuar e as estrelas'),
        b('🔄 Resetar o jogo', () => { apagarSalvos(false); dbgMenu(true); }, 'dbg-perigo', 'Apaga estrelas/Continuar e volta pro menu como na 1ª vez')),
      linha(b('🧹 Limpar tudo (progresso + volume)', () => { apagarSalvos(true); dbgMenu(true); }, 'dbg-perigo')),
      (() => { const l = document.createElement('div'); l.className = 'dbg-s'; l.textContent = 'F2 abre/fecha · só você vê isto'; return l; })());
    ['pointerdown', 'click', 'wheel', 'keydown'].forEach((ev) => d.addEventListener(ev, (e) => e.stopPropagation()));
    document.body.appendChild(d);
    dbgEl = d; dbgAtualizar();
    dbgTimer = setInterval(dbgAtualizar, 400);
  }

  // ---------------- EDITOR ----------------
  function alvo(id, editar) {
    if (!id) return null;
    if (id.indexOf('efimg:') === 0) { const a = ativos.find((x) => x.tipo === 'imagem' && x.saindo == null), im = a && Array.isArray(a.c.imagens) ? a.c.imagens[+id.slice(6)] || null : null; return im && im.tela ? (im.ajuste || (im.ajuste = {})) : im; }
    if (id === 'personagem') {
      if (estado.tipo === 'menu' && editar && CFG.menu && !CFG.menu.personagem) CFG.menu.personagem = JSON.parse(JSON.stringify(CFG.personagem));
      return persAtual();
    }
    if (id === 'painel') return painelAtual();
    if (id === 'resultado') return CFG.resultado;
    if (id === 'menu-fundo') return CFG.menu.fundo.modo === 'cor' ? null : ajusteMenu(editar);
    if (id === 'fundo') {
      if (estado.tipo === 'menu') return null;
      return origemFundo(estado).aj;
    }
    if (id === 'menu-titulo') return CFG.menu.titulo;
    if (id === 'menu-botao') return CFG.menu.botao;
    if (id === 'menu-opcoes') return CFG.menu.listaOp;
    if (id === 'menu-rodape') return CFG.menu.rodape;
    if (id === 'menu-figura') return CFG.menu.figura;
    if (id === 'menu-volume') return CFG.menu.volume;
    if (id === 'menu-estrelas') return CFG.menu.estrelas;
    if (id === 'lista') return CFG.lista;
    if (id === 'lista-intro') return CFG.lista.intro;
    if (id === 'intro-texto') return CFG.lista.intro.texto;
    if (id.indexOf('item:') === 0) { const R = CFG.rodadas[+id.slice(5)]; return R && R.item ? R.item : null; }
    if (id.indexOf('zona:') === 0) { const R = CFG.rodadas[+id.slice(5)]; return R && R.item && R.item.zona && R.item.zona.modo === 'livre' ? R.item.zona : null; }
    const R = CFG.rodadas[estado.r];
    if (id === 'foto') return R ? (editar ? fotoParaEditar(R, estado.tipo) : fotoDe(R, estado.tipo)) : null;
    if (id === 'revelacao') return R ? R.revelacao : null;
    if (id === 'revelacao2') return R && R.tipo === 'revelacao' && R.revelacao.imagem2 ? img2Propria(R.revelacao) : null;
    if (id === 'falas') return R && R.tipo === 'revelacao' ? R.revelacao : null;
    if (id === 'ataque') return R && R.tipo === 'revelacao' ? R.revelacao.ataque : null;
    if (id.indexOf('extra:') === 0) { const x = (CFG.extras || []).find((x) => x.id === id.slice(6)) || null; return x && x.tela ? (x.ajuste || (x.ajuste = {})) : x; }
    return null;
  }
  function marcarSelecao() {
    document.querySelectorAll('.selecionado').forEach((e) => e.classList.remove('selecionado'));
    desenharZona();
    if (MODO === 'editor' && finEstatico && ataqueEl.style.display !== 'none') { const sel = selecionado === 'ataque'; ataqueEl.style.opacity = sel ? '0.95' : '0.45'; ataqueEl.classList.toggle('nao-clica', !sel); }
    if (MODO !== 'editor' || !selecionado) return;
    const e = palco.querySelector('[data-el="' + CSS.escape(selecionado) + '"]');
    if (e) e.classList.add('selecionado');
  }
  function enviar(m) { try { parent.postMessage(m, '*'); } catch (e) {} }
  function redesenharFundo(id, o) {
    if (id === 'menu-fundo') { if (CFG.menu.fundo.modo === 'imagem') aplicarAjuste(menuImg, o); else { fundoFrente.style.transition = 'none'; aplicarAjuste(fundoFrente, o); } }
    else { fundoFrente.style.transition = 'none'; aplicarAjuste(fundoFrente, o); escurecerPara(o, 0); }
    fundoAjChave = null;
  }
  function chavesDe(id) { return id === 'foto' ? ['offX', 'offY'] : id === 'falas' ? ['falaX', 'falaY'] : ['x', 'y']; }
  let guiaV = null, guiaH = null;
  function guias(v, h) {
    if (!guiaV) {
      guiaV = document.createElement('div'); guiaV.className = 'guia'; guiaV.id = 'guia-v';
      guiaH = document.createElement('div'); guiaH.className = 'guia'; guiaH.id = 'guia-h';
      palco.append(guiaV, guiaH);
    }
    guiaV.style.display = v ? 'block' : 'none';
    guiaH.style.display = h ? 'block' : 'none';
  }

  let ultimoPulo = 0, verImg2 = false, verAviso = false;
  function iniciarEditor() {
    document.body.classList.add('modo-editor');
    addEventListener('message', (ev) => {
      const m = ev.data || {};
      if (m.tipo === 'reiniciarFx') {
        const ag = performance.now();
        tPergunta = tRodada = tSerie = tCartao = tMenu = ag;
        efImgEls.forEach((e) => e.remove()); efImgEls.clear();
        ativos = []; atualizarEfeitos(false, true);
        return;
      }
      if (m.tipo !== 'atualizar') return;
      if (m.assets) { ASSETS = m.assets; NOMES = m.nomes || {}; fundoUrl = null; }
      if (m.config) { CFG = m.config; aplicarEstilos(); }
      if ('selecionado' in m) selecionado = m.selecionado;
      if (m.ignorar) ignorar = m.ignorar;
      if ('img2' in m) verImg2 = !!m.img2;
      if ('aviso' in m) verAviso = !!m.aviso;
      if ('trava' in m) travaSel = !!m.trava;
      if (m.pulo && m.pulo !== ultimoPulo) { ultimoPulo = m.pulo; setTimeout(() => animarPulo(null), 30); }
      if ('fx' in m && m.fx !== fxPreview) { fxPreview = !!m.fx; itensVivos.forEach((v) => v.el.remove()); itensVivos.clear(); }
      mostrarEstatico(m.estado || estado);
    });

    let arr = null, pend = {}, pendId = null, tmr = null, travaSel = true;
    const flush = () => { if (pendId) enviar({ tipo: 'alterar', el: pendId, r: estado.r, t: estado.tipo, p: estado.p, props: pend }); pend = {}; pendId = null; };
    const postar = (id, props) => {
      if (pendId && pendId !== id) { clearTimeout(tmr); flush(); }
      pendId = id; Object.assign(pend, props);
      clearTimeout(tmr); tmr = setTimeout(flush, 180);
    };
    const selecionar = (id) => {
      if (selecionado === id) return;
      selecionado = id; marcarSelecao(); enviar({ tipo: 'selecionar', el: id });
    };

    palco.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const alvoEl = e.target.closest('[data-el]');
      const id = alvoEl ? alvoEl.dataset.el : (estado.tipo === 'menu' ? 'menu-fundo' : 'fundo');
      const eraFundo = !alvoEl && selecionado === id, jaSel = selecionado === id;
      selecionado = id; marcarSelecao(); enviar({ tipo: 'selecionar', el: id });
      if (!alvoEl && !eraFundo) return;
      if (travaSel && !jaSel) { e.preventDefault(); return; } // 🔒 1º clique só seleciona; arrasta só o que já está selecionado   // 1º clique no fundo só seleciona; com ele selecionado, arrasta
      const o = alvo(id);
      if (!o) return;
      e.preventDefault();
      const foto = id === 'foto', ch = chavesDe(id);
      arr = { id: id, o: o, kx: ch[0], ky: ch[1], sx: e.clientX, sy: e.clientY, mov: false };
      arr.ox = o[arr.kx] == null ? (id === 'falas' ? 960 : 0) : o[arr.kx]; arr.oy = o[arr.ky] == null ? 0 : o[arr.ky];
      arr.f = foto ? escala * (CFG.resultado.escala || 1) : escala;
      palco.setPointerCapture(e.pointerId);
    });
    palco.addEventListener('pointermove', (e) => {
      if (!arr) return;
      const dx = (e.clientX - arr.sx) / arr.f, dy = (e.clientY - arr.sy) / arr.f;
      if (!arr.mov && Math.abs(dx) + Math.abs(dy) < 2) return;
      if (!arr.mov) arr.o = alvo(arr.id, true);
      arr.mov = true;
      let mx = dx, my = dy;
      // Shift = arrasta só na reta (horizontal ou vertical)
      if (e.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) my = 0; else mx = 0; }
      let nx = Math.round(arr.ox + mx), ny = Math.round(arr.oy + my);
      // ímã no centro da tela (Alt = sem ímã)
      let gv = false, gh = false;
      if (!e.altKey && arr.id !== 'foto') {
        if (Math.abs(nx - 960) <= 12) { nx = 960; gv = true; }
        if (arr.id !== 'falas' && Math.abs(ny - 540) <= 12) { ny = 540; gh = true; }
      }
      guias(gv, gh);
      arr.o[arr.kx] = nx;
      arr.o[arr.ky] = ny;
      if (arr.id === 'falas') estiloFalas(arr.o);
      else if (arr.id === 'fundo' || arr.id === 'menu-fundo') redesenharFundo(arr.id, arr.o);
      else if (arr.id === 'ataque') estiloAtaque(arr.o, dadosAtaque(arr.o).golpe);
      else aplicarPosicoes();
    });
    const soltar = () => {
      guias(false, false);
      if (arr && arr.mov) {
        const props = {}; props[arr.kx] = arr.o[arr.kx]; props[arr.ky] = arr.o[arr.ky];
        enviar({ tipo: 'alterar', el: arr.id, r: estado.r, t: estado.tipo, p: estado.p, props: props });
      }
      arr = null;
    };
    palco.addEventListener('pointerup', soltar);
    palco.addEventListener('pointercancel', soltar);

    palco.addEventListener('wheel', (e) => {
      const alvoEl = e.target.closest('[data-el]');
      const idF = estado.tipo === 'menu' ? 'menu-fundo' : 'fundo';
      if (!alvoEl && selecionado !== idF) return;
      const id = alvoEl ? alvoEl.dataset.el : idF, o = alvo(id, true);
      if (!o) return;
      if (travaSel && selecionado !== id) return; // 🔒 roda do mouse só mexe no selecionado
      e.preventDefault();
      selecionar(id);
      if (id === 'falas') {
        if (e.altKey) return;
        const dd = (e.deltaY || e.deltaX) < 0 ? 1 : -1;
        o.falaTamanho = Math.min(200, Math.max(10, Math.round((o.falaTamanho || 54) + dd * (e.shiftKey ? 1 : 3))));
        estiloFalas(o); postar(id, { falaTamanho: o.falaTamanho });
        return;
      }
      const d = e.deltaY || e.deltaX;
      const dir = d < 0 ? 1 : -1;
      const props = {};
      const ehFundo = id === 'fundo' || id === 'menu-fundo';
      if (id === 'ataque') {
        if (e.altKey) { o.rotacao = Math.round(((o.rotacao || 0) + ((e.deltaY || e.deltaX) < 0 ? 1 : -1) * (e.shiftKey ? 1 : 5)) * 10) / 10; estiloAtaque(o, dadosAtaque(o).golpe); postar(id, { rotacao: o.rotacao }); return; }
        const f = (e.deltaY || e.deltaX) < 0 ? (e.shiftKey ? 1.01 : 1.05) : 1 / (e.shiftKey ? 1.01 : 1.05);
        o.altura = Math.round(Math.max(40, Math.min(3000, (o.altura || 760) * f)));
        estiloAtaque(o, dadosAtaque(o).golpe); postar(id, { altura: o.altura });
        return;
      }
      if (id.indexOf('zona:') === 0) {
        const f = (e.deltaY || e.deltaX) < 0 ? (e.shiftKey ? 1.01 : 1.05) : 1 / (e.shiftKey ? 1.01 : 1.05);
        o.w = Math.round(Math.max(40, o.w * f)); o.h = Math.round(Math.max(40, o.h * f));
        desenharZona(); postar(id, { w: o.w, h: o.h });
        return;
      }
      if (e.altKey) {
        o.rotacao = Math.round(((o.rotacao || 0) + dir * (e.shiftKey ? 1 : 5)) * 10) / 10;
        props.rotacao = o.rotacao;
      } else {
        const k = id === 'foto' || ehFundo || ((id.indexOf('extra:') === 0 || id.indexOf('efimg:') === 0) && !('largura' in o)) ? 'zoom' : 'escala';
        const passo = e.shiftKey ? 1.01 : 1.05;
        const atual = o[k] == null ? 1 : o[k];
        o[k] = Math.round(Math.min(20, Math.max(0.05, atual * (dir > 0 ? passo : 1 / passo))) * 1000) / 1000;
        props[k] = o[k];
      }
      if (ehFundo) redesenharFundo(id, o); else aplicarPosicoes();
      postar(id, props);
    }, { passive: false });

    addEventListener('keydown', (e) => {
      enviar({ tipo: 'tecla', key: e.key, shift: e.shiftKey, ctrl: e.ctrlKey || e.metaKey });
      if (e.key.indexOf('Arrow') === 0 || ((e.ctrlKey || e.metaKey) && /^[zys]$/i.test(e.key))) e.preventDefault();
    });
    addEventListener('dragover', (e) => e.preventDefault());
    addEventListener('drop', (e) => {
      e.preventDefault();
      const t = e.target && e.target.closest ? e.target.closest('[data-el]') : null;
      const arquivos = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
      if (arquivos.length) enviar({ tipo: 'soltar', el: t ? t.dataset.el : 'fundo', arquivos: arquivos });
    });
    enviar({ tipo: 'pronto' });
  }

  // ---------------- PRÉVIAS (botões ▶ Prévia do editor) ----------------
  function iniciarPrevia(ini) {
    if (ini.qual === 'menuItens') { avisoVisto = true; mostrarMenu(); agendarJogo(() => comecar(), 1200); return; }
    const r = ini.r != null ? ini.r : CFG.rodadas.map((R, i) => (R.tipo === 'revelacao' ? i : -1)).filter((i) => i >= 0).pop();
    const R = CFG.rodadas[r]; if (!R) return;
    iniciarJogo(r, Math.max(0, R.perguntas.length - 1));
    // tudo achado até aqui (como se tivesse jogado)
    agendarJogo(() => {
      if (R.tipo !== 'revelacao' || R.revelacao.estilo !== 'sombrio') { revelar(R); return; }
      if (ini.qual === 'final') { revelar(R); return; }
      // do ataque em diante: já no escuro, falas acabadas
      marcarAchado(r, false);
      revelarSombrio(R);
      const rv = R.revelacao, T2 = (rv.tempoPreto || 0) + (rv.espera || 0);
      fin.lista = null; fin.extraLista = 0; fin.t0 = performance.now() - (T2 + 1) * 1000;
      preto.style.transition = 'none'; preto.style.opacity = '1'; vis(listaEl, false);
      vis(elPainel, false); vis(elRes, false); vis(elPers, false);
      estado = { tipo: 'fim', r, p: 0 }; aplicarPosicoes(); preencherRevelacao(R);
      vis(elRev, true); revImg.style.transition = 'none'; revImg.style.opacity = rv.someAposFalas ? '0' : '1';
      const t = T2 + 1;
      if (rv.ataque && rv.ataque.ativo) { fin.fase = 'antesAtaque'; fin.tA = t + 0.6; }
      else if (img2De(rv)) { fin.fase = 'antesImg2'; fin.tA = t + 0.6; }
      else { fin.fase = 'antesBug'; fin.tBi = t + 0.6; }
    }, 500);
  }

  // ---------------- INÍCIO ----------------
  addEventListener('resize', ajustarPalco);
  ajustarPalco();
  $('btn-sim').addEventListener('click', clicarCartao);
  $('btn-nao').addEventListener('click', clicarCartao);
  mb.addEventListener('click', comecar);

  if (MODO === 'editor') {
    if (CFG) { aplicarEstilos(); mostrarEstatico(estado); }
    iniciarEditor();
  } else if (CFG) {
    aplicarEstilos();
    instalarDebug();
    precarregar(bootJogo);
  }
  function bootJogo() {
    let ini = window.GAME_START;
    // o ADM ao vivo pode mandar todo mundo pra um ponto do jogo (#ir=tipo-rodada-pergunta)
    const mh = MODO !== 'editor' && /ir=([a-z]+)-(\d+)-(\d+)/.exec(location.hash || '');
    if (mh) { ini = mh[1] === 'menu' ? 0 : mh[1] === 'intro' ? { tipo: 'intro', r: 0, p: 0 } : mh[1] === 'final' ? { tipo: 'previa', qual: 'final', r: rodadaFinal() } : { tipo: mh[1], r: +mh[2], p: +mh[3] }; try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
    iniciarAoVivo();
    if (ini && typeof ini === 'object' && ini.tipo === 'previa') iniciarPrevia(ini);
    else if (ini && typeof ini === 'object' && (ini.tipo === 'fim' || ini.tipo === 'continuar') && CFG.rodadas[ini.r]) mostrarEstatico({ tipo: ini.tipo, r: ini.r, p: 0 });
    else if (ini && typeof ini === 'object' && ini.tipo === 'intro') { iniciarJogo(0, 0); mostrarIntro(() => {}); }
    else if (ini && typeof ini === 'object') iniciarJogo(ini.r || 0, ini.p || 0);
    else if (!ini && CFG.menu && CFG.menu.ativo) mostrarMenu();
    else { iniciarJogo(ini || 0, 0); if (!ini) mostrarIntro(() => {}); }
    if (window.parent !== window) {
      addEventListener('keydown', (e) => { if (e.key === 'Escape' && !dbgEl) enviar({ tipo: 'esc' }); });
    }
  }
})();
