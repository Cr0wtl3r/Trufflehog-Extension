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
        sourceFile: "Source"
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
        sourceFile: "Fonte"
    }
};

function htmlEscape(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function applyTranslations(lang) {
    const t = i18n[lang] || i18n.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.textContent = t[key];
    });
    const sub = document.getElementById("reportSubtitle");
    if (sub && t.reportSubtitle) sub.textContent = t.reportSubtitle;
    const nav = document.getElementById("navBack");
    if (nav && t.navBack) nav.textContent = t.navBack;
}

function render() {
    browserAPI.storage.sync.get(["lang"], function (langResult) {
        const lang = langResult.lang || "en";
        applyTranslations(lang);
        const t = i18n[lang] || i18n.en;

        browserAPI.storage.local.get(["leakedKeys"], function (result) {
            const leakedKeys = result.leakedKeys || {};
            const findingsEl = document.getElementById("findingsContent");
            let findingsHtml = "";

            for (const origin in leakedKeys) {
                const findings = leakedKeys[origin];
                if (!findings.length) continue;
                findingsHtml += '<div class="origin-block"><h3>' + htmlEscape(origin) + '</h3>';
                for (const f of findings) {
                    findingsHtml += '<div class="finding-card">';
                    findingsHtml += '<div class="type">' + htmlEscape(f.key) + '</div>';
                    findingsHtml += '<div class="match">' + htmlEscape(f.match) + '</div>';
                    findingsHtml += '<div class="meta">' + t.foundIn + ': ' + htmlEscape(f.src) + '</div>';
                    findingsHtml += '<div class="meta">' + t.parentPage + ': ' + htmlEscape(f.parentUrl) + '</div>';
                    if (f.encoded) findingsHtml += '<div class="meta">' + t.decodedFrom + ': ' + htmlEscape(String(f.encoded).substring(0, 30)) + '...</div>';
                    findingsHtml += '</div>';
                }
                findingsHtml += '</div>';
            }
            findingsEl.innerHTML = findingsHtml || '<div class="empty-msg">' + t.noFindings + '</div>';
        });

        browserAPI.storage.local.get(["endpoints"], function (result) {
            const endpoints = result.endpoints || {};
            const epEl = document.getElementById("endpointsContent");
            let epHtml = "";

            for (const origin in endpoints) {
                const list = endpoints[origin];
                if (!list.length) continue;
                epHtml += '<div class="origin-block"><h3>' + htmlEscape(origin) + '</h3>';
                for (const ep of list) {
                    epHtml += '<div class="endpoint-card">';
                    epHtml += '<div class="url">' + htmlEscape(ep.url) + '</div>';
                    epHtml += '<div class="src">' + t.sourceFile + ': ' + htmlEscape(ep.src) + '</div>';
                    epHtml += '</div>';
                }
                epHtml += '</div>';
            }
            epEl.innerHTML = epHtml || '<div class="empty-msg">' + t.noEndpoints + '</div>';
        });
    });
}

document.getElementById("navBack").addEventListener("click", function () {
    window.close();
});

render();
