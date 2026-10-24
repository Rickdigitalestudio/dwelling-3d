// ============================================================================
// Mundo 3D — cidade procedural + carrossel de empreendimentos + showroom
// Todas as texturas usam as FOTOS ORIGINAIS baixadas do site de origem.
// ============================================================================

import * as THREE from "three";
import { EMPREENDIMENTOS, ICONES_LAZER, ICONES_DIFERENCIAIS } from "./data.js";

/* ---------------------------------------------------------------- utilidades */

const COR_OURO = "#cc9933";
const COR_OURO_CLARO = "#e8c479";

function corDeStatus(status) {
  return status === "Lançamento" ? "#f0b429" : "#b48bff";
}
function corDeConstrutora(c) {
  return c === "Econ" ? "#37d3a4" : "#5b9dff";
}

function novoCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function texturaDeCanvas(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Desenha a imagem cobrindo toda a área (crop centralizado). */
function desenharCobertura(ctx, img, x, y, w, h) {
  if (!img || !img.width) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#1b1d22");
    g.addColorStop(1, "#2b2417");
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    return;
  }
  const r = Math.max(w / img.width, h / img.height);
  const nw = img.width * r;
  const nh = img.height * r;
  ctx.drawImage(img, x + (w - nw) / 2, y + (h - nh) / 2, nw, nh);
}

function quebrarTexto(ctx, texto, larguraMax) {
  const palavras = String(texto).split(" ");
  const linhas = [];
  let atual = "";
  for (const p of palavras) {
    const teste = atual ? atual + " " + p : p;
    if (ctx.measureText(teste).width > larguraMax && atual) {
      linhas.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function arredondar(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Gerador pseudoaleatório determinístico (mesmo empreendimento = mesma torre). */
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function () {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------- texturas 2D */

function desenharCartao(prop, img) {
  const W = 660;
  const H = 860;
  const c = novoCanvas(W, H);
  const ctx = c.getContext("2d");

  ctx.save();
  arredondar(ctx, 4, 4, W - 8, H - 8, 40);
  ctx.clip();

  // foto original
  desenharCobertura(ctx, img, 0, 0, W, H);

  // escurecimento inferior + topo
  let g = ctx.createLinearGradient(0, H * 0.34, 0, H);
  g.addColorStop(0, "rgba(8,8,10,0)");
  g.addColorStop(0.55, "rgba(8,8,10,0.82)");
  g.addColorStop(1, "rgba(6,6,8,0.97)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.3, W, H * 0.7);

  g = ctx.createLinearGradient(0, 0, 0, 170);
  g.addColorStop(0, "rgba(6,6,8,0.72)");
  g.addColorStop(1, "rgba(6,6,8,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, 170);

  // badge de status (superior esquerdo)
  const corStatus = corDeStatus(prop.status);
  ctx.font = "700 24px Inter, Segoe UI, sans-serif";
  const largStatus = ctx.measureText(prop.status).width + 54;
  ctx.fillStyle = "rgba(8,8,10,0.72)";
  arredondar(ctx, 30, 30, largStatus, 50, 25);
  ctx.fill();
  ctx.strokeStyle = corStatus;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = corStatus;
  ctx.beginPath();
  ctx.arc(54, 55, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4f1ea";
  ctx.fillText(prop.status, 70, 64);

  // construtora (superior direito)
  const corConst = corDeConstrutora(prop.construtora);
  ctx.font = "700 24px Inter, Segoe UI, sans-serif";
  const largConst = ctx.measureText(prop.construtora).width + 40;
  ctx.fillStyle = "rgba(8,8,10,0.72)";
  arredondar(ctx, W - 30 - largConst, 30, largConst, 50, 25);
  ctx.fill();
  ctx.strokeStyle = corConst;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = corConst;
  ctx.fillText(prop.construtora, W - 30 - largConst + 20, 64);

  // título
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px Inter, Segoe UI, sans-serif";
  const linhasTitulo = quebrarTexto(ctx, prop.titulo, W - 76);
  let y = H - 300;
  linhasTitulo.slice(0, 2).forEach((l) => {
    ctx.fillText(l, 38, y);
    y += 58;
  });

  // slogan
  ctx.fillStyle = COR_OURO_CLARO;
  ctx.font = "500 27px Inter, Segoe UI, sans-serif";
  const linhasSlogan = quebrarTexto(ctx, prop.slogan, W - 76);
  y += 6;
  linhasSlogan.slice(0, 2).forEach((l) => {
    ctx.fillText(l, 38, y);
    y += 36;
  });

  // régua
  y += 14;
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(38, y);
  ctx.lineTo(W - 38, y);
  ctx.stroke();

  // zona / tipologia
  y += 36;
  ctx.fillStyle = "rgba(244,241,234,0.72)";
  ctx.font = "600 24px Inter, Segoe UI, sans-serif";
  ctx.fillText(`${prop.zona}  •  ${prop.bairro}`, 38, y);
  y += 34;
  ctx.fillStyle = "rgba(244,241,234,0.5)";
  ctx.font = "500 23px Inter, Segoe UI, sans-serif";
  ctx.fillText(prop.tipologia, 38, y);

  // chamada
  y += 46;
  ctx.fillStyle = COR_OURO;
  ctx.font = "700 23px Inter, Segoe UI, sans-serif";
  ctx.fillText("Clique para explorar em 3D  →", 38, y);

  ctx.restore();

  // borda
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 4;
  arredondar(ctx, 5, 5, W - 10, H - 10, 39);
  ctx.stroke();

  return c;
}

function desenharVerso() {
  const W = 660;
  const H = 860;
  const c = novoCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.save();
  arredondar(ctx, 4, 4, W - 8, H - 8, 40);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, "#131313");
  g.addColorStop(1, "#0c0c0c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // malha sutil
  ctx.strokeStyle = "rgba(204,153,51,0.09)";
  ctx.lineWidth = 1;
  for (let i = -H; i < W; i += 46) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + H, H);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(204,153,51,0.5)";
  ctx.lineWidth = 4;
  arredondar(ctx, 5, 5, W - 10, H - 10, 39);
  ctx.stroke();

  // monograma
  ctx.fillStyle = "rgba(204,153,51,0.9)";
  ctx.font = "800 130px Inter, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("D", W / 2, H / 2 + 40);
  ctx.font = "600 26px Inter, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(244,241,234,0.55)";
  ctx.fillText("DWELLING 3D", W / 2, H / 2 + 100);
  ctx.textAlign = "left";
  return c;
}

function desenharPainelFoto(img, indice) {
  const W = 900;
  const H = 600;
  const c = novoCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.save();
  arredondar(ctx, 6, 6, W - 12, H - 12, 26);
  ctx.clip();
  desenharCobertura(ctx, img, 0, 0, W, H);
  const g = ctx.createLinearGradient(0, H - 190, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = g;
  ctx.fillRect(0, H - 190, W, 190);

  ctx.fillStyle = "rgba(204,153,51,0.95)";
  ctx.font = "700 26px Inter, Segoe UI, sans-serif";
  ctx.fillText(`Foto ${indice + 1}`, 30, H - 34);
  ctx.font = "500 24px Inter, Segoe UI, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.textAlign = "right";
  ctx.fillText("clique para ampliar", W - 30, H - 34);
  ctx.textAlign = "left";
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 4;
  arredondar(ctx, 7, 7, W - 14, H - 14, 25);
  ctx.stroke();
  return c;
}

function desenharChip(rotulo, icone, cor) {
  const W = 460;
  const H = 150;
  const c = novoCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.save();
  arredondar(ctx, 8, 8, W - 16, H - 16, 40);
  ctx.clip();
  ctx.fillStyle = "rgba(12,12,12,0.86)";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  ctx.strokeStyle = cor;
  ctx.lineWidth = 4;
  arredondar(ctx, 8, 8, W - 16, H - 16, 40);
  ctx.stroke();

  ctx.font = "56px Segoe UI Emoji, Apple Color Emoji, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(icone, 74, H / 2 + 20);
  ctx.textAlign = "left";

  ctx.fillStyle = "#f4f1ea";
  ctx.font = "700 34px Inter, Segoe UI, sans-serif";
  let linha = rotulo;
  while (ctx.measureText(linha).width > W - 175 && linha.length > 4) linha = linha.slice(0, -2);
  ctx.fillText(linha === rotulo ? linha : linha.slice(0, -2) + "…", 130, H / 2 + 13);
  return c;
}

function desenharTitulo(prop) {
  const W = 1400;
  const H = 240;
  const c = novoCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.textAlign = "center";

  ctx.font = "800 96px Inter, Segoe UI, sans-serif";
  let titulo = prop.titulo;
  while (ctx.measureText(titulo).width > W - 60 && titulo.length > 4) titulo = titulo.slice(0, -2);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(titulo === prop.titulo ? titulo : titulo + "…", W / 2, 106);

  ctx.font = "600 44px Inter, Segoe UI, sans-serif";
  ctx.fillStyle = COR_OURO_CLARO;
  ctx.fillText(prop.slogan, W / 2, 176);

  const g = ctx.createLinearGradient(W / 2 - 260, 0, W / 2 + 260, 0);
  g.addColorStop(0, "rgba(204,153,51,0)");
  g.addColorStop(0.5, "rgba(204,153,51,0.95)");
  g.addColorStop(1, "rgba(204,153,51,0)");
  ctx.fillStyle = g;
  ctx.fillRect(W / 2 - 260, 206, 520, 5);
  ctx.textAlign = "left";
  return c;
}

function texturaJanela(variante) {
  const W = 128;
  const H = 256;
  const c = novoCanvas(W, H);
  const ctx = c.getContext("2d");
  const base = ["#111318", "#14161c", "#0f1116"][variante % 3];
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  const rand = semente("janela" + variante);
  const colunas = 8;
  const linhas = 16;
  const cw = W / colunas;
  const ch = H / linhas;
  for (let i = 0; i < colunas; i++) {
    for (let j = 0; j < linhas; j++) {
      const on = rand() > 0.55;
      const quente = rand() > 0.4;
      ctx.fillStyle = on
        ? quente
          ? `rgba(255, ${205 + Math.floor(rand() * 40)}, 150, ${0.55 + rand() * 0.45})`
          : `rgba(170, 215, 255, ${0.4 + rand() * 0.5})`
        : "rgba(255,255,255,0.045)";
      ctx.fillRect(i * cw + 2, j * ch + 3, cw - 4, ch - 6);
    }
  }
  // faixa de piso
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  for (let j = 0; j < linhas; j++) ctx.fillRect(0, j * ch, W, 1);

  const t = texturaDeCanvas(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function texturaCeu() {
  const c = novoCanvas(512, 256);
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#04050a");
  g.addColorStop(0.55, "#070a12");
  g.addColorStop(0.78, "#0d1018");
  g.addColorStop(1, "#1a1710");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  // brilho dourado de horizonte
  const r = ctx.createRadialGradient(256, 200, 4, 256, 200, 210);
  r.addColorStop(0, "rgba(204,153,51,0.34)");
  r.addColorStop(1, "rgba(204,153,51,0)");
  ctx.fillStyle = r;
  ctx.fillRect(0, 0, 512, 256);
  return texturaDeCanvas(c);
}

function texturaBrilho() {
  const c = novoCanvas(256, 256);
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(204,153,51,0.65)");
  g.addColorStop(0.4, "rgba(204,153,51,0.22)");
  g.addColorStop(1, "rgba(204,153,51,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return texturaDeCanvas(c);
}

/* ================================================================= MUNDO */

export class Mundo {
  constructor(canvas, opcoes = {}) {
    this.canvas = canvas;
    this.eventos = {}; // aoSelecionar, aoVoltar, aoFoto, aoPassear
    this.reduzirMovimento = opcoes.reduzirMovimento || false;
    this.mobile = opcoes.mobile || false;

    this.estado = "hero"; // hero | galeria | detalhe
    this.propriedade = null;
    this.filtrados = [...EMPREENDIMENTOS];
    this.cards = [];
    this.hover = null;
    this.arrastando = false;
    this.movimentoTotal = 0;
    this.velRotacao = 0;
    this.rotacao = 0;
    this.rotacaoAlvo = 0;
    this.zoom = 1;
    this.ocioso = 0;
    this.parallax = new THREE.Vector2(0, 0);
    this.parallaxAlvo = new THREE.Vector2(0, 0);
    this.orbitaAz = 0;
    this.orbitaAzAlvo = 0;
    this.orbitaEl = 0.16;
    this.orbitaElAlvo = 0.16;
    this.distDetalhe = 34;
    this.indiceFocado = -1;
    this.relogio = new THREE.Clock();
    this.pausado = false;

    this.imagens = new Map();
    this._raycaster = new THREE.Raycaster();
    this._ponteiro = new THREE.Vector2();
    this._alvosRaycast = [];
  }

  /* ------------------------------------------------------------ inicializar */
  async iniciar(aoProgresso) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.mobile,
      powerPreference: "high-performance",
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.06;

    this.cena = new THREE.Scene();
    this.cena.fog = new THREE.FogExp2(0x07070c, 0.0072);

    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 900);
    this.camera.position.set(0, 22, 96);
    this.mira = new THREE.Vector3(0, 12, 0);
    this.camAlvo = new THREE.Vector3(0, 22, 96);
    this.miraAlvo = new THREE.Vector3(0, 12, 0);

    // preloading das fotos originais
    const lista = [];
    EMPREENDIMENTOS.forEach((p) => p.fotos.forEach((f) => lista.push(f.arquivo)));
    let concluidas = 0;
    await Promise.all(
      lista.map(
        (src) =>
          new Promise((resolver) => {
            const img = new Image();
            img.onload = () => {
              this.imagens.set(src, img);
              concluidas++;
              aoProgresso && aoProgresso(concluidas / lista.length, "Carregando fotos originais…");
              resolver();
            };
            img.onerror = () => {
              concluidas++;
              aoProgresso && aoProgresso(concluidas / lista.length, "Tentando foto alternativa…");
              resolver();
            };
            img.src = src;
          })
      )
    );

    aoProgresso && aoProgresso(0.97, "Construindo a cidade 3D…");
    this._montarAmbiente();
    this._montarCidade();
    this._montarAneis();
    aoProgresso && aoProgresso(1, "Pronto!");

    this._ligarEventos();
    this.laco();
    return this;
  }

  img(arquivo) {
    return this.imagens.get(arquivo) || null;
  }

  /* ------------------------------------------------------------- ambiente */
  _montarAmbiente() {
    // céu
    const ceu = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 20),
      new THREE.MeshBasicMaterial({ map: texturaCeu(), side: THREE.BackSide, fog: false })
    );
    this.cena.add(ceu);

    // luzes
    this.cena.add(new THREE.HemisphereLight(0x8fb6ff, 0x14110b, 0.55));
    const sol = new THREE.DirectionalLight(0xfff0d6, 1.15);
    sol.position.set(46, 70, 34);
    this.cena.add(sol);
    const relogio = new THREE.DirectionalLight(0x7aa2ff, 0.5);
    relogio.position.set(-50, 30, -40);
    this.cena.add(relogio);
    this.luzOuro = new THREE.PointLight(0xcc9933, 60, 90, 2);
    this.luzOuro.position.set(0, 16, 14);
    this.cena.add(this.luzOuro);

    // chão
    const chao = new THREE.Mesh(
      new THREE.CircleGeometry(430, 72),
      new THREE.MeshStandardMaterial({ color: 0x08080b, roughness: 0.95, metalness: 0.05 })
    );
    chao.rotation.x = -Math.PI / 2;
    chao.position.y = -0.02;
    this.cena.add(chao);

    const grade = new THREE.GridHelper(420, 84, 0x2a3140, 0x161b26);
    grade.material.transparent = true;
    grade.material.opacity = 0.5;
    grade.position.y = 0.01;
    this.cena.add(grade);

    // brilho sob o palco
    this.brilho = new THREE.Mesh(
      new THREE.PlaneGeometry(78, 78),
      new THREE.MeshBasicMaterial({
        map: texturaBrilho(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.brilho.rotation.x = -Math.PI / 2;
    this.brilho.position.y = 0.05;
    this.cena.add(this.brilho);

    // estrelas
    const geo = new THREE.BufferGeometry();
    const n = this.mobile ? 700 : 1400;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 220 + Math.random() * 240;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1) * 0.5;
      pos[i * 3] = r * Math.sin(p) * Math.cos(t);
      pos[i * 3 + 1] = Math.abs(r * Math.cos(p)) * 0.55 + 10;
      pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.estrelas = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xffe6b0,
        size: 1.15,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      })
    );
    this.cena.add(this.estrelas);
  }

  /* -------------------------------------------------------------- cidade */
  _montarCidade() {
    const texturas = [texturaJanela(0), texturaJanela(1), texturaJanela(2)];
    const materiais = texturas.map(
      (t) =>
        new THREE.MeshStandardMaterial({
          map: t,
          emissiveMap: t,
          emissive: 0xffffff,
          emissiveIntensity: 0.75,
          color: 0x30343d,
          roughness: 0.88,
          metalness: 0.12,
        })
    );
    const concreto = new THREE.MeshStandardMaterial({ color: 0x171a20, roughness: 0.95 });

    this.cidade = new THREE.Group();
    const rand = semente("cidade-sp");
    const total = this.mobile ? 62 : 108;

    for (let i = 0; i < total; i++) {
      const ang = rand() * Math.PI * 2;
      const raio = 62 + Math.pow(rand(), 0.7) * 165;
      const larg = 7 + rand() * 13;
      const prof = 7 + rand() * 13;
      const alt = 12 + Math.pow(rand(), 1.7) * 82;

      const geo = new THREE.BoxGeometry(larg, alt, prof);
      const uv = geo.attributes.uv;
      const repX = Math.max(1, Math.round(larg / 7));
      const repY = Math.max(1, Math.round(alt / 7));
      for (let k = 0; k < uv.count; k++) {
        uv.setXY(k, uv.getX(k) * repX, uv.getY(k) * repY);
      }
      uv.needsUpdate = true;

      const usaTelhado = rand() > 0.72;
      const mesh = new THREE.Mesh(geo, usaTelhado ? concreto : materiais[Math.floor(rand() * materiais.length)]);
      mesh.position.set(Math.cos(ang) * raio, alt / 2, Math.sin(ang) * raio);
      mesh.rotation.y = rand() * Math.PI;
      this.cidade.add(mesh);

      if (rand() > 0.82) {
        const topo = new THREE.Mesh(new THREE.BoxGeometry(larg * 0.4, 3.4, prof * 0.4), concreto);
        topo.position.set(mesh.position.x, alt + 1.7, mesh.position.z);
        this.cidade.add(topo);
      }
    }

    // torres de destaque (skyline)
    for (let i = 0; i < (this.mobile ? 4 : 7); i++) {
      const ang = (i / 7) * Math.PI * 2 + 0.4;
      const raio = 120 + rand() * 70;
      const larg = 15 + rand() * 10;
      const alt = 105 + rand() * 75;
      const geo = new THREE.BoxGeometry(larg, alt, larg);
      const uv = geo.attributes.uv;
      const rep = Math.round(alt / 7);
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * 2, uv.getY(k) * rep);
      uv.needsUpdate = true;
      const torre = new THREE.Mesh(geo, materiais[i % materiais.length]);
      torre.position.set(Math.cos(ang) * raio, alt / 2, Math.sin(ang) * raio);
      torre.rotation.y = rand();
      this.cidade.add(torre);
    }

    this.cena.add(this.cidade);
  }

  /* -------------------------------------------------------- carrossel 3D */
  _montarAneis() {
    this.grupoAneis = new THREE.Group();
    this.cena.add(this.grupoAneis);

    const versoTex = texturaDeCanvas(desenharVerso());
    this.versoTex = versoTex;

    EMPREENDIMENTOS.forEach((prop, i) => {
      const foto = this.img(prop.fotos[0].arquivo);
      const tex = texturaDeCanvas(desenharCartao(prop, foto));

      const grupo = new THREE.Group();

      const frente = new THREE.Mesh(
        new THREE.PlaneGeometry(7.6, 9.88),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04 })
      );
      frente.userData = { tipo: "card", prop, indice: i };
      grupo.add(frente);

      const verso = new THREE.Mesh(
        new THREE.PlaneGeometry(7.6, 9.88),
        new THREE.MeshBasicMaterial({ map: versoTex, transparent: true, alphaTest: 0.04 })
      );
      verso.rotation.y = Math.PI;
      verso.position.z = -0.03;
      grupo.add(verso);

      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(9.6, 11.9),
        new THREE.MeshBasicMaterial({
          map: this.brilho.material.map,
          color: 0xcc9933,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      halo.position.z = -0.16;
      grupo.add(halo);

      grupo.userData = {
        prop,
        base: new THREE.Vector3(),
        fase: i * 0.77,
        escala: 0,
        escalaAlvo: 0,
        visivel: false,
        frente,
        halo,
        slot: i,
      };

      this.grupoAneis.add(grupo);
      this.cards.push(grupo);
    });

    this._disporAneis(true);
  }

  _disporAneis(imediato = false) {
    const n = Math.max(this.filtrados.length, 1);
    const raio = Math.max(13.5, n * 1.42);
    this.raioAneis = raio;

    // mapeia cada card para um slot (0..k-1) conforme a ordem do filtro
    this.cards.forEach((c) => {
      const pos = this.filtrados.indexOf(c.userData.prop);
      const ativo = pos >= 0;
      c.userData.escalaAlvo = ativo ? 1 : 0;
      if (ativo) {
        c.userData.slot = pos;
        const ang = (pos / n) * Math.PI * 2;
        c.userData.base.set(Math.sin(ang) * raio, 5.4, Math.cos(ang) * raio);
        c.userData.angulo = ang;
        c.userData.visivel = true;
      }
      if (imediato) {
        c.position.copy(c.userData.base);
        c.scale.setScalar(ativo ? 1 : 0.001);
        c.visible = ativo;
        c.userData.escala = ativo ? 1 : 0;
      }
    });

    if (this.estado === "galeria") this._focarSlot(this.indiceFocado >= 0 ? this.indiceFocado : 0, true);
  }

  _focarSlot(slot, suave = true) {
    const alvo = -((slot / Math.max(this.filtrados.length, 1)) * Math.PI * 2);
    // caminho mais curto
    let d = alvo - this.rotacaoAlvo;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    this.rotacaoAlvo = this.rotacaoAlvo + d;
    if (!suave) this.rotacao = this.rotacaoAlvo;
  }

  /* ------------------------------------------------------------ showroom */
  montarDetalhe(prop) {
    this.limparDetalhe();
    this.propriedade = prop;
    const rand = semente(prop.slug);
    const cor = new THREE.Color(corDeConstrutora(prop.construtora));
    const g = new THREE.Group();

    // --- praça / base
    const praca = new THREE.Mesh(
      new THREE.CylinderGeometry(15, 16, 0.7, 48),
      new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.9 })
    );
    praca.position.y = 0.35;
    g.add(praca);

    const faixa = new THREE.Mesh(
      new THREE.TorusGeometry(15.2, 0.12, 8, 90),
      new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85 })
    );
    faixa.rotation.x = Math.PI / 2;
    faixa.position.y = 0.72;
    g.add(faixa);

    // --- torre principal
    const torre = new THREE.Group();
    const texJanela = texturaJanela(Math.floor(rand() * 3));
    const larg = 7.5 + rand() * 2.5;
    const prof = 7.5 + rand() * 2.5;
    const alturaBase = prop.tipos.includes("2dorm") || prop.tipos.includes("3dorm") ? 24 : 30;
    const alt = alturaBase + rand() * 10;

    const matTorre = new THREE.MeshStandardMaterial({
      map: texJanela,
      emissiveMap: texJanela,
      emissive: 0xffffff,
      emissiveIntensity: 0.8,
      color: 0x383c46,
      roughness: 0.8,
      metalness: 0.15,
    });

    const corpo = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, prof), matTorre);
    corpo.position.y = alt / 2 + 1.4;
    const uvC = corpo.geometry.attributes.uv;
    for (let k = 0; k < uvC.count; k++) uvC.setXY(k, uvC.getX(k) * 2, uvC.getY(k) * Math.round(alt / 7));
    uvC.needsUpdate = true;
    torre.add(corpo);

    // volume secundário em L
    const alt2 = alt * (0.5 + rand() * 0.22);
    const vol2 = new THREE.Mesh(new THREE.BoxGeometry(larg * 0.62, alt2, prof * 0.62), matTorre);
    vol2.position.set(larg * 0.72, alt2 / 2 + 1.4, -prof * 0.55);
    const uv2 = vol2.geometry.attributes.uv;
    for (let k = 0; k < uv2.count; k++) uv2.setXY(k, uv2.getX(k) * 2, uv2.getY(k) * Math.round(alt2 / 7));
    uv2.needsUpdate = true;
    torre.add(vol2);

    // terraço + antena
    const telhado = new THREE.Mesh(
      new THREE.BoxGeometry(larg + 0.9, 1.1, prof + 0.9),
      new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.9 })
    );
    telhado.position.y = alt + 1.9;
    torre.add(telhado);

    const antena = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.22, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x555b66, metalness: 0.7, roughness: 0.35 })
    );
    antena.position.y = alt + 5.4;
    torre.add(antena);

    const pisca = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xff5b4a })
    );
    pisca.position.y = alt + 8.5;
    pisca.userData.pisca = true;
    torre.add(pisca);

    // podium comercial
    const podium = new THREE.Mesh(
      new THREE.BoxGeometry(larg + 7, 3.6, prof + 7),
      new THREE.MeshStandardMaterial({ color: 0x1c1f26, roughness: 0.7, metalness: 0.2 })
    );
    podium.position.y = 2.5;
    torre.add(podium);

    g.add(torre);
    this.torre = torre;

    // --- piscina + lazer na praça
    const piscina = new THREE.Mesh(
      new THREE.BoxGeometry(6.4, 0.34, 3.6),
      new THREE.MeshStandardMaterial({
        color: 0x0f6f8c,
        emissive: 0x0a4d66,
        emissiveIntensity: 0.9,
        roughness: 0.15,
        metalness: 0.3,
      })
    );
    piscina.position.set(-6.5, 0.9, 7.4);
    g.add(piscina);

    for (let i = 0; i < 9; i++) {
      const a = rand() * Math.PI * 2;
      const r = 11 + rand() * 3.4;
      const arvore = new THREE.Group();
      const tronco = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.2, 1.4, 6),
        new THREE.MeshStandardMaterial({ color: 0x4a3524, roughness: 1 })
      );
      tronco.position.y = 0.7;
      const copa = new THREE.Mesh(
        new THREE.ConeGeometry(0.95 + rand() * 0.5, 2.4 + rand(), 8),
        new THREE.MeshStandardMaterial({ color: 0x1d6b3d, roughness: 0.95 })
      );
      copa.position.y = 2.3;
      arvore.add(tronco, copa);
      arvore.position.set(Math.cos(a) * r, 0.7, Math.sin(a) * r);
      g.add(arvore);
    }

    // --- título 3D
    const tituloTex = texturaDeCanvas(desenharTitulo(prop));
    const titulo = new THREE.Mesh(
      new THREE.PlaneGeometry(21, 3.6),
      new THREE.MeshBasicMaterial({ map: tituloTex, transparent: true, depthWrite: false })
    );
    titulo.position.set(0, alt + 15, 0);
    titulo.userData.billboard = true;
    g.add(titulo);
    this.tituloDetalhe = titulo;

    // --- painéis com as fotos ORIGINAIS
    this.paineis = [];
    const n = prop.fotos.length;
    prop.fotos.forEach((f, i) => {
      const tex = texturaDeCanvas(desenharPainelFoto(this.img(f.arquivo), i));
      const ang = n === 1 ? 0 : ((i - (n - 1) / 2) / (n - 1)) * 1.5;
      const raioP = 13.6;
      const painel = new THREE.Group();

      const moldura = new THREE.Mesh(
        new THREE.PlaneGeometry(7.5, 5.3),
        new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 })
      );
      painel.add(moldura);

      const foto = new THREE.Mesh(
        new THREE.PlaneGeometry(7.2, 5),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04 })
      );
      foto.position.z = 0.02;
      foto.userData = { tipo: "foto", indice: i, painel };
      painel.add(foto);

      painel.position.set(
        Math.sin(ang) * raioP,
        5.6 + (i % 2) * 3.9,
        Math.cos(ang) * raioP
      );
      painel.userData = { ang, baseY: painel.position.y, fase: i * 1.3, foto };
      g.add(painel);
      this.paineis.push(painel);
    });

    // --- chips de lazer em órbita
    this.chips = [];
    const itens = prop.lazer.slice(0, 8);
    const raioChips = 17.5;
    itens.forEach((nome, i) => {
      const icone = ICONES_LAZER[nome] || "✨";
      const tex = texturaDeCanvas(desenharChip(nome, icone, cor));
      const chip = new THREE.Mesh(
        new THREE.PlaneGeometry(5.4, 1.78),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04 })
      );
      const ang = (i / itens.length) * Math.PI * 2;
      chip.position.set(Math.sin(ang) * raioChips, 4 + (i % 3) * 4.4, Math.cos(ang) * raioChips);
      chip.userData = { ang, raio: raioChips, y: chip.position.y, billboard: true, tipo: "chip" };
      g.add(chip);
      this.chips.push(chip);
    });

    // luz de destaque cromática
    const luz = new THREE.PointLight(cor.getHex(), 140, 70, 2);
    luz.position.set(0, 20, 18);
    g.add(luxSeguro(luz));

    g.scale.setScalar(0.02);
    g.userData.escala = 0.02;
    this.cena.add(g);
    this.grupoDetalhe = g;
    this.alturaTorre = alt;
  }

  limparDetalhe() {
    if (!this.grupoDetalhe) return;
    const g = this.grupoDetalhe;
    g.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => {
          if (m.map && m.map !== this.versoTex && m.map !== this.brilho.material.map) m.map.dispose();
          m.dispose();
        });
      }
    });
    this.cena.remove(g);
    this.grupoDetalhe = null;
    this.paineis = null;
    this.chips = null;
    this.torre = null;
    this.tituloDetalhe = null;
  }

  /* ------------------------------------------------------------- estados */
  irParaHero() {
    this.estado = "hero";
    this.propriedade = null;
    this.limparDetalhe();
    this.cards.forEach((c) => (c.userData.escalaAlvo = 0));
  }

  irParaGaleria() {
    this.estado = "galeria";
    this.propriedade = null;
    this.limparDetalhe();
    this.cards.forEach((c) => {
      const dentro = this.filtrados.includes(c.userData.prop);
      c.userData.escalaAlvo = dentro ? 1 : 0;
    });
    this.ocioso = 0;
  }

  abrirDetalhe(prop) {
    this.estado = "detalhe";
    this.montarDetalhe(prop);
    this.cards.forEach((c) => (c.userData.escalaAlvo = 0));
    this.orbitaAz = this.orbitaAzAlvo = -0.35;
    this.orbitaEl = this.orbitaElAlvo = 0.16;
    this.distDetalhe = 34;
    this.brilho.material.opacity = 1;
  }

  fecharDetalhe() {
    this.irParaGaleria();
  }

  aplicarFiltro(lista) {
    const antiga = this.filtrados[this.indiceFocado];
    this.filtrados = lista;
    this._disporAneis();
    if (!lista.length) {
      this.indiceFocado = -1;
      return;
    }
    const novo = lista.indexOf(antiga);
    this.indiceFocado = novo >= 0 ? novo : 0;
    this._focarSlot(this.indiceFocado);
  }

  focarPropriedade(prop) {
    const idx = this.filtrados.indexOf(prop);
    if (idx < 0) return;
    this.indiceFocado = idx;
    this._focarSlot(idx);
    this.ocioso = 0;
  }

  navegar(dir) {
    const n = this.filtrados.length;
    if (!n) return;
    this.indiceFocado = ((this.indiceFocado + dir) % n + n) % n;
    this._focarSlot(this.indiceFocado);
    this.ocioso = 0;
    return this.filtrados[this.indiceFocado];
  }

  cardDoIndice(indice) {
    return this.cards.find((c) => c.userData.prop === this.filtrados[indice]);
  }

  /* --------------------------------------------------------------- eventos */
  _ligarEventos() {
    const el = this.canvas;

    const ponteiroBaixo = (e) => {
      this.arrastando = true;
      this.movimentoTotal = 0;
      this.xAnterior = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      this.yAnterior = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      this.xInicial = this.xAnterior;
      this.yInicial = this.yAnterior;
      try {
        el.setPointerCapture?.(e.pointerId);
      } catch {
        /* ponteiro sintético ou não capturável */
      }
    };

    const ponteiroMover = (e) => {
      const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

      this.parallaxAlvo.set((x / window.innerWidth) * 2 - 1, (y / window.innerHeight) * 2 - 1);

      if (this.arrastando) {
        const dx = x - this.xAnterior;
        const dy = y - this.yAnterior;
        this.xAnterior = x;
        this.yAnterior = y;
        this.movimentoTotal += Math.abs(dx) + Math.abs(dy);
        this.ocioso = 0;

        if (this.estado === "galeria") {
          this.rotacao += dx * 0.0052;
          this.rotacaoAlvo = this.rotacao;
          this.velRotacao = dx * 0.0052;
          const n = Math.max(this.filtrados.length, 1);
          this.indiceFocado = ((Math.round(-this.rotacao / ((Math.PI * 2) / n)) % n) + n) % n;
        } else if (this.estado === "detalhe") {
          this.orbitaAzAlvo += dx * 0.006;
          this.orbitaElAlvo = Math.max(-0.15, Math.min(0.75, this.orbitaElAlvo + dy * 0.004));
        }
      } else {
        this._atualizarHover(x, y);
      }
    };

    const ponteiroCima = (e) => {
      if (this.arrastando && this.movimentoTotal < 9) this._clicar(e.clientX, e.clientY);
      this.arrastando = false;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {
        /* nada a liberar */
      }
    };

    if (window.PointerEvent) {
      el.addEventListener("pointerdown", ponteiroBaixo);
      el.addEventListener("pointermove", ponteiroMover);
      window.addEventListener("pointerup", ponteiroCima);
      el.addEventListener("pointerleave", () => (this.arrastando = false));
      el.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          this.ocioso = 0;
          if (this.estado === "detalhe") {
            this.distDetalhe = Math.max(20, Math.min(56, this.distDetalhe + e.deltaY * 0.03));
          } else {
            this.zoom = Math.max(0.68, Math.min(1.55, this.zoom + e.deltaY * 0.0009));
          }
        },
        { passive: false }
      );
    } else {
      el.addEventListener("touchstart", (e) => ponteiroBaixo(e), { passive: true });
      el.addEventListener("touchmove", (e) => ponteiroMover(e), { passive: true });
      el.addEventListener("touchend", ponteiroCima);
    }

    window.addEventListener("resize", () => this.redimensionar());

    window.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea, select")) return;
      if (this.estado === "galeria") {
        if (e.key === "ArrowRight") this.eventos.aoSeta?.(1);
        if (e.key === "ArrowLeft") this.eventos.aoSeta?.(-1);
      }
    });

    document.addEventListener("visibilitychange", () => {
      this.pausado = document.hidden;
      if (!this.pausado) this.relogio.getDelta();
    });
  }

  _posicaoPonteiro(x, y) {
    this._ponteiro.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this._raycaster.setFromCamera(this._ponteiro, this.camera);
  }

  _coletarAlvos() {
    const alvos = [];
    if (this.estado === "galeria") {
      this.cards.forEach((c) => {
        if (c.visible && c.userData.escala > 0.4) alvos.push(c.userData.frente);
      });
    } else if (this.estado === "detalhe" && this.paineis) {
      this.paineis.forEach((p) => alvos.push(p.userData.foto));
    }
    return alvos;
  }

  _atualizarHover(x, y) {
    this._posicaoPonteiro(x, y);
    const hits = this._raycaster.intersectObjects(this._coletarAlvos(), false);
    const alvo = hits.length ? hits[0].object : null;
    if (this.hover !== alvo) {
      this.hover = alvo;
      document.body.style.cursor = alvo ? "pointer" : "default";
      if (alvo) {
        const d = alvo.userData;
        this.eventos.aoPassear?.(d.tipo === "card" ? d.prop : null, d.indice);
      } else this.eventos.aoPassear?.(null);
    }
  }

  _clicar(x, y) {
    this._posicaoPonteiro(x, y);
    const hits = this._raycaster.intersectObjects(this._coletarAlvos(), false);
    if (!hits.length) return;
    const d = hits[0].object.userData;
    if (d.tipo === "card") this.eventos.aoSelecionar?.(d.prop);
    else if (d.tipo === "foto") this.eventos.aoFoto?.(d.indice);
  }

  redimensionar() {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
  }

  /* ---------------------------------------------------------------- laco */
  laco = () => {
    if (this.pausado) {
      this._raf = requestAnimationFrame(this.laco);
      return;
    }
    const dt = Math.min(this.relogio.getDelta(), 0.05);
    const t = this.relogio.elapsedTime;
    this.ocioso += dt;

    // parallax suave
    this.parallax.lerp(this.parallaxAlvo, 1 - Math.exp(-dt * 3.5));

    // cards: escala / posição / flutuação
    const flutuar = !this.reduzirMovimento;
    this.cards.forEach((c) => {
      const u = c.userData;
      u.escala += (u.escalaAlvo - u.escala) * (1 - Math.exp(-dt * 6));
      if (u.escala < 0.015 && u.escalaAlvo === 0) {
        if (c.visible) c.visible = false;
        return;
      }
      if (!c.visible) c.visible = true;
      c.scale.setScalar(Math.max(u.escala, 0.001));

      const sobre = this.hover && this.hover.userData.prop === u.prop ? 1 : 0;
      u.sobre = (u.sobre || 0) + (sobre - (u.sobre || 0)) * (1 - Math.exp(-dt * 9));
      u.halo.material.opacity = u.sobre * 0.55 * u.escala;

      c.position.copy(u.base);
      if (flutuar) {
        c.position.y += Math.sin(t * 0.9 + u.fase) * 0.26;
        c.rotation.z = Math.sin(t * 0.6 + u.fase) * 0.022;
      }
      // card da frente ganha profundidade
      const distAng = Math.abs(((u.angulo + this.rotacao) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
      const frenteira = 1 - Math.min(Math.abs(distAng) / Math.PI, 1);
      c.position.z += 0; // mantém o raio
      c.position.multiplyScalar(1 + frenteira * 0.012 * u.escala);
      c.position.y += frenteira * 0.5 * u.escala + u.sobre * 0.45;
      const escalaF = 1 + frenteira * 0.06 + u.sobre * 0.09;
      c.scale.multiplyScalar(escalaF);
      c.lookAt(Math.sin(u.angulo + this.rotacao) * (this.raioAneis * 4), c.position.y * 0.9, Math.cos(u.angulo + this.rotacao) * (this.raioAneis * 4));
    });

    // rotação do anel (inércia + modo ocioso)
    if (this.estado === "galeria" && !this.arrastando) {
      if (Math.abs(this.velRotacao) > 0.00004) {
        this.rotacao += this.velRotacao;
        this.rotacaoAlvo = this.rotacao;
        this.velRotacao *= Math.exp(-dt * 2.6);
      } else if (this.ocioso > 4 && !this.reduzirMovimento) {
        this.rotacao += dt * 0.055;
        this.rotacaoAlvo = this.rotacao;
      }
    }
    this.grupoAneis.rotation.y += (this.rotacao - this.grupoAneis.rotation.y) * (1 - Math.exp(-dt * 8));

    // showroom
    if (this.grupoDetalhe) {
      const g = this.grupoDetalhe;
      g.userData.escala += (1 - g.userData.escala) * (1 - Math.exp(-dt * 4.2));
      g.scale.setScalar(g.userData.escala);

      if (this.torre && !this.reduzirMovimento) this.torre.rotation.y += dt * 0.11;

      this.paineis?.forEach((p) => {
        const u = p.userData;
        p.position.y = u.baseY + (flutuar ? Math.sin(t * 0.85 + u.fase) * 0.3 : 0);
        p.quaternion.copy(this.camera.quaternion);
        const sobre = this.hover === u.foto ? 1 : 0;
        u.sobre = (u.sobre || 0) + (sobre - (u.sobre || 0)) * (1 - Math.exp(-dt * 10));
        p.scale.setScalar(1 + u.sobre * 0.08);
      });

      this.chips?.forEach((ch, i) => {
        const u = ch.userData;
        if (!this.reduzirMovimento) u.ang += dt * 0.16;
        ch.position.set(Math.sin(u.ang) * u.raio, u.y + Math.sin(t + i) * 0.3, Math.cos(u.ang) * u.raio);
        ch.quaternion.copy(this.camera.quaternion);
      });

      if (this.tituloDetalhe) this.tituloDetalhe.quaternion.copy(this.camera.quaternion);

      g.traverse((o) => {
        if (o.userData.pisca) o.material.opacity = 0.35 + Math.abs(Math.sin(t * 2.4)) * 0.65, (o.material.transparent = true);
      });
    } else {
      // recolhimento suave quando volta à galeria
      this.cards.forEach((c) => {
        if (c.userData.escalaAlvo > 0) c.userData.escala = Math.max(c.userData.escala, 0.001);
      });
    }

    // câmera
    this._posicionarCamera(dt, t);

    // estrelas giram devagar
    if (!this.reduzirMovimento) this.estrelas.rotation.y += dt * 0.006;
    this.brilho.material.opacity = this.estado === "detalhe" ? 1 : 0.62;
    this.luzOuro.intensity = 46 + Math.sin(t * 1.4) * 12;

    this.renderer.render(this.cena, this.camera);
    this._raf = requestAnimationFrame(this.laco);
  };

  _posicionarCamera(dt, t) {
    if (this.estado === "hero") {
      const ang = (this.reduzirMovimento ? 0.6 : t * 0.045) + this.parallax.x * 0.16;
      const raio = 86 * this.zoom;
      this.camAlvo.set(Math.sin(ang) * raio, 26 + this.parallax.y * -5, Math.cos(ang) * raio);
      this.miraAlvo.set(0, 16, 0);
    } else if (this.estado === "galeria") {
      const raio = (this.raioAneis + 19) * this.zoom;
      this.camAlvo.set(this.parallax.x * 3.4, 6.4 - this.parallax.y * 1.6, raio);
      this.miraAlvo.set(0, 5.1, 0);
    } else {
      const az = this.orbitaAzAlvo + this.parallax.x * 0.12;
      const el = this.orbitaElAlvo - this.parallax.y * 0.07;
      const d = this.distDetalhe * this.zoom;
      this.camAlvo.set(
        Math.sin(az) * Math.cos(el) * d,
        7.5 + Math.sin(el) * d,
        Math.cos(az) * Math.cos(el) * d
      );
      this.miraAlvo.set(0, this.alturaTorre ? Math.min(this.alturaTorre * 0.42, 13) : 9, 0);
    }

    const k = 1 - Math.exp(-dt * 2.9);
    this.camera.position.lerp(this.camAlvo, k);
    this.mira.lerp(this.miraAlvo, 1 - Math.exp(-dt * 3.4));
    this.camera.lookAt(this.mira);
  }

  destruir() {
    cancelAnimationFrame(this._raf);
    this.limparDetalhe();
    this.renderer?.dispose();
  }
}

// pequeno guardião: evita erro caso a luz venha com valores inválidos
function luxSeguro(luz) {
  if (!Number.isFinite(luz.intensity)) luz.intensity = 100;
  return luz;
}
