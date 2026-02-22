const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const i18n = {
    en: {
        navBack: "← Close",
        reportSubtitle: "All findings and endpoints",
        findingsSection: "Findings (Credentials)",
        endpointsSection: "Endpoints",
        noFindings: "No findings recorded",
        noEndpoints: "No endpoints recorded",
        foundIn: "Found in",
        parentPage: "Parent page",
        decodedFrom: "Decoded from Base64",
        sourceFile: "Source",
        deniedSection: "Denied (hidden from popup)",
        searchPlaceholder: "🔍 Search findings and endpoints...",
        exportTxt: "📄 Export Keys (.txt)",
        exportEndpointsTxt: "📄 Export Endpoints (.txt)",
        selectAll: "☑ Select All"
    },
    pt: {
        navBack: "← Fechar",
        reportSubtitle: "Todos os achados e endpoints",
        findingsSection: "Achados (Credenciais)",
        endpointsSection: "Endpoints",
        noFindings: "Nenhum achado registrado",
        noEndpoints: "Nenhum endpoint registrado",
        foundIn: "Encontrado em",
        parentPage: "Página de origem",
        decodedFrom: "Decodificado de Base64",
        sourceFile: "Fonte",
        deniedSection: "Negados (ocultos do popup)",
        searchPlaceholder: "🔍 Pesquisar achados e endpoints...",
        exportTxt: "📄 Exportar Chaves (.txt)",
        exportEndpointsTxt: "📄 Exportar Endpoints (.txt)",
        selectAll: "☑ Selecionar Todos"
    }
};

function htmlEscape(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function makeFindingId(origin, f, idx) {
    return "f-" + btoa(unescape(encodeURIComponent(origin + f.key + f.match + f.src))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24) + idx;
}

function isMatchDenied(matchText, keyName, denyList) {
    return denyList.some(denied => {
        if (!denied) return false;
        const dl = denied.toLowerCase();
        const kl = keyName.toLowerCase();
        if (kl === dl || kl.includes(dl)) return true;
        return matchText === denied || (denied.length > 3 && matchText.includes(denied));
    });
}

function applyTranslations(lang) {
    const t = i18n[lang] || i18n.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (t[key]) el.placeholder = t[key];
    });
    const sub = document.getElementById("reportSubtitle");
    if (sub && t.reportSubtitle) sub.textContent = t.reportSubtitle;
    const nav = document.getElementById("navBack");
    if (nav && t.navBack) nav.textContent = t.navBack;
}

function renderFindingCard(f, t, id, denied) {
    const cls = denied ? "finding-card denied-card" : "finding-card";
    let html = '<div class="' + cls + '" id="' + id + '">';
    html += '<input type="checkbox" class="card-check finding-check">';
    html += '<div class="card-body">';
    html += '<div class="type">' + htmlEscape(f.key);
    if (denied) html += '<span class="denied-label">denied</span>';
    html += '</div>';
    html += '<div class="match">' + htmlEscape(f.match) + '</div>';
    html += '<div class="meta">' + t.foundIn + ': ' + htmlEscape(f.src) + '</div>';
    html += '<div class="meta">' + t.parentPage + ': ' + htmlEscape(f.parentUrl) + '</div>';
    if (f.encoded) html += '<div class="meta">' + t.decodedFrom + ': ' + htmlEscape(String(f.encoded).substring(0, 30)) + '...</div>';
    html += '</div></div>';
    return html;
}

function render() {
    browserAPI.storage.sync.get(["lang", "matchDenyList"], function (syncResult) {
        const lang = syncResult.lang || "en";
        applyTranslations(lang);
        const t = i18n[lang] || i18n.en;
        const denyList = Array.isArray(syncResult.matchDenyList) ? syncResult.matchDenyList : [];

        browserAPI.storage.local.get(["leakedKeys"], function (result) {
            const leakedKeys = result.leakedKeys || {};
            const findingsEl = document.getElementById("findingsContent");
            let html = "";

            for (const origin in leakedKeys) {
                const findings = leakedKeys[origin];
                if (!findings.length) continue;

                const visible = [];
                const denied = [];
                findings.forEach((f, idx) => {
                    const fid = makeFindingId(origin, f, idx);
                    if (isMatchDenied(f.match, f.key, denyList)) {
                        denied.push({ f, fid });
                    } else {
                        visible.push({ f, fid });
                    }
                });

                if (!visible.length && !denied.length) continue;

                const count = visible.length + (denied.length ? " + " + denied.length + " denied" : "");
                html += '<details class="origin-dropdown" open>';
                html += '<summary class="origin-summary">' + htmlEscape(origin) + '<span class="badge" data-original-count="' + count + '">(' + count + ')</span></summary>';
                html += '<div class="origin-body">';

                for (const item of visible) {
                    html += renderFindingCard(item.f, t, item.fid, false);
                }

                if (denied.length) {
                    html += '<div class="denied-separator">' + t.deniedSection + ' (' + denied.length + ')</div>';
                    for (const item of denied) {
                        html += renderFindingCard(item.f, t, item.fid, true);
                    }
                }

                html += '</div></details>';
            }
            findingsEl.innerHTML = html || '<div class="empty-msg">' + t.noFindings + '</div>';
        });

        browserAPI.storage.local.get(["endpoints"], function (result) {
            const endpoints = result.endpoints || {};
            const epEl = document.getElementById("endpointsContent");
            let html = "";

            for (const origin in endpoints) {
                const list = endpoints[origin];
                if (!list.length) continue;

                html += '<details class="origin-dropdown">';
                html += '<summary class="origin-summary">' + htmlEscape(origin) + '<span class="badge" data-original-count="' + list.length + '">(' + list.length + ')</span></summary>';
                html += '<div class="origin-body">';

                for (const ep of list) {
                    html += '<div class="endpoint-card">';
                    html += '<input type="checkbox" class="card-check endpoint-check" checked>';
                    html += '<div class="card-body">';
                    html += '<div class="url">' + htmlEscape(ep.url) + '</div>';
                    html += '<div class="src">' + t.sourceFile + ': ' + htmlEscape(ep.src) + '</div>';
                    html += '</div></div>';
                }

                html += '</div></details>';
            }
            epEl.innerHTML = html || '<div class="empty-msg">' + t.noEndpoints + '</div>';

            scrollToHash();
            updateSelectedCounts();
        });
    });
}

function scrollToHash() {
    const hash = window.location.hash.substring(1);
    if (!hash) return;
    setTimeout(function () {
        const target = document.getElementById(hash);
        if (target) {
            const parent = target.closest('.origin-dropdown');
            if (parent) parent.open = true;
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('highlight-card');
        }
    }, 200);
}

function updateSelectedCounts() {
    let findingsCount = 0;
    document.querySelectorAll('#findingsSection .finding-card:not(.hidden-by-search):not(.denied-card)').forEach(card => {
        const dropdown = card.closest('.origin-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden-origin')) {
            const check = card.querySelector('.finding-check');
            if (check && check.checked) findingsCount++;
        }
    });
    const fCountEl = document.getElementById('findingsCount');
    if (fCountEl) fCountEl.textContent = findingsCount > 0 ? ` (${findingsCount})` : '';

    let endpointsCount = 0;
    document.querySelectorAll('#endpointsSection .endpoint-card:not(.hidden-by-search)').forEach(card => {
        const dropdown = card.closest('.origin-dropdown');
        if (dropdown && !dropdown.classList.contains('hidden-origin')) {
            const check = card.querySelector('.endpoint-check');
            if (check && check.checked) endpointsCount++;
        }
    });
    const eCountEl = document.getElementById('endpointsCount');
    if (eCountEl) eCountEl.textContent = endpointsCount > 0 ? ` (${endpointsCount})` : '';
}

document.addEventListener('change', function (e) {
    if (e.target.classList.contains('finding-check') || e.target.classList.contains('endpoint-check')) {
        updateSelectedCounts();
    }
});

document.getElementById("searchBar").addEventListener("input", function () {
    const query = this.value.toLowerCase().trim();
    document.querySelectorAll(".finding-card, .endpoint-card").forEach(card => {
        const text = card.textContent.toLowerCase();
        card.classList.toggle("hidden-by-search", query && !text.includes(query));
    });
    document.querySelectorAll(".origin-dropdown").forEach(dropdown => {
        const visibleCards = dropdown.querySelectorAll(".finding-card:not(.hidden-by-search), .endpoint-card:not(.hidden-by-search)");
        dropdown.classList.toggle("hidden-origin", query && visibleCards.length === 0);
        if (query && visibleCards.length > 0) dropdown.open = true;

        const badge = dropdown.querySelector('.badge');
        if (badge) {
            if (query) {
                badge.textContent = `(${visibleCards.length})`;
            } else {
                badge.textContent = `(${badge.getAttribute('data-original-count')})`;
            }
        }
    });
    updateSelectedCounts();
});

function downloadTxt(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('exportFindingsTxt').addEventListener('click', function () {
    const cards = document.querySelectorAll('#findingsSection .finding-card:not(.denied-card)');
    const lines = [];
    cards.forEach(card => {
        if (card.classList.contains('hidden-by-search')) return;
        const dropdown = card.closest('.origin-dropdown');
        if (dropdown && dropdown.classList.contains('hidden-origin')) return;
        const check = card.querySelector('.finding-check');
        if (check && !check.checked) return;
        const matchEl = card.querySelector('.match');
        if (matchEl) lines.push(matchEl.textContent.trim());
    });
    downloadTxt('trufflehog_keys.txt', lines.join('\n'));
});

document.getElementById('exportEndpointsTxt').addEventListener('click', function () {
    const cards = document.querySelectorAll('#endpointsSection .endpoint-card');
    const lines = [];
    cards.forEach(card => {
        if (card.classList.contains('hidden-by-search')) return;
        const dropdown = card.closest('.origin-dropdown');
        if (dropdown && dropdown.classList.contains('hidden-origin')) return;
        const check = card.querySelector('.endpoint-check');
        if (check && !check.checked) return;
        const urlEl = card.querySelector('.url');
        if (urlEl) lines.push(urlEl.textContent.trim());
    });
    downloadTxt('trufflehog_endpoints.txt', lines.join('\n'));
});

document.getElementById('selectAllFindings').addEventListener('click', function () {
    const checkboxes = Array.from(document.querySelectorAll('.finding-check')).filter(cb => {
        const card = cb.closest('.finding-card');
        const dropdown = card ? card.closest('.origin-dropdown') : null;
        return card && !card.classList.contains('hidden-by-search') && (!dropdown || !dropdown.classList.contains('hidden-origin'));
    });
    const allChecked = checkboxes.length > 0 && checkboxes.every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateSelectedCounts();
});

document.getElementById('selectAllEndpoints').addEventListener('click', function () {
    const checkboxes = Array.from(document.querySelectorAll('.endpoint-check')).filter(cb => {
        const card = cb.closest('.endpoint-card');
        const dropdown = card ? card.closest('.origin-dropdown') : null;
        return card && !card.classList.contains('hidden-by-search') && (!dropdown || !dropdown.classList.contains('hidden-origin'));
    });
    const allChecked = checkboxes.length > 0 && checkboxes.every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
    updateSelectedCounts();
});

document.getElementById("navBack").onclick = () => window.close();
render();
