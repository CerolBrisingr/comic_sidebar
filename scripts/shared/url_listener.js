class UrlListener {
    #fktReactToUrl;
    #isActive;
    #fktTabEvent;
    #fktTabUpdateEvent;
    #lastUrl = "";

    static #bundleUrl(url, favIconUrl) {
        return {url:url, time: Date.now(), favIcon: favIconUrl};
    }
    
    static async findLatestTabUrl() {
        let tabs = await browser.tabs.query({currentWindow: true});
        let url = undefined;
        let favIconUrl = undefined;
        let latest = 0;
        for (let tab of tabs) {
            if (tab.lastAccessed > latest) {
                latest = tab.lastAccessed;
                url = tab.url;
                favIconUrl = tab.favIconUrl;
            }
        }
        return UrlListener.#bundleUrl(url, favIconUrl);
    }
    
    constructor(fktReactToUrl) {
        this.#fktReactToUrl = fktReactToUrl;
        this.#fktTabEvent = (tabInfo) => {this.#readTab(tabInfo.tabId);};
        this.#fktTabUpdateEvent = (tabId, info) => {
            if (!info.hasOwnProperty("url")) {
                return;
            }
            this.#readTab(tabId);
            };
        this.activate();
    }

    #sendUrl(url, favIconUrl) {
        this.#fktReactToUrl(UrlListener.#bundleUrl(url, favIconUrl));
    }
    
    #fireOnlyOnce(url, favIconUrl) {
        if (url === this.#lastUrl)
            return;
        this.#lastUrl = url;
        this.#sendUrl(url, favIconUrl);
    }
    
    #connect() {
        if (this.#isActive)
            return;
        browser.tabs.onActivated.addListener(this.#fktTabEvent);
        browser.tabs.onUpdated.addListener(this.#fktTabUpdateEvent);
        this.#isActive = true;
    }
    
    #disconnect() {
        if (!this.#isActive)
            return;
        browser.tabs.onActivated.removeListener(this.#fktTabEvent);
        browser.tabs.onUpdated.removeListener(this.#fktTabUpdateEvent);
        this.#isActive = false;
    }
    
    activate() {
        this.#connect();
        this.retransmit();
    }
    
    deactivate() {
        this.#disconnect();
    }
    
    async retransmit() {
        const bundle = await UrlListener.findLatestTabUrl();
        this.#fktReactToUrl(bundle);
    }
    
    async #readTab(tabId) {
        let tab = await browser.tabs.get(tabId);
        if (tab === undefined)
            return;
        this.#fireOnlyOnce(tab.url, tab.favIconUrl);
    }
}

export {UrlListener}