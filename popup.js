const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

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
        codeHeuristicsWarning: "Detects TODOs, automated code markers, hardcoded passwords",
        checkSourceMaps: "Check Source Maps",
        viewFullReport: "📋 View Full Report",
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
        codeHeuristicsWarning: "Detecta TODOs, marcadores de código automatizados, senhas hardcoded",
        checkSourceMaps: "Verificar Source Maps",
        viewFullReport: "📋 Ver Relatório Completo",
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

const toggles = ["generics", "specifics", "aws", "checkEnv", "checkGit", "alerts", "checkEndpoints", "highEntropy", "codeHeuristics", "appEnabled", "checkSourceMaps"];
const toggleDefaults = {
    generics: true, specifics: true, aws: true,
    checkEnv: false, checkGit: false, alerts: true,
    checkEndpoints: false, highEntropy: false, codeHeuristics: false,
    appEnabled: true, checkSourceMaps: true,
};

function getActiveTab(callback) {
    browserAPI.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        callback(tabs && tabs[0] ? tabs[0] : null);
    });
}

function getMatchDenyList(callback) {
    browserAPI.storage.sync.get(["matchDenyList"], function (result) {
        callback(Array.isArray(result.matchDenyList) ? result.matchDenyList : []);
    });
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

for (const toggle of toggles) {
    browserAPI.storage.sync.get([toggle], function (result) {
        if (result[toggle] === undefined) {
            document.getElementById(toggle).checked = toggleDefaults[toggle];
            browserAPI.storage.sync.set({ [toggle]: toggleDefaults[toggle] });
            if (toggle === "appEnabled") updateMainState(toggleDefaults[toggle]);
        } else {
            document.getElementById(toggle).checked = result[toggle] === true;
            if (toggle === "appEnabled") updateMainState(result[toggle]);
        }
    });
    document.getElementById(toggle).addEventListener('click', function () {
        const value = this.checked;
        browserAPI.storage.sync.set({ [toggle]: value });
        if (toggle === "appEnabled") updateMainState(value);
    });
}

function updateMainState(enabled) {
    document.body.classList.toggle("app-disabled", !enabled);
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function csvEscape(value) {
    const str = String(value ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function makeFindingId(origin, f, idx) {
    return "f-" + btoa(unescape(encodeURIComponent(origin + f.key + f.match + f.src))).replace(/[^a-zA-Z0-9]/g, '').substring(0, 24) + idx;
}

function openFindingsPage(hash) {
    const url = browserAPI.runtime.getURL("findings.html") + (hash ? "#" + hash : "");
    browserAPI.tabs.create({ url });
}

function loadDenyList() {
    browserAPI.storage.sync.get(["originDenyList"], function (result) {
        document.getElementById("denyList").value = (result.originDenyList || []).join(", ");
    });
}

function loadMatchDenyList() {
    browserAPI.storage.sync.get(["matchDenyList"], function (result) {
        document.getElementById("matchDenyListInput").value = (result.matchDenyList || []).join(", ");
    });
}

function loadFindings() {
    const t = i18n[currentLang] || i18n.en;
    getActiveTab(function (tab) {
        if (!tab?.url) return;
        try {
            const origin = (new URL(tab.url)).origin;
            browserAPI.storage.local.get(["leakedKeys"], function (result) {
                const allKeys = result.leakedKeys?.[origin] || [];
                getMatchDenyList(function (denyList) {
                    const keys = allKeys.filter(k => !isMatchDenied(k.match, k.key, denyList));
                    let htmlList = "";
                    keys.forEach((k, idx) => {
                        const fid = makeFindingId(origin, k, idx);
                        let keyInfo = k.key + ": " + k.match + " " + t.foundIn + " " + k.src;
                        if (k.encoded) keyInfo += " " + t.decodedFrom + " " + k.encoded.substring(0, 9) + "...";
                        htmlList += '<li class="clickable-item" data-finding-id="' + fid + '">' + htmlEntities(keyInfo) + "</li>\n";
                    });
                    document.getElementById("findingList").innerHTML = htmlList;
                    document.getElementById("findingListEmpty").textContent = t.noFindings;
                    document.getElementById("findingListEmpty").classList.toggle("hidden", keys.length > 0);
                });
            });
        } catch (e) { }
    });
}

function loadEndpoints() {
    const t = i18n[currentLang] || i18n.en;
    getActiveTab(function (tab) {
        if (!tab?.url) return;
        try {
            const origin = (new URL(tab.url)).origin;
            browserAPI.storage.local.get(["endpoints"], function (result) {
                const epList = result.endpoints?.[origin] || [];
                let htmlList = "";
                for (const item of epList) {
                    const epInfo = item.url + " (" + t.foundIn + " " + item.src.split('/').pop() + ")";
                    htmlList += '<li class="clickable-item">' + htmlEntities(epInfo) + "</li>\n";
                }
                document.getElementById("endpointList").innerHTML = htmlList;
                document.getElementById("endpointListEmpty").textContent = t.noEndpoints;
                document.getElementById("endpointListEmpty").classList.toggle("hidden", epList.length > 0);
            });
        } catch (e) { }
    });
}

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

document.getElementById("openFullReport").addEventListener("click", () => openFindingsPage());

document.getElementById("downloadAllFindings").addEventListener("click", function () {
    browserAPI.storage.local.get(["leakedKeys"], function (result) {
        const leakedKeys = result.leakedKeys || {};
        const csvRows = [["Origin", "Source", "Parent URL", "Type", "Match", "Encoded"].map(csvEscape).join(",")];
        for (const origin in leakedKeys) {
            for (const f of leakedKeys[origin]) {
                csvRows.push([origin, f.src, f.parentUrl, f.key, f.match, f.encoded || ""].map(csvEscape).join(","));
            }
        }
        window.open(encodeURI("data:text/csv;charset=utf-8," + csvRows.join("\n")));
    });
});

document.getElementById("clearOriginFindings").addEventListener("click", function () {
    browserAPI.storage.local.get(["leakedKeys"], function (result) {
        const leakedKeys = result.leakedKeys || {};
        getActiveTab(function (tab) {
            if (tab?.url) {
                leakedKeys[(new URL(tab.url)).origin] = [];
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

document.getElementById("openTabs").addEventListener("click", function () {
    const list = document.getElementById("tabList").value.split(",").map(item => item.trim()).filter(Boolean);
    browserAPI.runtime.sendMessage({ openTabs: list });
});

const denyListElement = document.getElementById("denyList");
denyListElement.oninput = () => {
    browserAPI.storage.sync.set({ originDenyList: denyListElement.value.split(",").map(item => item.trim()).filter(Boolean) });
};

const matchDenyListElement = document.getElementById("matchDenyListInput");
matchDenyListElement.oninput = () => {
    browserAPI.storage.sync.set({ matchDenyList: matchDenyListElement.value.split(",").map(item => item.trim()).filter(Boolean) });
};

document.getElementById("clearOriginEndpoints").addEventListener("click", function () {
    browserAPI.storage.local.get(["endpoints"], function (result) {
        const endpoints = result.endpoints || {};
        getActiveTab(function (tab) {
            if (tab?.url) {
                endpoints[(new URL(tab.url)).origin] = [];
                browserAPI.storage.local.set({ endpoints });
                loadEndpoints();
            }
        });
    });
});

document.getElementById("findingList").onclick = (e) => {
    const item = e.target.closest(".clickable-item");
    if (item) openFindingsPage(item.getAttribute("data-finding-id"));
};
document.getElementById("endpointList").onclick = (e) => {
    if (e.target.closest(".clickable-item")) openFindingsPage("endpointsSection");
};

document.getElementById("downloadEndpointsCsv").addEventListener("click", function () {
    browserAPI.storage.local.get(["endpoints"], function (result) {
        const endpoints = result.endpoints || {};
        const csvRows = [["Origin", "Endpoint", "Source_File"].map(csvEscape).join(",")];
        for (const origin in endpoints) {
            for (const ep of endpoints[origin]) {
                csvRows.push([origin, ep.url, ep.src].map(csvEscape).join(","));
            }
        }
        window.open(encodeURI("data:text/csv;charset=utf-8," + csvRows.join("\n")));
    });
});