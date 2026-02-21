(function () {
    const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

    browserAPI.runtime.sendMessage({
        pageBody: document.documentElement.innerHTML,
        origin: window.origin,
        parentUrl: window.location.href,
        parentOrigin: window.origin
    });

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
            scriptsToScan.add(window.location.origin + match[1]);
        }

        scriptsToScan.forEach(url => {
            browserAPI.runtime.sendMessage({
                scriptUrl: url,
                parentUrl: window.location.href,
                parentOrigin: window.origin
            });
        });
    }, SCRIPT_DISCOVERY_DELAY_MS);

    const origin = window.location.origin;
    const originalPath = window.location.pathname;
    const newPath = originalPath.substr(0, originalPath.lastIndexOf("/"));
    const newHref = origin + newPath;
    browserAPI.runtime.sendMessage({ envFile: newHref + "/.env", parentUrl: window.location.href, parentOrigin: window.origin });
    browserAPI.runtime.sendMessage({ gitDir: newHref + "/.git/config", parentUrl: window.location.href, parentOrigin: window.origin });
})();
