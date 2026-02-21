const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// ─── Internationalization ────────────────────────────────────────────

const i18n = {
    en: {
        subtitle: "Sniffing out credentials",
        sectionDetection: "Detection",
        genericSecrets: "Generic Secrets",
        specificSecrets: "Specific Secrets",
        awsKeys: "AWS Keys",
        checkEnv: "Check .env files",
        checkGit: "Check .git dirs",
        wafWarning: "Can trigger WAF bans",
        notifications: "Notifications",
        originDenyList: "Origin Deny List",
        commaOrigins: "Comma separated origins",
        placeholderOrigins: "https://example.com,https://trusted.org",
        matchDenyList: "Match Deny List",
        matchDenyListDesc: "Comma separated strings to ignore in findings",
        placeholderMatchDeny: "Cohere,AAAAAAA,test-key",
        findings: "Findings",
        clearThisOrigin: "Clear This Origin",
        clearAll: "Clear All",
        downloadCsv: "Download CSV",
        findingsForOrigin: "Findings for this origin",
        noFindings: "No findings for this origin",
        openMultipleTabs: "Open Multiple Tabs",
        commaUrls: "Comma separated URLs",
        placeholderUrls: "https://example.com,https://another.com",
        openTabs: "Open Tabs",
        foundIn: "found in",
        decodedFrom: "decoded from",
        checkEndpoints: "Extract Endpoints",
        endpoints: "Endpoints",
        endpointsForOrigin: "Endpoints for this origin",
        noEndpoints: "No endpoints found",
        highEntropy: "High Entropy (Deep Scan)",
        entropyWarning: "High rate of false positives",
        codeHeuristics: "Code Heuristics",
        codeHeuristicsWarning: "Detects TODOs, AI-generated code, hardcoded passwords",
        viewFullReport: "View Full Report",
        clickToViewDetails: "Click an item to view the full report"
    },
    pt: {
        subtitle: "Rastreando credenciais vazadas",
        sectionDetection: "Detecção",
        genericSecrets: "Secrets genéricos",
        specificSecrets: "Secrets específicos",
        awsKeys: "Chaves AWS",
        checkEnv: "Verificar arquivos .env",
        checkGit: "Verificar diretórios .git",
        wafWarning: "Pode acionar bloqueios WAF",
        notifications: "Notificações",
        originDenyList: "Lista de origens negadas",
        commaOrigins: "Origens separadas por vírgula",
        placeholderOrigins: "https://exemplo.com,https://confiavel.org",
        matchDenyList: "Lista de negação de padrões",
        matchDenyListDesc: "Strings separadas por vírgula para ignorar nos achados",
        placeholderMatchDeny: "Cohere,AAAAAAA,chave-teste",
        findings: "Achados",
        clearThisOrigin: "Limpar esta origem",
        clearAll: "Limpar tudo",
        downloadCsv: "Baixar CSV",
        findingsForOrigin: "Achados desta origem",
        noFindings: "Nenhum achado para esta origem",
        openMultipleTabs: "Abrir múltiplas abas",
        commaUrls: "URLs separadas por vírgula",
        placeholderUrls: "https://exemplo.com,https://outro.com",
        openTabs: "Abrir abas",
        foundIn: "encontrado em",
        decodedFrom: "decodificado de",
        checkEndpoints: "Extrair Endpoints",
        endpoints: "Endpoints",
        endpointsForOrigin: "Endpoints desta origem",
        noEndpoints: "Nenhum endpoint encontrado",
        highEntropy: "Alta Entropia (Scan Profundo)",
        entropyWarning: "Alto índice de falsos positivos",
        codeHeuristics: "Heurísticas de Código",
        codeHeuristicsWarning: "Detecta TODOs, código gerado por IA, senhas hardcoded",
        viewFullReport: "Ver relatório completo",
        clickToViewDetails: "Clique em um item para ver o relatório completo"
    }
};

let currentLang = "en";

function applyTranslations(lang) {
    currentLang = lang;
    const t = i18n[lang] || i18n.en;
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (t[key]) el.textContent = t[key];
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
        const key = el.getAttribute("data-i18n-placeholder");
        if (t[key]) el.placeholder = t[key];
    });
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
}


// ─── Toggle Configuration ────────────────────────────────────────────

const toggles = ["generics", "specifics", "aws", "checkEnv", "checkGit", "alerts", "checkEndpoints", "highEntropy", "codeHeuristics"];
const toggleDefaults = {
    generics: true,
    specifics: true,
    aws: true,
    checkEnv: false,
    checkGit: false,
    alerts: true,
    checkEndpoints: false,
    highEntropy: false,
    codeHeuristics: false,
};

function getActiveTab(callback) {
    browserAPI.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        callback(tabs && tabs[0] ? tabs[0] : null);
    });
}

// Language init
browserAPI.storage.sync.get(["lang"], function (result) {
    const lang = result.lang || "en";
    document.getElementById("langSelect").value = lang;
    applyTranslations(lang);
});

document.getElementById("langSelect").addEventListener("change", function () {
    const lang = this.value;
    browserAPI.storage.sync.set({ lang });
    applyTranslations(lang);
    loadFindings();
});

// Toggle init
for (const toggle of toggles) {
    browserAPI.storage.sync.get([toggle], function (result) {
        if (result[toggle] === undefined) {
            document.getElementById(toggle).checked = toggleDefaults[toggle];
            browserAPI.storage.sync.set({ [toggle]: toggleDefaults[toggle] });
        } else {
            document.getElementById(toggle).checked = result[toggle] === true;
        }
    });
    document.getElementById(toggle).addEventListener('click', function () {
        const value = this.checked;
        browserAPI.storage.sync.set({ [toggle]: value });
    });
}


// ─── Utilities ───────────────────────────────────────────────────────

function htmlEntities(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Properly escape a value for CSV (RFC 4180).
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function csvEscape(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}


// ─── Deny Lists ──────────────────────────────────────────────────────

function loadDenyList() {
    const el = document.getElementById("denyList");
    browserAPI.storage.sync.get(["originDenyList"], function (result) {
        el.value = (result.originDenyList || []).join(", ");
    });
}

function loadMatchDenyList() {
    const el = document.getElementById("matchDenyListInput");
    browserAPI.storage.sync.get(["matchDenyList"], function (result) {
        el.value = (result.matchDenyList || []).join(", ");
    });
}


// ─── Findings ────────────────────────────────────────────────────────

function openFindingsPage() {
    browserAPI.tabs.create({ url: browserAPI.runtime.getURL("findings.html") });
}

function loadFindings() {
    const listEl = document.getElementById("findingList");
    const emptyEl = document.getElementById("findingListEmpty");
    const t = i18n[currentLang] || i18n.en;
    getActiveTab(function (tab) {
        if (!tab || !tab.url) return;
        try {
            const origin = (new URL(tab.url)).origin;
            browserAPI.storage.local.get(["leakedKeys"], function (result) {
                const keys = result.leakedKeys?.[origin] || [];
                let htmlList = "";
                for (const k of keys) {
                    let keyInfo = k.key + ": " + k.match + " " + t.foundIn + " " + k.src;
                    if (k.encoded) {
                        keyInfo += " " + t.decodedFrom + " " + k.encoded.substring(0, 9) + "...";
                    }
                    htmlList += '<li class="clickable-item">' + htmlEntities(keyInfo) + "</li>\n";
                }
                listEl.innerHTML = htmlList;
                emptyEl.textContent = t.noFindings;
                emptyEl.classList.toggle("hidden", keys.length > 0);
            });
        } catch (e) {
            console.error('[Trufflehog] Error loading findings:', e);
        }
    });
}


// ─── Endpoints ───────────────────────────────────────────────────────

function loadEndpoints() {
    const listEl = document.getElementById("endpointList");
    const emptyEl = document.getElementById("endpointListEmpty");
    const t = i18n[currentLang] || i18n.en;

    getActiveTab(function (tab) {
        if (!tab || !tab.url) return;
        try {
            const origin = (new URL(tab.url)).origin;
            browserAPI.storage.local.get(["endpoints"], function (result) {
                const epList = result.endpoints?.[origin] || [];
                let htmlList = "";
                for (const item of epList) {
                    const epInfo = item.url + " (" + t.foundIn + " " + item.src.split('/').pop() + ")";
                    htmlList += '<li class="clickable-item">' + htmlEntities(epInfo) + "</li>\n";
                }
                listEl.innerHTML = htmlList;
                emptyEl.textContent = t.noEndpoints;
                emptyEl.classList.toggle("hidden", epList.length > 0);
            });
        } catch (e) {
            console.error('[Trufflehog] Error loading endpoints:', e);
        }
    });
}


// ─── Accordion Listeners ─────────────────────────────────────────────

document.querySelectorAll(".accordion").forEach(function (details) {
    details.addEventListener("toggle", function () {
        if (!this.open) return;
        const key = this.getAttribute("data-accordion");
        if (key === "denyList") loadDenyList();
        if (key === "matchDenyList") loadMatchDenyList();
        if (key === "findings") loadFindings();
        if (key === "endpointsList") loadEndpoints();
    });
});


// ─── CSV Downloads ───────────────────────────────────────────────────

function downloadCSV() {
    browserAPI.storage.local.get(["leakedKeys"], function (result) {
        const leakedKeys = result.leakedKeys || {};
        const csvRows = [["Origin", "Source", "Parent URL", "Type", "Match", "Encoded"].map(csvEscape).join(",")];
        for (const origin in leakedKeys) {
            const findings = leakedKeys[origin];
            for (const finding of findings) {
                csvRows.push([
                    origin,
                    finding.src,
                    finding.parentUrl,
                    finding.key,
                    finding.match,
                    finding.encoded || ""
                ].map(csvEscape).join(","));
            }
        }
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        window.open(encodeURI(csvContent));
    });
}

document.getElementById("downloadAllFindings").addEventListener("click", downloadCSV);


// ─── Clear Findings ──────────────────────────────────────────────────

document.getElementById("clearOriginFindings").addEventListener("click", function () {
    browserAPI.storage.local.get(["leakedKeys"], function (result) {
        const leakedKeys = result.leakedKeys || {};
        getActiveTab(function (tab) {
            if (tab && tab.url) {
                const origin = (new URL(tab.url)).origin;
                leakedKeys[origin] = [];
                browserAPI.storage.local.set({ leakedKeys });
                const actionAPI = browserAPI.action || browserAPI.browserAction;
                if (actionAPI) actionAPI.setBadgeText({ text: '' });
            }
            document.getElementById("findingList").innerHTML = "";
            document.getElementById("findingListEmpty").classList.remove("hidden");
        });
    });
});

document.getElementById("clearAllFindings").addEventListener("click", function () {
    browserAPI.storage.local.set({ leakedKeys: {} });
    const actionAPI = browserAPI.action || browserAPI.browserAction;
    if (actionAPI) actionAPI.setBadgeText({ text: '' });
    document.getElementById("findingList").innerHTML = "";
    document.getElementById("findingListEmpty").classList.remove("hidden");
});


// ─── Open Tabs ───────────────────────────────────────────────────────

document.getElementById("openTabs").addEventListener("click", function () {
    const rawTabList = document.getElementById("tabList").value;
    const tabList = rawTabList.split(",").map(item => item.trim()).filter(Boolean);
    browserAPI.runtime.sendMessage({ openTabs: tabList });
});


// ─── Deny List Persistence ──────────────────────────────────────────

const denyListElement = document.getElementById("denyList");
function changeDenyListEvent() {
    const list = denyListElement.value.split(",").map(item => item.trim()).filter(Boolean);
    browserAPI.storage.sync.set({ originDenyList: list });
}
denyListElement.addEventListener('keyup', changeDenyListEvent);
denyListElement.addEventListener('paste', changeDenyListEvent);

const matchDenyListElement = document.getElementById("matchDenyListInput");
function changeMatchDenyListEvent() {
    const list = matchDenyListElement.value.split(",").map(item => item.trim()).filter(Boolean);
    browserAPI.storage.sync.set({ matchDenyList: list });
}
matchDenyListElement.addEventListener('keyup', changeMatchDenyListEvent);
matchDenyListElement.addEventListener('paste', changeMatchDenyListEvent);


// ─── Clear Endpoints ─────────────────────────────────────────────────

document.getElementById("clearOriginEndpoints").addEventListener("click", function () {
    browserAPI.storage.local.get(["endpoints"], function (result) {
        const endpoints = result.endpoints || {};
        getActiveTab(function (tab) {
            if (tab && tab.url) {
                const origin = (new URL(tab.url)).origin;
                endpoints[origin] = [];
                browserAPI.storage.local.set({ endpoints });
                loadEndpoints();
            }
        });
    });
});


// ─── Navigation to Full Report ───────────────────────────────────────

document.getElementById("openFindingsPage").addEventListener("click", openFindingsPage);
document.getElementById("openFindingsPageFromEndpoints").addEventListener("click", openFindingsPage);

document.getElementById("findingList").addEventListener("click", function (e) {
    if (e.target.closest(".clickable-item")) openFindingsPage();
});
document.getElementById("endpointList").addEventListener("click", function (e) {
    if (e.target.closest(".clickable-item")) openFindingsPage();
});


// ─── Endpoint CSV Download ───────────────────────────────────────────

document.getElementById("downloadEndpointsCsv").addEventListener("click", function () {
    browserAPI.storage.local.get(["endpoints"], function (result) {
        const endpoints = result.endpoints || {};
        const csvRows = [["Origin", "Endpoint", "Source_File"].map(csvEscape).join(",")];
        for (const origin in endpoints) {
            for (const ep of endpoints[origin]) {
                csvRows.push([origin, ep.url, ep.src].map(csvEscape).join(","));
            }
        }
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        window.open(encodeURI(csvContent));
    });
});