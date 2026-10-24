// ============================================================================
// Mundo 3D v2 — Estilo ISOMÉTRICO / GRID CIDADE
// Cards como "prédios" em grade isométrica, navegação WASD/setas,
// zoom com scroll, hover expande o prédio em showroom lateral.
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
  c.width = w; c.height = h;
  return c;
}
function texturaDeCanvas(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; t.needsUpdate = true;
  return t;
}
function desenharCobertura(ctx, img, x, y, w, h) {
  if (!img || !img.width) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, "#1b1d22"); g.addColorStop(1, "#2b2417");
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    return;
  }
  const r = Math.max(w / img.width, h / img.height);
  const nw = img.width * r, nh = img.height * r;
  ctx.drawImage(img, x + (w - nw) / 2, y + (h - nh) / 2, nw, nh);
}
function quebrarTexto(ctx, texto, larguraMax) {
  const palavras = String(texto).split(" ");
  const linhas = []; let atual = "";
  for (const p of palavras) {
    const teste = atual ? atual + " " + p : p;
    if (ctx.measureText(teste).width > larguraMax && atual) {
      linhas.push(atual); atual = p;
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
function semente(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return function () { h += 0x6d2b79f5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ------------------------------------------------------------ texturas 2D */

function desenharCardIso(prop, img) {
  // textura para face frontal do "prédio"
  const W = 256, H = 384;
  const c = novoCanvas(W, H); const ctx = c.getContext("2d");
  ctx.save();
  // foto
  desenharCobertura(ctx, img, 0, 0, W, H);
  // gradiente escuro base
  const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
  g.addColorStop(0, "rgba(8,8,10,0)"); g.addColorStop(0.7, "rgba(8,8,10,0.85)"); g.addColorStop(1, "rgba(6,6,8,0.98)");
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.35, W, H * 0.65);
  // badge status
  const corStatus = corDeStatus(prop.status);
  ctx.font = "700 20px Inter, sans-serif";
  const ls = ctx.measureText(prop.status).width + 36;
  ctx.fillStyle = "rgba(8,8,10,0.8)"; arredondar(ctx, 12, 12, ls, 36, 18); ctx.fill();
  ctx.strokeStyle = corStatus; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = corStatus; ctx.beginPath(); ctx.arc(24, 30, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f4f1ea"; ctx.fillText(prop.status, 38, 36);
  // construtora topo
  const corConst = corDeConstrutora(prop.construtora);
  ctx.font = "700 16px Inter, sans-serif";
  const lc = ctx.measureText(prop.construtora).width + 24;
  ctx.fillStyle = "rgba(8,8,10,0.8)"; arredondar(ctx, W - 12 - lc, 12, lc, 30, 15); ctx.fill();
  ctx.strokeStyle = corConst; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = corConst; ctx.fillText(prop.construtora, W - 12 - lc + 12, 31);
  // título
  ctx.fillStyle = "#fff"; ctx.font = "800 28px Inter, sans-serif";
  const lt = quebrarTexto(ctx, prop.titulo, W - 32);
  let y = H - 140; lt.slice(0, 2).forEach(l => { ctx.fillText(l, 16, y); y += 32; });
  // slogan
  ctx.fillStyle = COR_OURO_CLARO; ctx.font = "500 16px Inter, sans-serif";
  const ls2 = quebrarTexto(ctx, prop.slogan, W - 32);
  y += 4; ls2.slice(0, 2).forEach(l => { ctx.fillText(l, 16, y); y += 22; });
  // régua
  y += 8; ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(16, y); ctx.lineTo(W - 16, y); ctx.stroke();
  // zona/tipologia
  y += 20; ctx.fillStyle = "rgba(244,241,234,0.7)"; ctx.font = "600 14px Inter, sans-serif";
  ctx.fillText(`${prop.zona} • ${prop.bairro}`, 16, y);
  y += 20; ctx.fillStyle = "rgba(244,241,234,0.5)"; ctx.font = "500 13px Inter, sans-serif";
  ctx.fillText(prop.tipologia, 16, y);
  ctx.restore();
  // borda dourada
  ctx.strokeStyle = "rgba(204,153,51,0.6)"; ctx.lineWidth = 3; arredondar(ctx, 2, 2, W - 4, H - 4, 12); ctx.stroke();
  return c;
}

function desenharTopoIso(prop) {
  // textura do topo do prédio (vista isométrica)
  const W = 256, H = 160;
  const c = novoCanvas(W, H); const ctx = c.getContext("2d");
  const rand = semente(prop.slug + "topo");
  const base = new THREE.Color(corDeConstrutora(prop.construtora));
  const r = Math.floor(base.r * 255), g = Math.floor(base.g * 255), b = Math.floor(base.b * 255);
  ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.fillRect(0, 0, W, H);
  // grade de janelas no topo
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  for (let x = 0; x < W; x += 18) for (let y = 0; y < H; y += 18) if (rand() > 0.6) ctx.fillRect(x, y, 10, 10);
  // borda
  ctx.strokeStyle = "rgba(204,153,51,0.5)"; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, H - 2);
  return c;
}

function desenharLateralIso(prop) {
  // textura lateral (menor)
  const W = 160, H = 384;
  const c = novoCanvas(W, H); const ctx = c.getContext("2d");
  const rand = semente(prop.slug + "lat");
  const base = new THREE.Color(corDeConstrutora(prop.construtora));
  const r = Math.floor(base.r * 255), g = Math.floor(base.g * 255), b = Math.floor(base.b * 255);
  ctx.fillStyle = `rgb(${Math.max(20,r-40)},${Math.max(20,g-40)},${Math.max(20,b-40)})`; ctx.fillRect(0, 0, W, H);
  // faixas
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 0; y < H; y += 24) ctx.fillRect(0, y, W, 12);
  // janelas
  ctx.fillStyle = "rgba(255,220,160,0.15)";
  for (let x = 0; x < W; x += 22) for (let y = 0; y < H; y += 22) if (rand() > 0.55) ctx.fillRect(x, y, 14, 14);
  return c;
}

function texturaChao() {
  const c = novoCanvas(512, 512); const ctx = c.getContext("2d");
  ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, 512, 512);
  // grade isométrica sutil
  ctx.strokeStyle = "rgba(204,153,51,0.04)"; ctx.lineWidth = 1;
  for (let i = -512; i < 1024; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 512, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i + 512, 0); ctx.lineTo(i, 512); ctx.stroke();
  }
  return texturaDeCanvas(c);
}

function texturaCeu() {
  const c = novoCanvas(512, 256); const ctx = c.getContext("2d");
  const grd = ctx.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0, "#04050a"); grd.addColorStop(0.5, "#070a12"); grd.addColorStop(1, "#1a1710");
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 512, 256);
  // glow horizonte
  const r = ctx.createRadialGradient(256, 200, 4, 256, 200, 210);
  r.addColorStop(0, "rgba(204,153,51,0.35)"); r.addColorStop(1, "rgba(204,153,51,0)");
  ctx.fillStyle = r; ctx.fillRect(0, 0, 512, 256);
  return texturaDeCanvas(c);
}

/* ================================================================= MUNDO v2 */

export class MundoV2 {
  constructor(canvas, opcoes = {}) {
    this.canvas = canvas;
    this.eventos = {}; // aoSelecionar, aoVoltar, aoPassear
    this.reduzirMovimento = opcoes.reduzirMovimento || false;
    this.mobile = opcoes.mobile || false;

    this.estado = "hero"; // hero | grid | detalhe
    this.propriedade = null;
    this.filtrados = [...EMPREENDIMENTOS];

    this.prédios = []; // { mesh, prop, basePos, targetScale, currentScale, hover }
    this.prédioSelecionado = null;
    this.showroom = null;

    this.camera = null; this.cena = null; this.renderer = null;
    this.controles = { esq: false, dir: false, cima: false, baixo: false, zoom: 1 };
    this.cameraPos = new THREE.Vector3(0, 0, 0);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);
    this.zoom = 1; this.zoomTarget = 1;
    this.rotacao = 0; this.rotacaoTarget = 0;
    this.relogio = new THREE.Clock();
    this.pausado = false;

    this.imagens = new Map();
    this._raycaster = new THREE.Raycaster();
    this._ponteiro = new THREE.Vector2();
  }

  async iniciar(aoProgresso) {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.mobile, powerPreference: "high-performance", alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.05;

    this.cena = new THREE.Scene();
    this.cena.fog = new THREE.FogExp2(0x07070c, 0.0045);

    // Câmera ortográfica isométrica
    const aspect = window.innerWidth / window.innerHeight;
    const frustum = this.mobile ? 42 : 38;
    this.camera = new THREE.OrthographicCamera(frustum * aspect / -2, frustum * aspect / 2, frustum / 2, frustum / -2, 0.1, 1000);
    // posição isométrica clássica
    const dist = 80;
    this.camera.position.set(dist, dist, dist);
    this.camera.lookAt(0, 0, 0);
    this.cameraPos.copy(this.camera.position);
    this.cameraTarget.set(0, 0, 0);

    // pré-carrega fotos
    const lista = []; EMPREENDIMENTOS.forEach(p => p.fotos.forEach(f => lista.push(f.arquivo)));
    let n = 0;
    await Promise.all(lista.map(src => new Promise(res => { const img = new Image(); img.onload = () => { this.imagens.set(src, img); n++; aoProgresso && aoProgresso(n / lista.length, "Carregando fotos…"); res(); }; img.onerror = () => { n++; res(); }; img.src = src; })));

    aoProgresso && aoProgresso(0.9, "Construindo grade isométrica…");
    this._construirCena();
    aoProgresso && aoProgresso(1, "Pronto!");

    this._ligarEventos();
    this.laco();
    return this;
  }

  img(arquivo) { return this.imagens.get(arquivo) || null; }

  _construirCena() {
    // Céu
    const ceu = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 20), new THREE.MeshBasicMaterial({ map: texturaCeu(), side: THREE.BackSide, fog: false }));
    this.cena.add(ceu);

    // Luzes
    this.cena.add(new THREE.HemisphereLight(0x8fb6ff, 0x14110b, 0.6));
    const sol = new THREE.DirectionalLight(0xfff0d6, 1.2); sol.position.set(60, 100, 40); this.cena.add(sol);
    const fill = new THREE.DirectionalLight(0x7aa2ff, 0.4); fill.position.set(-50, 40, -40); this.cena.add(fill);

    // Chão com grade isométrica
    const chaoGeo = new THREE.PlaneGeometry(600, 600);
    const chaoMat = new THREE.MeshStandardMaterial({ map: texturaChao(), color: 0x0d0d0d, roughness: 0.95, metalness: 0.05 });
    const chao = new THREE.Mesh(chaoGeo, chaoMat); chao.rotation.x = -Math.PI / 2; chao.position.y = -0.1; chao.receiveShadow = true;
    this.cena.add(chao);

    // Grade de ruas (linhas)
    const linhas = new THREE.Group();
    const matLinha = new THREE.LineBasicMaterial({ color: 0xcc9933, transparent: true, opacity: 0.12 });
    for (let i = -14; i <= 14; i++) {
      const geoX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i * 18, 0.05, -14 * 18), new THREE.Vector3(i * 18, 0.05, 14 * 18)]);
      const geoZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-14 * 18, 0.05, i * 18), new THREE.Vector3(14 * 18, 0.05, i * 18)]);
      linhas.add(new THREE.Line(geoX, matLinha)); linhas.add(new THREE.Line(geoZ, matLinha));
    }
    this.cena.add(linhas);

    // Estrelas/partículas
    const geoP = new THREE.BufferGeometry(); const n = this.mobile ? 500 : 1000;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 180 + Math.random() * 200; const t = Math.random() * Math.PI * 2; const p = Math.acos(2 * Math.random() - 1) * 0.45;
      pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = Math.abs(r * Math.cos(p)) * 0.4 + 8; pos[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
    }
    geoP.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.particulas = new THREE.Points(geoP, new THREE.PointsMaterial({ color: 0xffe6b0, size: 1.2, sizeAttenuation: true, transparent: true, opacity: 0.6, depthWrite: false }));
    this.cena.add(this.particulas);

    // Prédios (cards)
    this._construirPredios();
  }

  _construirPredios() {
    this.prédios.forEach(p => { if (p.mesh) { p.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const m = Array.isArray(o.material) ? o.material : [o.material]; m.forEach(mm => { if (mm.map) mm.map.dispose(); mm.dispose(); }); } }); this.cena.remove(p.mesh); } });
    this.prédios = [];

    const gap = 18; // espaçamento entre prédios na grade
    const cols = Math.ceil(Math.sqrt(this.filtrados.length));
    const rows = Math.ceil(this.filtrados.length / cols);
    const startX = -(cols - 1) * gap / 2;
    const startZ = -(rows - 1) * gap / 2;

    this.filtrados.forEach((prop, idx) => {
      const col = idx % cols; const row = Math.floor(idx / cols);
      const x = startX + col * gap; const z = startZ + row * gap;

      const rand = semente(prop.slug);
      const altBase = prop.tipos.includes("2dorm") || prop.tipos.includes("3dorm") ? 12 : 16;
      const altura = altBase + rand() * 10;
      const larg = 7.5 + rand() * 1.5; const prof = 7.5 + rand() * 1.5;

      // Texturas
      const foto = this.img(prop.fotos[0].arquivo);
      const texFrente = texturaDeCanvas(desenharCardIso(prop, foto));
      const texTopo = texturaDeCanvas(desenharTopoIso(prop));
      const texLateral = texturaDeCanvas(desenharLateralIso(prop));
      const texLateral2 = texturaDeCanvas(desenharLateralIso(prop)); // pode variar

      const mats = [
        new THREE.MeshStandardMaterial({ map: texLateral, roughness: 0.85, metalness: 0.1 }), // right
        new THREE.MeshStandardMaterial({ map: texLateral2, roughness: 0.85, metalness: 0.1 }), // left
        new THREE.MeshStandardMaterial({ map: texTopo, roughness: 0.7, metalness: 0.2 }), // top
        new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 }), // bottom
        new THREE.MeshStandardMaterial({ map: texFrente, transparent: true, alphaTest: 0.04, roughness: 0.8, metalness: 0.15 }), // front
        new THREE.MeshStandardMaterial({ map: texLateral, roughness: 0.85, metalness: 0.1 }), // back
      ];

      const geo = new THREE.BoxGeometry(larg, altura, prof);
      // UV scale para janelas
      [0,1,2,3,4,5].forEach(fi => {
        const uv = geo.attributes.uv; const faceUv = fi < 4 ? 1 : 2;
        // já vem ok do BoxGeometry
      });

      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x, altura / 2, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { tipo: "predio", prop, basePos: new THREE.Vector3(x, altura / 2, z), altura };

      // Halo de seleção
      const haloGeo = new THREE.BoxGeometry(larg + 0.4, altura + 0.4, prof + 0.4);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xcc9933, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const halo = new THREE.Mesh(haloGeo, haloMat); halo.position.y = altura / 2; mesh.add(halo);

      this.cena.add(mesh);
      this.prédios.push({ mesh, prop, basePos: new THREE.Vector3(x, altura / 2, z), targetScale: 1, currentScale: 1, hover: 0, halo, larg, altura, prof });
    });

    // Focar centro da grade
    const cx = 0, cz = 0;
    this.cameraTarget.set(cx, 12, cz);
  }

  _construirShowroom(prop) {
    this._limparShowroom();
    const rand = semente(prop.slug);
    const cor = new THREE.Color(corDeConstrutora(prop.construtora));
    const g = new THREE.Group();

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(12, 13, 0.5, 48), new THREE.MeshStandardMaterial({ color: 0x14151a, roughness: 0.9 }));
    base.position.y = 0.25; g.add(base);
    const anel = new THREE.Mesh(new THREE.TorusGeometry(12.2, 0.08, 8, 80), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 }));
    anel.rotation.x = Math.PI / 2; anel.position.y = 0.6; g.add(anel);

    // Torre principal
    const torre = new THREE.Group();
    const texJanela = texturaDeCanvas(desenharLateralIso(prop)); // reusa lateral como fachada
    const larg = 6.5 + rand() * 2; const prof = 6.5 + rand() * 2; const alt = 22 + rand() * 12;
    const matT = new THREE.MeshStandardMaterial({ map: texJanela, emissiveMap: texJanela, emissive: 0xffffff, emissiveIntensity: 0.7, color: 0x383c46, roughness: 0.8, metalness: 0.15 });
    const corpo = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, prof), matT); corpo.position.y = alt / 2 + 1;
    const uvC = corpo.geometry.attributes.uv; for (let k = 0; k < uvC.count; k++) uvC.setXY(k, uvC.getX(k) * 2, uvC.getY(k) * Math.round(alt / 7)); uvC.needsUpdate = true;
    torre.add(corpo);

    // Volume secundário
    const alt2 = alt * (0.5 + rand() * 0.2); const vol2 = new THREE.Mesh(new THREE.BoxGeometry(larg * 0.55, alt2, prof * 0.55), matT);
    vol2.position.set(larg * 0.68, alt2 / 2 + 1, -prof * 0.5); torre.add(vol2);

    // Terraço
    const telhado = new THREE.Mesh(new THREE.BoxGeometry(larg + 0.8, 0.9, prof + 0.8), new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.9 })); telhado.position.y = alt + 1.5; torre.add(telhado);

    g.add(torre); this.torreShowroom = torre;

    // Piscina + árvores
    const pisc = new THREE.Mesh(new THREE.BoxGeometry(5, 0.25, 3), new THREE.MeshStandardMaterial({ color: 0x0f6f8c, emissive: 0x0a4d66, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.3 }));
    pisc.position.set(-5, 0.7, 6); g.add(pisc);
    for (let i = 0; i < 7; i++) { const a = rand() * Math.PI * 2; const r = 9 + rand() * 3; const arv = new THREE.Group(); const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.2, 6), new THREE.MeshStandardMaterial({ color: 0x4a3524 })); tr.position.y = 0.6; const cp = new THREE.Mesh(new THREE.ConeGeometry(0.8 + rand() * 0.4, 2 + rand(), 8), new THREE.MeshStandardMaterial({ color: 0x1d6b3d })); cp.position.y = 2; arv.add(tr, cp); arv.position.set(Math.cos(a) * r, 0.6, Math.sin(a) * r); g.add(arv); }

    // Painéis de fotos (flutuantes ao redor)
    this.paineisShowroom = [];
    const n = prop.fotos.length;
    prop.fotos.forEach((f, i) => {
      const tex = texturaDeCanvas(desenharPainelFoto(this.img(f.arquivo), i));
      const painel = new THREE.Group();
      const mold = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 4.6), new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.9 })); painel.add(mold);
      const ft = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 4.3), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04 })); ft.position.z = 0.02; ft.userData = { tipo: "foto", indice: i }; painel.add(ft);
      const ang = n === 1 ? 0 : ((i - (n - 1) / 2) / (n - 1)) * 1.3;
      const rP = 11; painel.position.set(Math.sin(ang) * rP, 4.5 + (i % 2) * 3.5, Math.cos(ang) * rP);
      painel.userData = { ang, baseY: painel.position.y, fase: i * 1.3, foto: ft };
      g.add(painel); this.paineisShowroom.push(painel);
    });

    // Chips lazer orbitando
    this.chipsShowroom = [];
    const itens = prop.lazer.slice(0, 7); const rC = 14;
    itens.forEach((nome, i) => { const icone = ICONES_LAZER[nome] || "✨"; const tex = texturaDeCanvas(desenharChip(nome, icone, cor)); const ch = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.6), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.04 })); const ang = (i / itens.length) * Math.PI * 2; ch.position.set(Math.sin(ang) * rC, 3.5 + (i % 3) * 3.8, Math.cos(ang) * rC); ch.userData = { ang, raio: rC, y: ch.position.y, billboard: true }; g.add(ch); this.chipsShowroom.push(ch); });

    // Luz destaque
    const luz = new THREE.PointLight(cor.getHex(), 100, 60, 2); luz.position.set(0, 18, 14); g.add(luz);

    g.scale.setScalar(0.015); g.userData.escala = 0.015;
    this.cena.add(g); this.showroom = g; this.alturaTorreShowroom = alt;
  }

  _limparShowroom() { if (!this.showroom) return; const g = this.showroom; g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => { if (m.map && m.map !== this._texChao) m.map.dispose(); m.dispose(); }); } }); this.cena.remove(g); this.showroom = null; this.paineisShowroom = null; this.chipsShowroom = null; this.torreShowroom = null; }

  /* ------------------------------------------------------------ estados */
  irParaHero() { this.estado = "hero"; this.propriedade = null; this._limparShowroom(); this.prédios.forEach(p => p.targetScale = 1); this.zoomTarget = 1; this.cameraTarget.set(0, 12, 0); }
  irParaGrid() { this.estado = "grid"; this.propriedade = null; this._limparShowroom(); this.prédios.forEach(p => p.targetScale = 1); this.zoomTarget = 1; this.cameraTarget.set(0, 12, 0); }
  abrirDetalhe(prop) { this.estado = "detalhe"; this.propriedade = prop; this._construirShowroom(prop); this.prédios.forEach(p => { p.targetScale = p.prop === prop ? 1 : 0.35; }); this.zoomTarget = 0.7; this.cameraTarget.set(0, 14, 0); }
  fecharDetalhe() { this.irParaGrid(); }
  aplicarFiltro(lista) { this.filtrados = lista; this._construirPredios(); }
  focarPropriedade(prop) { const p = this.prédios.find(x => x.prop === prop); if (p) { this.cameraTarget.set(p.basePos.x, 12, p.basePos.z); } }

  /* --------------------------------------------------------------- eventos */
  _ligarEventos() {
    const el = this.canvas;
    const down = (e) => { this.arrastando = true; this.movimentoTotal = 0; this.xAnterior = e.clientX ?? e.touches?.[0]?.clientX ?? 0; this.yAnterior = e.clientY ?? e.touches?.[0]?.clientY ?? 0; el.setPointerCapture?.(e.pointerId); };
    const move = (e) => { const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0; const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0; this._ponteiro.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1); if (this.arrastando) { const dx = x - this.xAnterior; const dy = y - this.yAnterior; this.xAnterior = x; this.yAnterior = y; this.movimentoTotal += Math.abs(dx) + Math.abs(dy); if (this.estado === "grid") { this.rotacaoTarget += dx * 0.004; this.zoomTarget = Math.max(0.45, Math.min(2.2, this.zoomTarget - dy * 0.006)); } else if (this.estado === "detalhe") { this.rotacaoTarget += dx * 0.005; this.zoomTarget = Math.max(0.4, Math.min(1.8, this.zoomTarget - dy * 0.005)); } } else { this._atualizarHover(x, y); } };
    const up = (e) => { if (this.arrastando && this.movimentoTotal < 9) this._clicar(e.clientX, e.clientY); this.arrastando = false; el.releasePointerCapture?.(e.pointerId); };
    if (window.PointerEvent) { el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move); window.addEventListener("pointerup", up); el.addEventListener("wheel", e => { e.preventDefault(); this.zoomTarget = Math.max(0.4, Math.min(2.2, this.zoomTarget + e.deltaY * 0.0012)); }, { passive: false }); } else { el.addEventListener("touchstart", down, { passive: true }); el.addEventListener("touchmove", move, { passive: true }); el.addEventListener("touchend", up); }
    window.addEventListener("keydown", e => { if (e.target.matches("input,textarea,select")) return; if (["ArrowLeft","KeyA"].includes(e.key)) this.controles.esq = true; if (["ArrowRight","KeyD"].includes(e.key)) this.controles.dir = true; if (["ArrowUp","KeyW"].includes(e.key)) this.controles.cima = true; if (["ArrowDown","KeyS"].includes(e.key)) this.controles.baixo = true; });
    window.addEventListener("keyup", e => { if (["ArrowLeft","KeyA"].includes(e.key)) this.controles.esq = false; if (["ArrowRight","KeyD"].includes(e.key)) this.controles.dir = false; if (["ArrowUp","KeyW"].includes(e.key)) this.controles.cima = false; if (["ArrowDown","KeyS"].includes(e.key)) this.controles.baixo = false; });
    window.addEventListener("resize", () => this.redimensionar());
  }

  _posicaoPonteiro(x, y) { this._ponteiro.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1); this._raycaster.setFromCamera(this._ponteiro, this.camera); }
  _coletarAlvos() { const alvos = []; if (this.estado === "grid") this.prédios.forEach(p => { if (p.currentScale > 0.2) alvos.push(p.mesh); }); else if (this.estado === "detalhe" && this.paineisShowroom) this.paineisShowroom.forEach(p => alvos.push(p.userData.foto)); return alvos; }
  _atualizarHover(x, y) { this._posicaoPonteiro(x, y); const hits = this._raycaster.intersectObjects(this._coletarAlvos(), false); const alvo = hits.length ? hits[0].object : null; if (this.hover !== alvo) { this.hover = alvo; document.body.style.cursor = alvo ? "pointer" : "default"; if (alvo) this.eventos.aoPassear?.(alvo.userData.tipo === "predio" ? alvo.userData.prop : null, alvo.userData.indice); else this.eventos.aoPassear?.(null); } }
  _clicar(x, y) { this._posicaoPonteiro(x, y); const hits = this._raycaster.intersectObjects(this._coletarAlvos(), false); if (!hits.length) return; const d = hits[0].object.userData; if (d.tipo === "predio") this.eventos.aoSelecionar?.(d.prop); else if (d.tipo === "foto") this.eventos.aoFoto?.(d.indice); }

  redimensionar() { if (!this.renderer) return; const aspect = window.innerWidth / window.innerHeight; const frustum = this.mobile ? 42 : 38; this.camera.left = frustum * aspect / -2; this.camera.right = frustum * aspect / 2; this.camera.top = frustum / 2; this.camera.bottom = frustum / -2; this.camera.updateProjectionMatrix(); this.renderer.setSize(window.innerWidth, window.innerHeight); this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 2)); }

  /* ---------------------------------------------------------------- loop */
  laco = () => { if (this.pausado) { this._raf = requestAnimationFrame(this.laco); return; } const dt = Math.min(this.relogio.getDelta(), 0.05); const t = this.relogio.elapsedTime;

    // Movimento teclado (grid)
    if (this.estado === "grid" && !this.arrastando) {
      const speed = 0.6 * this.zoom;
      if (this.controles.esq) this.cameraTarget.x -= speed;
      if (this.controles.dir) this.cameraTarget.x += speed;
      if (this.controles.cima) this.cameraTarget.z -= speed;
      if (this.controles.baixo) this.cameraTarget.z += speed;
    }

    // Rotação orbital suave (detalhe)
    if (this.estado === "detalhe" && !this.arrastando) {
      if (!this.reduzirMovimento) this.rotacao += dt * 0.06;
      else this.rotacao = this.rotacaoTarget;
    } else if (this.estado === "grid") {
      this.rotacao += (this.rotacaoTarget - this.rotacao) * (1 - Math.exp(-dt * 5));
    }

    // Zoom
    this.zoom += (this.zoomTarget - this.zoom) * (1 - Math.exp(-dt * 6));
    const frustum = this.mobile ? 42 : 38;
    const camDist = frustum * this.zoom * 1.1;

    // Posição câmera isométrica rotacionada
    const ang = this.rotacao;
    const camX = Math.sin(ang) * camDist;
    const camZ = Math.cos(ang) * camDist;
    const camY = camDist * 0.9;
    this.cameraPos.set(
      this.cameraTarget.x + camX,
      this.cameraTarget.y + camY,
      this.cameraTarget.z + camZ
    );
    this.camera.position.lerp(this.cameraPos, 1 - Math.exp(-dt * 4));
    this.camera.lookAt(this.cameraTarget);

    // Animação prédios
    this.prédios.forEach(p => {
      p.currentScale += (p.targetScale - p.currentScale) * (1 - Math.exp(-dt * 5));
      p.mesh.scale.setScalar(Math.max(p.currentScale, 0.001));
      p.mesh.position.y = p.basePos.y * p.currentScale;

      const sobre = this.hover && this.hover.userData.prop === p.prop ? 1 : 0;
      p.hover = (p.hover || 0) + (sobre - (p.hover || 0)) * (1 - Math.exp(-dt * 8));
      p.halo.material.opacity = p.hover * 0.6 * p.currentScale;

      // flutuação sutil
      if (!this.reduzirMovimento && this.estado === "grid") {
        p.mesh.position.y += Math.sin(t * 0.8 + p.basePos.x * 0.1 + p.basePos.z * 0.1) * 0.15 * p.currentScale;
      }
    });

    // Showroom
    if (this.showroom) {
      const g = this.showroom;
      g.userData.escala += (1 - g.userData.escala) * (1 - Math.exp(-dt * 4));
      g.scale.setScalar(g.userData.escala);
      if (this.torreShowroom && !this.reduzirMovimento) this.torreShowroom.rotation.y += dt * 0.1;

      this.paineisShowroom?.forEach(p => {
        const u = p.userData; p.position.y = u.baseY + (!this.reduzirMovimento ? Math.sin(t * 0.85 + u.fase) * 0.25 : 0);
        p.quaternion.copy(this.camera.quaternion);
        const sobre = this.hover === u.foto ? 1 : 0;
        u.sobre = (u.sobre || 0) + (sobre - (u.sobre || 0)) * (1 - Math.exp(-dt * 10));
        p.scale.setScalar(1 + u.sobre * 0.07);
      });
      this.chipsShowroom?.forEach((ch, i) => { const u = ch.userData; if (!this.reduzirMovimento) u.ang += dt * 0.14; ch.position.set(Math.sin(u.ang) * u.raio, u.y + Math.sin(t + i) * 0.25, Math.cos(u.ang) * u.raio); ch.quaternion.copy(this.camera.quaternion); });
    }

    // Partículas
    if (!this.reduzirMovimento) this.particulas.rotation.y += dt * 0.004;

    this.renderer.render(this.cena, this.camera);
    this._raf = requestAnimationFrame(this.laco);
  };

  destruir() { cancelAnimationFrame(this._raf); this._limparShowroom(); this.prédios.forEach(p => { if (p.mesh) { p.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { const mats = Array.isArray(o.material) ? o.material : [o.material]; mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); } }); this.cena.remove(p.mesh); } }); this.renderer?.dispose(); }
}

/* ---------------------------------------------------------- helpers de texto (reutiliza do scene.js original via import ou define local) */
function desenharPainelFoto(img, indice) {
  const W = 900, H = 600; const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d");
  ctx.save(); ctx.beginPath(); ctx.roundRect(6, 6, W - 12, H - 12, 26); ctx.clip();
  if (img && img.width) { const r = Math.max(W / img.width, H / img.height); const nw = img.width * r, nh = img.height * r; ctx.drawImage(img, (W - nw) / 2, (H - nh) / 2, nw, nh); } else { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#1b1d22"); g.addColorStop(1, "#2b2417"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const grd = ctx.createLinearGradient(0, H - 190, 0, H); grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,0.6)"); ctx.fillStyle = grd; ctx.fillRect(0, H - 190, W, 190);
  ctx.fillStyle = "rgba(204,153,51,0.95)"; ctx.font = "700 26px Inter, sans-serif"; ctx.fillText(`Foto ${indice + 1}`, 30, H - 34);
  ctx.font = "500 24px Inter, sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.textAlign = "right"; ctx.fillText("clique para ampliar", W - 30, H - 34); ctx.textAlign = "left";
  ctx.restore(); ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(7, 7, W - 14, H - 14, 25); ctx.stroke();
  return c;
}
function desenharChip(rotulo, icone, cor) { const W = 460, H = 150; const c = document.createElement("canvas"); c.width = W; c.height = H; const ctx = c.getContext("2d"); ctx.save(); ctx.beginPath(); ctx.roundRect(8, 8, W - 16, H - 16, 40); ctx.clip(); ctx.fillStyle = "rgba(12,12,12,0.86)"; ctx.fillRect(0, 0, W, H); ctx.restore(); ctx.strokeStyle = cor.getStyle(); ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(8, 8, W - 16, H - 16, 40); ctx.stroke(); ctx.font = "56px Segoe UI Emoji, Apple Color Emoji, sans-serif"; ctx.textAlign = "center"; ctx.fillText(icone, 74, H / 2 + 20); ctx.textAlign = "left"; ctx.fillStyle = "#f4f1ea"; ctx.font = "700 34px Inter, sans-serif"; let l = rotulo; while (ctx.measureText(l).width > W - 175 && l.length > 4) l = l.slice(0, -2); ctx.fillText(l === rotulo ? l : l.slice(0, -2) + "…", 130, H / 2 + 13); return c; }