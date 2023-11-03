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
    let tail = getTail(url, prefix);
    return {host: currentUrl.host, tail: tail, base_url: currentUrl.origin};
}

function urlFitsPrefix(url, prefix) {
    if (prefix === undefined)
        return false;
    // Currently set to ignore https/http differences
    url = url.replace("http:", "https:");
    prefix = prefix.replace("http:", "https:");
    return url.startsWith(prefix);
}

function getTail(url, prefix) {
    url = url.replace("http:", "https:");
    prefix = prefix.replace("http:", "https:");
    return url.slice(prefix.length);
}

export {OpenUrlCtrl, openUrlInMyTab, dissectUrl, urlFitsPrefix, getTail}