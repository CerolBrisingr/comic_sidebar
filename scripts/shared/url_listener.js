class UrlListener {
    #fktReactToUrl;
    #isActive;
    #fktTabEvent;
    #fktTabUpdateEvent;
    #fktWindowChanged;
    #lastUrl = "";
    #hasFavIcon = false;

    static #bundleUrl(url, favIconUrl) {
        return {url:url, time: Date.now(), favIcon: favIconUrl};
    }

    static async listAllTabs() {
        const tabs = await browser.tabs.query({});
        let output = [];
        for (const tab of tabs) {
            if (tab.url.startsWith("moz-extension://")) continue;
            if (tab.url.startsWith("about:")) continue;
            output.push(new Tab(tab));
        }
        return output;
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
            if (info.hasOwnProperty("url")) {
                this.#readTab(tabId);
                return;
                };
            if (info.hasOwnProperty("favIconUrl")) {
                this.#readTab(tabId);
                return;
            }
        }
        this.#fktWindowChanged = (windowId) => {
            if (windowId === -1) // No window selected
                return;
            this.retransmit();
        }
        this.deactivate();
    }

    #sendUrl(url, favIconUrl) {
        this.#fktReactToUrl(UrlListener.#bundleUrl(url, favIconUrl));
    }
    
    #fireOnlyOnce(url, favIconUrl) {
        if (favIconUrl === undefined | this.#hasFavIcon) {
            // We don't need a favIcon or have no chance to get one
            if (url === this.#lastUrl)
                return;
        }
        this.#lastUrl = url;
        this.#hasFavIcon = favIconUrl !== undefined;
        this.#sendUrl(url, favIconUrl);
    }
    
    #connect() {
        if (this.#isActive)
            return;
        browser.tabs.onActivated.addListener(this.#fktTabEvent);
        browser.tabs.onUpdated.addListener(this.#fktTabUpdateEvent);
        browser.windows.onFocusChanged.addListener(this.#fktWindowChanged);
        this.#isActive = true;
    }
    
    #disconnect() {
        if (!this.#isActive)
            return;
        browser.tabs.onActivated.removeListener(this.#fktTabEvent);
        browser.tabs.onUpdated.removeListener(this.#fktTabUpdateEvent);
        browser.windows.onFocusChanged.removeListener(this.#fktWindowChanged);
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
        if (!this.#isActive)
            return;
        const bundle = await UrlListener.findLatestTabUrl();
        this.#fktReactToUrl(bundle);
    }
    
    async #readTab(tabId) {
        let tab = await browser.tabs.get(tabId);
        if (tab === undefined)
            return;
        if (!tab.active) // This tab will fire again when finally viewed
            return;
        this.#fireOnlyOnce(tab.url, tab.favIconUrl);
    }
}

class Tab {
    #lastAccessed;
    #url;
    #title;
    #favIconUrl;

    // Constructor should be able to work with it's own "returnAsObject()"
    // to allow easy serialization and deserialization
    constructor(browserTab) {
        this.#lastAccessed = browserTab.lastAccessed;
        this.#url = browserTab.url;
        this.#title = browserTab.title;
        this.#favIconUrl = browserTab.favIconUrl;
    }

    print() {
        console.log(this.#url);
        console.log(this.#title);
        console.log("");
    }

    getUrl() {
        return this.#url;
    }

    getTitle() {
        return this.#title;
    }

    getFavIconUrl() {
        return this.#favIconUrl;
    }

    returnAsObject() {
        return {
            lastAccessed: this.#lastAccessed,
            url: this.#url,
            title: this.#title,
            favIcon: this.#favIconUrl
        }
    }
}

export {UrlListener}