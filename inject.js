// Trufflehog Content Script — Injected into web pages
// Compatible with Chrome and Firefox (WebExtensions API)

(function () {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    // Send the page body for analysis
    const page = document.documentElement.innerHTML;
    browserAPI.runtime.sendMessage({
        pageBody: page,
        origin: window.origin,
        parentUrl: window.location.href,
        parentOrigin: window.origin
    });

    // Delay to allow dynamically loaded scripts to initialize
    const SCRIPT_DISCOVERY_DELAY_MS = 3000;

    setTimeout(function () {
        const scriptsToScan = new Set();

        for (const scriptIndex in document.scripts) {
            if (document.scripts[scriptIndex].src) {
                let scriptSRC = document.scripts[scriptIndex].src;
                if (scriptSRC.startsWith("//")) scriptSRC = location.protocol + scriptSRC;
                scriptsToScan.add(scriptSRC);
            }
        }

        const htmlText = document.documentElement.innerHTML;
        const hiddenJS = [...htmlText.matchAll(/["'](\/[^"']*\.js[^"']*)["']/gi)];
        for (const match of hiddenJS) {
            const chunkUrl = window.location.origin + match[1];
            scriptsToScan.add(chunkUrl);
        }

        scriptsToScan.forEach(url => {
            browserAPI.runtime.sendMessage({
                scriptUrl: url,
                parentUrl: window.location.href,
                parentOrigin: window.origin
            });
        });
    }, SCRIPT_DISCOVERY_DELAY_MS);

    // Probe for .env and .git/config
    const origin = window.location.origin;
    const originalPath = window.location.pathname;
    const newPath = originalPath.substr(0, originalPath.lastIndexOf("/"));
    const newHref = origin + newPath;
    const envUrl = newHref + "/.env";
    browserAPI.runtime.sendMessage({ envFile: envUrl, parentUrl: window.location.href, parentOrigin: window.origin });
    const gitUrl = newHref + "/.git/config";
    browserAPI.runtime.sendMessage({ gitDir: gitUrl, parentUrl: window.location.href, parentOrigin: window.origin });
})();
