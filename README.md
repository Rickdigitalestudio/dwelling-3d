# Dwelling 3D — Portal de Empreendimentos Imobiliários em 3D

Versão interativa e imersiva do portal de empreendimentos da **Econ** e **Metrocasa** em São Paulo, construída com **Three.js** (r161) e vanilla ES Modules — 100% offline, sem build, sem dependências externas além do Three.js incluído.

🔗 **Demo online (GitHub Pages)**: https://SEU-USUARIO.github.io/dwelling-3d/  
🔗 **Portal original**: https://dwelling-shine-show.lovable.app/

---

## ✨ Destaques

| Funcionalidade | Descrição |
|----------------|-----------|
| **Cidade 3D procedural** | Skyline de São Paulo com torres iluminadas, estrelas, brilho dourado dinâmico |
| **Carrossel orbital** | 14 cards com as **fotos originais** dos empreendimentos — arraste, teclas ← →, auto-rotação |
| **Showroom por empreendimento** | Torre 3D gerada na hora, painéis de fotos originais, chips de lazer em órbita, título 3D |
| **Filtros dinâmicos** | Zona (6), Construtora (2), Tipologia (4), busca textual — atualiza a cena 3D em tempo real |
| **Lightbox** | Amplia as fotos originais com navegação e crédito da fonte |
| **Formulário WhatsApp** | Validação client-side, abre WhatsApp pré-preenchido |
| **Grade 2D acessível** | Fallback leve e alternativa para acessibilidade |
| **Deep links** | `#imovel/<slug>` abre direto no detalhe; histórico do navegador |
| **Responsivo** | Mobile-first, touch nativo, `prefers-reduced-motion` respeitado |

---

## 📦 Estrutura

```
dwelling-3d/
├── index.html                 # Entry point
├── css/style.css              # Estilos completos (paleta original #0a0a0a + #cc9933)
├── js/
│   ├── data.js                # 14 empreendimentos, 42 fotos, metadata tipada
│   ├── scene.js               # Mundo 3D (Three.js): cidade, carrossel, showroom
│   ├── app.js                 # UI, filtros, painel, lightbox, formulário
│   └── verificar.mjs          # Validação automática do projeto
├── vendor/three.module.js     # Three.js r161 local (ESM)
├── img/                       # 42 fotos originais (byte a byte do site original)
├── baixar-fotos.ps1           # Script PowerShell para baixar as originais
├── .github/workflows/pages.yml # Deploy automático no GitHub Pages
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## 🚀 Como rodar localmente

```bash
# Clonar
git clone https://github.com/SEU-USUARIO/dwelling-3d.git
cd dwelling-3d

# Opção 1: Python (recomendado, já testado)
python -m http.server 8099 --bind 127.0.0.1
# Abra http://127.0.0.1:8099/

# Opção 2: Node (serve)
npx serve .

# Opção 3: VS Code Live Server
# Clique com botão direito em index.html → "Open with Live Server"
```

> **Não precisa de build, bundler, npm install, nem variáveis de ambiente.**  
> Apenas um servidor estático qualquer — o `importmap` no HTML resolve o Three.js local.

---

## 🖼️ Fotos originais

As 42 imagens em `img/` são **cópias exatas (byte a byte)** das usadas no portal original:

- **Unsplash** (CORS `*`): hotlink permitido, mas baixadas para funcionar offline
- **files.grupometrocasa.com** e **econ-portal-static.s3**: sem CORS — **necessário local** para texturas WebGL

Para rebaixar/atualizar:
```powershell
# Windows (PowerShell)
.\baixar-fotos.ps1
```
O script pula arquivos já existentes e reporta falhas (ex.: uma foto do Clube Cangaíba retorna 404 no servidor de origem).

---

## 🌐 Deploy no GitHub Pages

O workflow `.github/workflows/pages.yml` publica automaticamente na branch `gh-pages` a cada push em `main`.

1. Crie o repositório no GitHub (público ou privado)
2. Ative **Settings → Pages → Source: GitHub Actions**
3. Faça push:
```bash
git init
git add .
git commit -m "feat: versão inicial do Dwelling 3D"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/dwelling-3d.git
git push -u origin main
```
4. Acesse `https://SEU-USUARIO.github.io/dwelling-3d/` após o workflow concluir (≈ 1 min).

---

## ♿ Acessibilidade

- Navegação por teclado (Tab, Enter, Esc, ← →)
- `aria-label`, `role`, `aria-modal` nos componentes
- Contraste WCAG AA (preto #0a0a0a + dourado #cc9933 + branco #f4f1ea)
- `prefers-reduced-motion`: desliga animações contínuas
- Grade 2D semântica como alternativa

---

## 🧪 Validação

```bash
node verificar.mjs
# ✔ 122 verificações: arquivos, imports/exports, IDs, fotos, slugs únicos, etc.
```

---

## 📄 Licença

MIT — veja [LICENSE](LICENSE).  
As **fotos originais** pertencem aos respectivos autores/serviços (Unsplash, Grupo Metrocasa, Econ) e são usadas apenas para demonstração do portal. Substitua por suas próprias imagens em produção.

---

## 🙏 Créditos

- **Portal original**: [Dwelling Shine Show (Lovable)](https://dwelling-shine-show.lovable.app/)
- **Three.js**: https://threejs.org/ (r161, licença MIT)
- **Fotos**: Unsplash, Grupo Metrocasa, Econ Construtora
- **Ícones**: Emoji nativos do sistema (sem font-icon)

---

## 🤝 Contribuindo

1. Fork → branch `feature/nome` → PR
2. Mantenha vanilla ES Modules (sem bundler)
3. Testes: `node verificar.mjs` + abrir no navegador
4. Commits semânticos (`feat:`, `fix:`, `chore:`, `docs:`)

---

> Feito com ☕ e Three.js — explore São Paulo em 3D.