class OpenUrlCtrl {
    static #doOpenUrls = true;

    static setOpenUrls(value) {
        OpenUrlCtrl.#doOpenUrls = Boolean(value);
    }

    static mayIOpenUrls() {
        return OpenUrlCtrl.#doOpenUrls;
    }

    constructor() {
        throw new Error("Use static methods only");
    }
}

function openUrlInMyTab(url) {
    if (!OpenUrlCtrl.mayIOpenUrls())
        return;
    if (url === undefined)
        return;
    let test = dissectUrl(url);
    if (test === undefined)
        return;
    browser.tabs.update({url: url});
}

function dissectUrl(url, prefix, fallback) {
    let currentUrl
    try {
        currentUrl = new URL(url);
    } catch (error) {
        console.log(`Invalid url "${String(url)}"`);
        return;
    }
    
    if (currentUrl.origin === "null")
        return;
    
    if (arguments.length < 2)
        prefix = currentUrl.origin;
    if (arguments.length < 3)
        fallback = false;

    if (!urlFitsPrefix(url, prefix)) {
        if (fallback) {
            prefix = currentUrl.origin;
        } else {
            console.log("Prefix does not match start of URL");
            return;
        }
    }
    let tail = getTail(url, currentUrl, prefix);
    return {host: currentUrl.host, tail: tail, base_url: currentUrl.origin};
}

function urlFitsPrefix(url, prefix) {
    if (prefix === undefined)
        return false;
    // Currently set to ignore https/http differences
    let urlObj = new URL(url);
    let prefixObj = new URL(prefix);
    if (!(isHttpS(urlObj.protocol) && isHttpS(prefixObj.protocol))) {
        return url.startsWith(prefix);
    }
    url = url.slice(urlObj.protocol.length);
    prefix = prefix.slice(prefixObj.protocol.length);
    return url.startsWith(prefix);
}

function isHttpS(protocol) {
    return (protocol === "http:") || (protocol === "https:");
}

function getTail(url, urlObj, prefix) {
    let prefixObj = new URL(prefix);
    if (isHttpS(urlObj.protocol) && isHttpS(prefixObj.protocol)) {
        url = url.slice(urlObj.protocol.length);
        prefix = prefix.slice(prefixObj.protocol.length);
    }
    return url.slice(prefix.length);
}

export {OpenUrlCtrl, openUrlInMyTab, dissectUrl, urlFitsPrefix, getTail}