# Trufflehog Browser Extension

Browser extension that scans web pages for leaked credentials, API keys, secrets, exposed source maps, and cloud storage buckets. Compatible with Firefox and Chrome (Manifest V3).

> **Original by [Truffle Security](https://trufflesecurity.com)** — Fork maintained by [Cr0wtl3r](https://github.com/Cr0wtl3r/Trufflehog-Extension)

---

# English

## Overview

Trufflehog detects credentials and secrets exposed on web pages during navigation. It analyzes page HTML, external JavaScript files (including inline script references), and can probe for `.env` and `.git/config` files. It also extracts API endpoints and detects exposed source maps and cloud storage buckets.

## Features

- **Secret Detection** — 40+ regex patterns for specific services (Slack, AWS, GitHub, OpenAI, Anthropic, Discord, Stripe, JWT, GitLab, NPM, Docker, SendGrid, etc.)
- **Generic Secrets** — Catches `api_key`, `secret`, and similar patterns
- **AWS Keys** — Detects AKIA/ASIA/AGPA and other AWS key prefixes
- **High Entropy Strings** — Optional deep scan for random-looking strings (may increase false positives)
- **Code Heuristics** — Detects TODO security comments, AI-generated code markers, hardcoded passwords, and insecure code flags
- **Endpoint Extraction** — Scans for API paths and URLs in pages and scripts
- **Exposed Source Maps** — Detects `.map` files referenced in JavaScript bundles, stored as findings
- **Exposed Cloud Buckets** — Detects S3, GCS, Azure Blob, and DigitalOcean Spaces URLs, stored as findings
- **Optional Checks** — `.env` files, `.git` directories (may trigger WAF)
- **Match Deny List** — User-configurable list to ignore specific patterns or service names in findings
- **Origin Deny List** — Skip scanning for specific domains
- **Full Report Page** — Detailed page with all findings and endpoints
- **CSV Export** — Properly escaped (RFC 4180) export for findings and endpoints
- **Dark Theme** — Red team-styled interface
- **Bilingual** — English and Portuguese (PT-BR), selectable in the popup

## Installation

### Firefox

1. Clone or download this repository
2. Run `npm install` then `node create-icons.js` to generate icons in `assets/`
3. Open Firefox → `about:debugging` → **This Firefox** → **Load Temporary Add-on...**
4. Select the `manifest.json` file

> For permanent installation, use [Firefox Add-ons](https://addons.mozilla.org).

### Chrome

1. Clone or download this repository
2. Run `npm install` then `node create-icons.js` to generate icons in `assets/`
3. Open Chrome → Extensions → Developer mode → Load unpacked
4. Select the project folder

## Usage

1. Browse normally — the extension scans pages automatically
2. Click the extension icon to open the popup
3. Configure detection toggles (Generic Secrets, High Entropy, Code Heuristics, Endpoints, Specific Secrets, AWS Keys, etc.)
4. Use **Origin Deny List** to skip scanning certain domains
5. Use **Match Deny List** to ignore specific strings in findings (e.g. `Cohere`, `AAAAAAA`, known test keys)
6. View findings and endpoints in their sections
7. Click a finding/endpoint or **View Full Report** for the detailed report page
8. Export to CSV when needed

## Project Structure

```
├── assets/              # Icons (source + generated sizes)
├── background.js        # Core detection logic
├── inject.js            # Content script injected into pages
├── popup.html/js/css    # Extension popup UI
├── findings.html/js     # Full report page
├── manifest.json        # Extension manifest (MV3)
├── create-icons.js      # Icon generation script (requires sharp)
└── package.json         # Project metadata
```

## What to Do When You Find Keys

### AWS keys
AWS has a rich API. Listing buckets is a good start:
https://docs.aws.amazon.com/cli/latest/reference/s3api/list-buckets.html

### Slack webhooks
These are almost always a problem:
https://cybersecurity.att.com/blogs/labs-research/slack-phishing-attacks-using-webhooks

### JSON Web Tokens (JWT)
JWT secrets can be cracked in hashcat if the algorithm is `hs`.
- Decode: https://jwt.io/
- Crack: https://hashcat.net/wiki/doku.php?id=example_hashes with flag `-m 16500`

## Resources

- **Talk**: https://www.youtube.com/watch?v=i9b5Yij_HV4
- **Community**: https://join.slack.com/t/trufflehog-community/shared_invite/zt-nzznzf8w-y1Lg4PnnLupzlYuwq_AUHA
- **Homepage**: https://trufflesecurity.com

---

# Português (pt-BR)

## Visão Geral

O Trufflehog detecta credenciais e segredos expostos em páginas web durante a navegação. Analisa o HTML da página, scripts JavaScript externos (incluindo referências inline) e pode verificar arquivos `.env` e `.git/config`. Também extrai endpoints de API e detecta source maps e buckets de nuvem expostos.

## Funcionalidades

- **Detecção de Secrets** — 40+ padrões regex para serviços específicos (Slack, AWS, GitHub, OpenAI, Anthropic, Discord, Stripe, JWT, GitLab, NPM, Docker, SendGrid, etc.)
- **Secrets Genéricos** — Captura padrões `api_key`, `secret` e similares
- **Chaves AWS** — Detecta AKIA/ASIA/AGPA e outros prefixos de chaves AWS
- **Strings de Alta Entropia** — Scan profundo opcional para strings aleatórias (pode aumentar falsos positivos)
- **Heurísticas de Código** — Detecta TODOs de segurança, marcadores de código gerado por IA, senhas hardcoded e flags de código inseguro
- **Extração de Endpoints** — Busca caminhos e URLs de API em páginas e scripts
- **Source Maps Expostos** — Detecta arquivos `.map` referenciados em bundles JavaScript, armazenados como achados
- **Buckets de Nuvem Expostos** — Detecta URLs de S3, GCS, Azure Blob e DigitalOcean Spaces, armazenados como achados
- **Verificações Opcionais** — Arquivos `.env`, diretórios `.git` (podem acionar WAF)
- **Lista de Negação de Padrões** — Lista configurável para ignorar padrões ou nomes de serviços específicos nos achados
- **Lista de Origens Negadas** — Ignorar escaneamento de domínios específicos
- **Página de Relatório** — Página detalhada com todos os achados e endpoints
- **Exportação CSV** — Exportação com escape adequado (RFC 4180) para achados e endpoints
- **Tema Escuro** — Interface com estilo red team
- **Bilíngue** — Inglês e Português (PT-BR), selecionável no popup

## Instalação

### Firefox

1. Clone ou baixe este repositório
2. Execute `npm install` e depois `node create-icons.js` para gerar ícones em `assets/`
3. Abra o Firefox → `about:debugging` → **Este Firefox** → **Carregar extensão temporária...**
4. Selecione o arquivo `manifest.json`

> Para instalação permanente, use [Complementos do Firefox](https://addons.mozilla.org).

### Chrome

1. Clone ou baixe este repositório
2. Execute `npm install` e depois `node create-icons.js` para gerar ícones em `assets/`
3. Abra o Chrome → Extensões → Modo do desenvolvedor → Carregar sem compactação
4. Selecione a pasta do projeto

## Uso

1. Navegue normalmente — a extensão escaneia as páginas automaticamente
2. Clique no ícone da extensão para abrir o popup
3. Configure os toggles de detecção (Secrets genéricos, Alta entropia, Heurísticas de código, Endpoints, Secrets específicos, Chaves AWS, etc.)
4. Use **Lista de origens negadas** para não escanear determinados domínios
5. Use **Lista de negação de padrões** para ignorar strings específicas nos achados (ex: `Cohere`, `AAAAAAA`, chaves de teste conhecidas)
6. Consulte os achados e endpoints nas respectivas seções
7. Clique em um achado/endpoint ou em **Ver relatório completo** para a página de relatório detalhada
8. Exporte para CSV quando necessário

## Estrutura do Projeto

```
├── assets/              # Ícones (fonte + tamanhos gerados)
├── background.js        # Lógica central de detecção
├── inject.js            # Content script injetado nas páginas
├── popup.html/js/css    # UI do popup da extensão
├── findings.html/js     # Página de relatório completo
├── manifest.json        # Manifesto da extensão (MV3)
├── create-icons.js      # Script de geração de ícones (requer sharp)
└── package.json         # Metadados do projeto
```

## O que Fazer ao Encontrar Chaves

### Chaves AWS
A AWS tem uma API ampla. Listar buckets é um bom começo:
https://docs.aws.amazon.com/cli/latest/reference/s3api/list-buckets.html

### Webhooks do Slack
Geralmente são um problema:
https://cybersecurity.att.com/blogs/labs-research/slack-phishing-attacks-using-webhooks

### JSON Web Tokens (JWT)
Secrets de JWT podem ser quebrados no hashcat se o algoritmo for `hs`.
- Decodificar: https://jwt.io/
- Quebrar: https://hashcat.net/wiki/doku.php?id=example_hashes com flag `-m 16500`

## Recursos

- **Apresentação**: https://www.youtube.com/watch?v=i9b5Yij_HV4
- **Comunidade**: https://join.slack.com/t/trufflehog-community/shared_invite/zt-nzznzf8w-y1Lg4PnnLupzlYuwq_AUHA
- **Site**: https://trufflesecurity.com

---

## License

See [LICENSE](LICENSE).
