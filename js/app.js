// ============================================================================
// Aplicação — interface, filtros dinâmicos, detalhe, lightbox e contatos
// ============================================================================

import {
  EMPREENDIMENTOS,
  ZONAS,
  CONSTRUTORAS,
  TIPOS,
  WHATSAPP,
  TELEFONE,
  SITE_ORIGEM,
  ICONES_LAZER,
  ICONES_DIFERENCIAIS,
} from "./data.js";
import { Mundo } from "./scene.js";

const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const estado = {
  vista: "hero", // hero | galeria | detalhe
  filtros: { zona: "todas", construtora: "todas", tipo: "todas", busca: "" },
  lista: [...EMPREENDIMENTOS],
  propriedade: null,
  fotos: [],
  fotoIdx: 0,
  grade: false,
  contatoGenerico: false,
};

let mundo = null;

/* ========================================================================== */
/*  BOOT                                                                      */
/* ========================================================================== */

async function iniciar() {
  const barra = $("#barra-progresso span");
  const pct = $("#pct-loading");
  const dica = $("#dica-loading");
  const dicas = [
    "Preparando a cidade 3D…",
    "Ajustando a iluminação dourada…",
    "Posicionando os 14 empreendimentos…",
    "Carregando as fotos originais…",
  ];
  let d = 0;
  const rotador = setInterval(() => dica.textContent = dicas[d++ % dicas.length], 1600);
  dica.textContent = dicas[0];

  const progresso = (v, texto) => {
    barra.style.width = `${Math.round(v * 100)}%`;
    pct.textContent = `${Math.round(v * 100)}%`;
    if (texto) dica.textContent = texto;
  };

  const canvas = $("#scene");
  const ehMobile = window.innerWidth < 820 || (navigator.maxTouchPoints || 0) > 1;
  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  try {
    mundo = new Mundo(canvas, { mobile: ehMobile, reduzirMovimento: reduzir });
    mundo.eventos = {
      aoSelecionar: (prop) => abrirDetalhe(prop),
      aoFoto: (i) => abrirLightbox(i),
      aoPassear: (prop) => destacarDock(prop),
      aoSeta: (dir) => navegar(dir),
    };
    await mundo.iniciar(progresso);
    mundo.irParaHero();
  } catch (erro) {
    console.error("WebGL indisponível:", erro);
    clearInterval(rotador);
    $("#loader").classList.add("oculto");
    montarGrade();
    $("#fallback").classList.add("ativo");
    toast("Seu navegador não suportou o 3D — mostrando a versão em grade.", true);
    return;
  }

  clearInterval(rotador);
  progresso(1, "Tudo pronto!");

  montarFiltros();
  montarDock();
  montarGrade();
  ligarUI();

  setTimeout(() => {
    $("#loader").classList.add("oculto");
    $("#hero").classList.remove("oculto");
    // deep link direto para um empreendimento
    const hash = location.hash.replace(/^#/, "");
    const m = hash.match(/^imovel\/(.+)$/);
    if (m) {
      const prop = EMPREENDIMENTOS.find((p) => p.slug === m[1]);
      if (prop) setTimeout(() => entrarNaGaleria(prop), 500);
    }
  }, 550);
}

/* ========================================================================== */
/*  FILTROS DINÂMICOS                                                         */
/* ========================================================================== */

function filtrar() {
  const f = estado.filtros;
  const termo = f.busca.trim().toLowerCase();
  estado.lista = EMPREENDIMENTOS.filter((p) => {
    if (f.zona !== "todas" && p.zona !== f.zona) return false;
    if (f.construtora !== "todas" && p.construtora !== f.construtora) return false;
    if (f.tipo !== "todas" && !p.tipos.includes(f.tipo)) return false;
    if (termo) {
      const alvo = `${p.titulo} ${p.slogan} ${p.bairro} ${p.zona} ${p.tipologia} ${p.construtora}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });
}

function contarCom(ignorar) {
  const f = { ...estado.filtros };
  if (ignorar === "zona") f.zona = "todas";
  if (ignorar === "construtora") f.construtora = "todas";
  if (ignorar === "tipo") f.tipo = "todas";
  const termo = f.busca.trim().toLowerCase();
  return EMPREENDIMENTOS.filter((p) => {
    if (f.zona !== "todas" && p.zona !== f.zona) return false;
    if (f.construtora !== "todas" && p.construtora !== f.construtora) return false;
    if (f.tipo !== "todas" && !p.tipos.includes(f.tipo)) return false;
    if (termo && !`${p.titulo} ${p.slogan} ${p.bairro} ${p.zona} ${p.tipologia} ${p.construtora}`.toLowerCase().includes(termo))
      return false;
    return true;
  }).length;
}

function montarFiltros() {
  const grupos = [
    { rotulo: "Zona", chave: "zona", opcoes: [{ id: "todas", label: "Todas" }, ...ZONAS.map((z) => ({ id: z, label: z }))] },
    {
      rotulo: "Construtora",
      chave: "construtora",
      opcoes: [{ id: "todas", label: "Todas" }, ...CONSTRUTORAS.map((c) => ({ id: c, label: c }))],
    },
    {
      rotulo: "Tipologia",
      chave: "tipo",
      opcoes: [{ id: "todas", label: "Todas" }, ...TIPOS.map((t) => ({ id: t.id, label: t.label }))],
    },
  ];

  $("#chips-filtros").innerHTML = grupos
    .map(
      (g) => `
      <div class="grupo" role="group" aria-label="${esc(g.rotulo)}">
        <span class="rotulo">${esc(g.rotulo)}</span>
        ${g.opcoes
          .map(
            (o) => `
          <button class="chip ${estado.filtros[g.chave] === o.id ? "ativo" : ""}"
                  data-chave="${g.chave}" data-valor="${esc(o.id)}" type="button">
            ${esc(o.label)}<span class="mini-cont" data-cont="${g.chave}:${esc(o.id)}"></span>
          </button>`
          )
          .join("")}
      </div>`
    )
    .join("");

  $("#chips-filtros").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    estado.filtros[chip.dataset.chave] = chip.dataset.valor;
    atualizarUI();
  });

  $("#busca").addEventListener("input", (e) => {
    estado.filtros.busca = e.target.value;
    atualizarUI();
  });

  $("#limpar-filtros").addEventListener("click", () => {
    estado.filtros = { zona: "todas", construtora: "todas", tipo: "todas", busca: "" };
    $("#busca").value = "";
    atualizarUI();
    toast("Filtros limpos.");
  });
}

function atualizarContagens() {
  $$("[data-cont]").forEach((el) => {
    const [chave, valor] = el.dataset.cont.split(":");
    const n = contarCom(chave);
    el.textContent = estado.filtros[chave] === valor && valor !== "todas" ? "" : n ? ` ${n}` : "";
  });
}

let contadorRaf = null;
let contadorValor = 0;
function animarContador(final) {
  const alvo = $("#contador-num");
  if (!alvo) return;
  const inicio = contadorValor;
  cancelAnimationFrame(contadorRaf);
  const t0 = performance.now();
  const passo = (t) => {
    const k = Math.min((t - t0) / 420, 1);
    const v = Math.round(inicio + (final - inicio) * (1 - Math.pow(1 - k, 3)));
    alvo.textContent = v;
    if (k < 1) contadorRaf = requestAnimationFrame(passo);
    else contadorValor = final;
  };
  contadorRaf = requestAnimationFrame(passo);
}

function atualizarUI(opcoes = {}) {
  filtrar();
  $$("#chips-filtros .chip").forEach((c) =>
    c.classList.toggle("ativo", estado.filtros[c.dataset.chave] === c.dataset.valor)
  );
  atualizarContagens();

  const n = estado.lista.length;
  animarContador(n);
  $("#resultado-dinamico").innerHTML =
    n === 0
      ? `<b id="contador-num">0</b> empreendimentos <span class="separador">•</span> nenhum com esses filtros <span class="separador">•</span> <button class="chip" id="limpar-vazio" type="button">↺ limpar filtros</button>`
      : `<b id="contador-num">${n}</b> empreendimento${n > 1 ? "s" : ""} encontrado${n > 1 ? "s" : ""} <span class="separador">•</span> ${EMPREENDIMENTOS.length} no total <span class="separador">•</span> ${contarFotos()} fotos originais`;

  $("#limpar-vazio")?.addEventListener("click", () => $("#limpar-filtros").click());

  mundo?.aplicarFiltro(estado.lista);
  montarDock();
  if (estado.grade) montarGrade();

  if (!opcoes.silencioso && estado.vista === "detalhe" && estado.propriedade && !estado.lista.includes(estado.propriedade)) {
    fecharDetalhe();
    toast("O empreendimento selecionado ficou fora dos filtros.", true);
  }
}

function contarFotos() {
  return EMPREENDIMENTOS.reduce((s, p) => s + p.fotos.length, 0);
}

/* ========================================================================== */
/*  DOCK LATERAL (índice rápido)                                              */
/* ========================================================================== */

function montarDock() {
  const dock = $("#dock");
  dock.innerHTML = estado.lista
    .map(
      (p, i) => `
    <button type="button" data-slug="${esc(p.slug)}" title="${esc(p.titulo)}">
      <span class="num">${String(i + 1).padStart(2, "0")}</span>
      <span class="nome">${esc(p.titulo)}</span>
    </button>`
    )
    .join("");
  dock.onclick = (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    const prop = EMPREENDIMENTOS.find((p) => p.slug === b.dataset.slug);
    if (estado.propriedade === prop) return fecharDetalhe();
    if (dock.dataset.foco === prop.slug) abrirDetalhe(prop);
    else {
      mundo?.focarPropriedade(prop);
      destacarDock(prop);
      dock.dataset.foco = prop.slug;
      atualizarDica(`${estado.lista.indexOf(prop) + 1}/${estado.lista.length} · ${prop.titulo}`);
      toast("Clique novamente para abrir o empreendimento.");
    }
  };
}

function destacarDock(prop) {
  $$("#dock button").forEach((b) => b.classList.toggle("ativo", prop ? b.dataset.slug === prop.slug : false));
}

/* ========================================================================== */
/*  GRADE 2D (fallback + alternativa acessível)                               */
/* ========================================================================== */

function montarGrade() {
  $("#grade-2d").innerHTML = estado.lista
    .map((p) => {
      const badge =
        p.status === "Lançamento" ? "lancamento" : "obra";
      const constBadge = p.construtora === "Econ" ? "econ" : "metro";
      return `
      <button class="cartao-2d" type="button" data-slug="${esc(p.slug)}">
        <div class="foto"><img src="${esc(p.fotos[0].arquivo)}" alt="${esc(p.titulo)}" loading="lazy"></div>
        <div class="info">
          <div class="meta" style="margin-top:0;margin-bottom:10px">
            <span class="badge ${badge}">${esc(p.status)}</span>
            <span class="badge ${constBadge}">${esc(p.construtora)}</span>
          </div>
          <h3>${esc(p.titulo)}</h3>
          <div class="sub">${esc(p.slogan)}<br>${esc(p.bairro)} · ${esc(p.tipologia)}</div>
          <div class="meta">
            <span class="badge zona">${esc(p.zona)}</span>
            <span class="badge zona">${p.fotos.length} fotos</span>
          </div>
        </div>
      </button>`;
    })
    .join("");

  $("#grade-2d").onclick = (e) => {
    const c = e.target.closest(".cartao-2d");
    if (!c) return;
    const prop = EMPREENDIMENTOS.find((p) => p.slug === c.dataset.slug);
    alternarGrade(false);
    abrirDetalhe(prop);
  };
}

function alternarGrade(forcar) {
  estado.grade = forcar === undefined ? !estado.grade : forcar;
  $("#fallback").classList.toggle("ativo", estado.grade);
  $("#btn-grade").classList.toggle("ativo", estado.grade);
  if (estado.grade) montarGrade();
}

/* ========================================================================== */
/*  VISTAS: hero → galeria → detalhe                                          */
/* ========================================================================== */

function entrarNaGaleria(prop) {
  estado.vista = "galeria";
  mundo.irParaGaleria();
  $("#hero").classList.add("oculto");
  $("#filtros").classList.add("visivel");
  $("#dock").classList.add("visivel");
  $("#nav-3d").classList.add("visivel");
  $$("#topo-nav button").forEach((b) => b.classList.toggle("ativo", b.dataset.vista === "galeria"));
  atualizarUI({ silencioso: true });
  setTimeout(() => (prop ? abrirDetalhe(prop) : null), prop ? 650 : 0);
}

function abrirDetalhe(prop, semHash = false) {
  if (!prop) return;
  if (estado.vista === "hero") entrarNaGaleria();
  estado.vista = "detalhe";
  estado.propriedade = prop;
  estado.contatoGenerico = false;
  mundo.abrirDetalhe(prop);

  $("#filtros").classList.remove("visivel");
  $("#dock").classList.remove("visivel");
  $("#nav-3d").classList.remove("visivel");
  $("#rodape-info").style.opacity = "0";

  $("#painel-detalhe").innerHTML = htmlDetalhe(prop);
  $("#painel-detalhe").classList.add("aberto");
  ligarFormulario(prop);
  $("#detalhe-scroll").scrollTop = 0;
  destacarDock(prop);

  if (!semHash && location.hash !== `#imovel/${prop.slug}`) history.pushState({ slug: prop.slug }, "", `#imovel/${prop.slug}`);
}

function fecharDetalhe(semHash = false) {
  if (estado.vista !== "detalhe") return;
  estado.vista = "galeria";
  const anterior = estado.propriedade;
  estado.propriedade = null;
  mundo.fecharDetalhe();
  $("#painel-detalhe").classList.remove("aberto");
  $("#filtros").classList.add("visivel");
  $("#dock").classList.add("visivel");
  $("#nav-3d").classList.add("visivel");
  $("#rodape-info").style.opacity = "";
  $$("#topo-nav button").forEach((b) => b.classList.toggle("ativo", b.dataset.vista === "galeria"));
  if (anterior) {
    mundo.focarPropriedade(anterior);
    destacarDock(anterior);
  }
  if (!semHash && location.hash.startsWith("#imovel/")) history.pushState({}, "", location.pathname + location.search);
}

function abrirContato() {
  if (estado.vista === "hero") entrarNaGaleria();
  estado.vista = "detalhe";
  estado.contatoGenerico = true;
  estado.propriedade = null;
  mundo?.irParaGaleria();

  $("#filtros").classList.remove("visivel");
  $("#nav-3d").classList.remove("visivel");
  $("#dock").classList.add("visivel");
  $("#rodape-info").style.opacity = "0";

  $("#painel-detalhe").innerHTML = htmlContato();
  $("#painel-detalhe").classList.add("aberto");
  ligarFormulario(null);
  $$("#topo-nav button").forEach((b) => b.classList.toggle("ativo", b.dataset.vista === "contato"));
}

function navegar(dir) {
  if (estado.vista !== "galeria" || !estado.lista.length) return;
  const prop = mundo.navegar(dir);
  if (!prop) return;
  destacarDock(prop);
  $("#dock").dataset.foco = prop.slug;
  atualizarDica(`${estado.lista.indexOf(prop) + 1}/${estado.lista.length} · ${prop.titulo}`);
}

function atualizarDica(txt) {
  $("#dica-girar").textContent = txt;
}

/* ========================================================================== */
/*  HTML DO PAINEL                                                            */
/* ========================================================================== */

function htmlDetalhe(p) {
  const badgeStatus = p.status === "Lançamento" ? "lancamento" : "obra";
  const badgeConst = p.construtora === "Econ" ? "econ" : "metro";
  const idx = estado.lista.indexOf(p);

  return `
  <div class="detalhe-topo">
    <div>
      <div class="badges">
        <span class="badge ${badgeStatus}">${esc(p.status)}</span>
        <span class="badge ${badgeConst}">${esc(p.construtoraTexto)}</span>
        <span class="badge zona">${esc(p.zona)}</span>
      </div>
      <h2>${esc(p.titulo)}</h2>
      <div class="slogan">${esc(p.slogan)}</div>
    </div>
    <button class="btn-fechar" id="fechar-detalhe" type="button" aria-label="Fechar">✕</button>
  </div>

  <div class="detalhe-corpo" id="detalhe-scroll">
    <div class="endereco">📍 <span>${esc(p.endereco)}<br><b>${esc(p.tipologia)}</b></span></div>

    <div class="secao">
      <h3>Fotos originais (${p.fotos.length})</h3>
      <div class="miniaturas">
        ${p.fotos
          .map(
            (f, i) => `
          <button class="miniatura" type="button" data-foto="${i}">
            <img src="${esc(f.arquivo)}" alt="${esc(p.titulo)} — foto ${i + 1}" loading="lazy">
            <span class="zoom">⛶</span>
          </button>`
          )
          .join("")}
      </div>
    </div>

    <div class="secao">
      <h3>Sobre o empreendimento</h3>
      <p>${esc(p.sobre)}</p>
    </div>

    <div class="secao">
      <h3>Diferenciais</h3>
      <div class="lista-itens">
        ${p.diferenciais
          .map((d) => `<span class="item"><span class="ico">${ICONES_DIFERENCIAIS[d] || "⭐"}</span>${esc(d)}</span>`)
          .join("")}
      </div>
    </div>

    <div class="secao">
      <h3>Lazer e infraestrutura</h3>
      <div class="lista-itens">
        ${p.lazer
          .map((l) => `<span class="item"><span class="ico">${ICONES_LAZER[l] || "✨"}</span>${esc(l)}</span>`)
          .join("")}
      </div>
    </div>

    <div class="secao">
      <h3>Localização</h3>
      <p>📍 ${esc(p.endereco)}<br>${esc(p.zona)} • ${esc(p.bairro)}</p>
      <a class="btn btn-sm" style="margin-top:12px" target="_blank" rel="noopener"
         href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.endereco)}">
         Abrir no Google Maps ↗
      </a>
    </div>

    <div class="secao" id="contato">
      <h3>Entre em contato</h3>
      <p style="margin-bottom:14px">Preencha o formulário e receba informações exclusivas</p>
      ${formularioHTML(`Olá, gostaria de saber mais sobre o empreendimento ${p.titulo}.`, p.titulo)}
      <div class="contato-direto">
        <a class="zap" href="${linkWhats(`Olá! Tenho interesse no empreendimento ${p.titulo}.`)}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <a href="tel:+${WHATSAPP}">📞 ${TELEFONE}</a>
      </div>
    </div>
  </div>

  <div class="detalhe-rodape">
    <button class="btn" type="button" id="btn-anterior" ${idx <= 0 ? "disabled" : ""}>← Anterior</button>
    <button class="btn btn-ouro" type="button" id="btn-proximo" ${idx >= estado.lista.length - 1 ? "disabled" : ""}>Próximo →</button>
  </div>`;
}

function htmlContato() {
  return `
  <div class="detalhe-topo">
    <div>
      <div class="badges"><span class="badge lancamento">Atendimento</span><span class="badge zona">${EMPREENDIMENTOS.length} empreendimentos</span></div>
      <h2>Fale com a gente</h2>
      <div class="slogan">Encontre seu imóvel ideal em São Paulo</div>
    </div>
    <button class="btn-fechar" id="fechar-detalhe" type="button" aria-label="Fechar">✕</button>
  </div>
  <div class="detalhe-corpo" id="detalhe-scroll">
    <div class="secao">
      <h3>Atendimento</h3>
      <p>Tire dúvidas sobre lançamentos, condições de financiamento e agende uma visita aos ${EMPREENDIMENTOS.length} empreendimentos selecionados — Econ e Metrocasa.</p>
      <div class="contato-direto" style="margin-top:14px">
        <a class="zap" href="${linkWhats("Olá! Gostaria de informações sobre os empreendimentos.")}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <a href="tel:+${WHATSAPP}">📞 ${TELEFONE}</a>
      </div>
    </div>
    <div class="secao">
      <h3>Envie sua mensagem</h3>
      ${formularioHTML("Olá, gostaria de receber informações sobre os empreendimentos disponíveis.", "Portal")}
    </div>
    <div class="secao">
      <h3>Cobertura</h3>
      <div class="lista-itens">
        ${ZONAS.map((z) => `<span class="item"><span class="ico">📍</span>${esc(z)}</span>`).join("")}
      </div>
    </div>
    <div class="secao">
      <h3>Visite o site original</h3>
      <p>Versão 3D interativa do portal original.</p>
      <a class="btn btn-sm" style="margin-top:12px" href="${SITE_ORIGEM}" target="_blank" rel="noopener">Abrir site original ↗</a>
    </div>
  </div>`;
}

function formularioHTML(msg, contexto) {
  return `
  <form class="form" id="form-contato" novalidate>
    <div class="form-linha">
      <div class="campo" data-campo="nome">
        <label for="f-nome">Nome</label>
        <input id="f-nome" name="nome" type="text" placeholder="Seu nome" autocomplete="name">
        <span class="msg-erro">Informe seu nome.</span>
      </div>
      <div class="campo" data-campo="telefone">
        <label for="f-fone">Telefone</label>
        <input id="f-fone" name="telefone" type="tel" placeholder="(11) 99999-9999" autocomplete="tel">
        <span class="msg-erro">Telefone incompleto.</span>
      </div>
    </div>
    <div class="campo" data-campo="email">
      <label for="f-email">E-mail (opcional)</label>
      <input id="f-email" name="email" type="email" placeholder="voce@email.com" autocomplete="email">
      <span class="msg-erro">E-mail inválido.</span>
    </div>
    <div class="campo" data-campo="mensagem">
      <label for="f-msg">Mensagem</label>
      <textarea id="f-msg" name="mensagem">${esc(msg)}</textarea>
      <span class="msg-erro">Escreva uma mensagem.</span>
    </div>
    <button class="btn btn-ouro" type="submit" style="justify-content:center">Enviar Mensagem →</button>
    <input type="hidden" name="contexto" value="${esc(contexto)}">
  </form>`;
}

/* ========================================================================== */
/*  FORMULÁRIO / WHATSAPP                                                     */
/* ========================================================================== */

function linkWhats(texto) {
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

function ligarFormulario(prop) {
  $("#fechar-detalhe")?.addEventListener("click", () => (estado.contatoGenerico ? fecharContato() : fecharDetalhe()));

  $$(".miniatura").forEach((m) =>
    m.addEventListener("click", () => abrirLightbox(parseInt(m.dataset.foto, 10)))
  );

  $("#btn-anterior")?.addEventListener("click", () => navegarDetalhe(-1));
  $("#btn-proximo")?.addEventListener("click", () => navegarDetalhe(1));

  const form = $("#form-contato");
  if (!form) return;

  form.querySelector("[name=telefone]").addEventListener("input", (e) => {
    e.target.value = mascararTelefone(e.target.value);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form).entries());
    const erros = validar(dados);
    $$(".campo", form).forEach((c) => c.classList.toggle("erro", erros.includes(c.dataset.campo)));
    if (erros.length) {
      toast("Confira os campos destacados.", true);
      form.querySelector(".campo.erro input, .campo.erro textarea")?.focus();
      return;
    }

    const texto =
      `*Contato pelo site 3D*%0A` +
      `Nome: ${dados.nome}%0A` +
      `Telefone: ${dados.telefone}%0A` +
      (dados.email ? `E-mail: ${dados.email}%0A` : "") +
      `Assunto: ${dados.contexto}%0A%0A` +
      `${encodeURIComponent(dados.mensagem)}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${texto}`, "_blank", "noopener");
    toast(`Mensagem preparada no WhatsApp para ${dados.nome.split(" ")[0]}! ✔`);
    form.reset();
    if (prop) form.querySelector("[name=mensagem]").value = `Olá, gostaria de saber mais sobre o empreendimento ${prop.titulo}.`;
  });
}

function validar(d) {
  const erros = [];
  if (!d.nome || d.nome.trim().length < 2) erros.push("nome");
  const digitos = (d.telefone || "").replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13) erros.push("telefone");
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) erros.push("email");
  if (!d.mensagem || d.mensagem.trim().length < 5) erros.push("mensagem");
  return erros;
}

function mascararTelefone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function fecharContato() {
  fecharDetalhe(true);
}

function navegarDetalhe(dir) {
  const idx = estado.lista.indexOf(estado.propriedade);
  const novo = estado.lista[idx + dir];
  if (!novo) return;
  abrirDetalhe(novo);
}

/* ========================================================================== */
/*  LIGHTBOX                                                                  */
/* ========================================================================== */

function abrirLightbox(indice) {
  const p = estado.propriedade;
  if (!p) return;
  estado.fotos = p.fotos;
  estado.fotoIdx = indice;
  renderLightbox();
  $("#lightbox").classList.add("aberto");
}

function renderLightbox() {
  const p = estado.propriedade;
  const f = estado.fotos[estado.fotoIdx];
  if (!f) return;
  $("#lb-img").src = f.arquivo;
  $("#lb-img").alt = `${p?.titulo || ""} — foto ${estado.fotoIdx + 1}`;
  $("#lb-cap").innerHTML = `${esc(p?.titulo || "")} — foto ${estado.fotoIdx + 1} de ${estado.fotos.length}
    <span class="fonte">foto original · ${esc(f.fonte)}</span>`;
  $("#lb-cont").textContent = `${estado.fotoIdx + 1} / ${estado.fotos.length}`;
  const multi = estado.fotos.length > 1;
  $("#lb-prev").style.display = multi ? "grid" : "none";
  $("#lb-next").style.display = multi ? "grid" : "none";
}

function moverLightbox(dir) {
  estado.fotoIdx = (estado.fotoIdx + dir + estado.fotos.length) % estado.fotos.length;
  renderLightbox();
}

function fecharLightbox() {
  $("#lightbox").classList.remove("aberto");
}

/* ========================================================================== */
/*  TOAST                                                                     */
/* ========================================================================== */

let toastTimer = null;
function toast(msg, aviso = false) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.toggle("aviso", aviso);
  el.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visivel"), 3400);
}

/* ========================================================================== */
/*  LIGA A INTERFACE                                                          */
/* ========================================================================== */

function ligarUI() {
  $("#btn-explorar").addEventListener("click", () => entrarNaGaleria());
  $("#btn-contato-hero").addEventListener("click", () => abrirContato());
  $("#contagem-hero").textContent = EMPREENDIMENTOS.length;
  $("#fotos-hero").textContent = contarFotos();

  $("#btn-explorar-topo").addEventListener("click", () => entrarNaGaleria());
  $("#btn-grade").addEventListener("click", () => alternarGrade());
  $("#btn-contato-topo").addEventListener("click", () => abrirContato());

  $("#anterior-anel").addEventListener("click", () => navegar(-1));
  $("#proximo-anel").addEventListener("click", () => navegar(1));

  $("#lb-prev").addEventListener("click", () => moverLightbox(-1));
  $("#lb-next").addEventListener("click", () => moverLightbox(1));
  $("#lb-fechar").addEventListener("click", fecharLightbox);
  $("#lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") fecharLightbox();
  });

  window.addEventListener("keydown", (e) => {
    if ($("#lightbox").classList.contains("aberto")) {
      if (e.key === "Escape") fecharLightbox();
      if (e.key === "ArrowRight") moverLightbox(1);
      if (e.key === "ArrowLeft") moverLightbox(-1);
      return;
    }
    if (e.key === "Escape") {
      if (estado.grade) alternarGrade(false);
      else if (estado.contatoGenerico) fecharContato();
      else if (estado.vista === "detalhe") fecharDetalhe();
      else if (estado.vista === "galeria") {
        estado.vista = "hero";
        mundo.irParaHero();
        $("#hero").classList.remove("oculto");
        $("#filtros").classList.remove("visivel");
        $("#dock").classList.remove("visivel");
        $("#nav-3d").classList.remove("visivel");
        $$("#topo-nav button").forEach((b) => b.classList.remove("ativo"));
      }
    }
  });

  window.addEventListener("popstate", () => {
    const hash = location.hash.replace(/^#/, "");
    const m = hash.match(/^imovel\/(.+)$/);
    if (m) {
      const prop = EMPREENDIMENTOS.find((p) => p.slug === m[1]);
      if (prop) abrirDetalhe(prop, true);
    } else if (estado.vista === "detalhe") fecharDetalhe(true);
  });

  // arraste horizontal no painel de detalhe no mobile → fechar
  let xToque = null;
  const painel = $("#painel-detalhe");
  painel.addEventListener("touchstart", (e) => (xToque = e.touches[0].clientX), { passive: true });
  painel.addEventListener(
    "touchend",
    (e) => {
      if (xToque === null) return;
      const dx = e.changedTouches[0].clientX - xToque;
      const alvo = e.target.closest(".detalhe-corpo");
      if (dx > 90 && alvo && alvo.scrollTop <= 4 && !estado.contatoGenerico) fecharDetalhe();
      xToque = null;
    },
    { passive: true }
  );

  atualizarUI({ silencioso: true });
}

iniciar();

// Gancho de depuração/teste (não afeta a interface)
window.__dwelling = {
  estado,
  abrirDetalhe,
  entrarNaGaleria,
  fecharDetalhe,
  atualizarUI,
  mundo: () => mundo,
};
