function openUrlInMyTab(url) {
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
        console.error(error);
        return;
    }
    
    if (currentUrl.origin === "null")
        return;
    
    if (arguments.length < 2)
        prefix = currentUrl.origin;
    if (arguments.length < 3)
        fallback = false;
    
    if (!url.startsWith(prefix)) {
        if (fallback) {
            prefix = currentUrl.origin;
        } else {
            console.log("Prefix does not match start of URL");
            return;
        }
    }
    let tail = url.slice(prefix.length);
    return {host: currentUrl.host, tail: tail, base_url: currentUrl.origin};
}

export {openUrlInMyTab, dissectUrl}