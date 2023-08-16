class UrlListener {
    #fktReactToUrl;
    #isActive;
    #fktWebNavEvent;
    #fktTabEvent;
    #fktTabUpdateEvent;
    #lastUrl = "";

    static #bundleUrl(url) {
        return {url:url, time: Date.now()};
    }
    
    static async findLatestTabUrl() {
        let tabs = await browser.tabs.query({currentWindow: true});
        let url = undefined;
        let latest = 0;
        for (let tab of tabs) {
            if (tab.lastAccessed > latest) {
                latest = tab.lastAccessed;
                url = tab.url;
            }
        }
        return UrlListener.#bundleUrl(url);
    }
    
    constructor(fktReactToUrl) {
        this.#fktReactToUrl = fktReactToUrl;
        this.#fktWebNavEvent = (event) => {this.#webNavEvent(event);};
        this.#fktTabEvent = (tabInfo) => {this.#tabEvent(tabInfo);};
        this.#fktTabUpdateEvent = (tabId, info) => {
            this.#tabUpdateEvent(info);
            };
        this.activate();
    }

    #sendUrl(url) {
        this.#fktReactToUrl(UrlListener.#bundleUrl(url));
    }
    
    #fireOnlyOnce(url) {
        if (url === this.#lastUrl)
            return;
        this.#lastUrl = url;
        this.#sendUrl(url);
    }
    
    #connect() {
        if (this.#isActive)
            return;
        browser.tabs.onActivated.addListener(this.#fktTabEvent);
        browser.webNavigation.onDOMContentLoaded.addListener(this.#fktWebNavEvent);
        browser.webNavigation.onReferenceFragmentUpdated.addListener(this.#fktWebNavEvent);
        browser.tabs.onUpdated.addListener(this.#fktTabUpdateEvent);
        this.#isActive = true;
    }
    
    #disconnect() {
        if (!this.#isActive)
            return;
        browser.tabs.onActivated.removeListener(this.#fktTabEvent);
        browser.webNavigation.onDOMContentLoaded.removeListener(this.#fktWebNavEvent);
        browser.webNavigation.onReferenceFragmentUpdated.removeListener(this.#fktWebNavEvent);
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
    
    retransmit() {
        UrlListener.findLatestTabUrl()
            .then((url) => {
                this.#sendUrl(url);
                }, promiseError);
    }
    
    #webNavEvent(event) {
        // Filter out any sub-frame related navigation event
        if (event.frameId !== 0) {
            return;
        }
        this.#fireOnlyOnce(event.url);
    }
    
    #tabEvent(tabInfo) {
        let fktReadTab = (tab) => {this.#readTab(tab);};
        let getTab = browser.tabs.get(tabInfo.tabId);
        getTab.then(fktReadTab, promiseError);
    }
    
    #tabUpdateEvent(info) {
        if (info.hasOwnProperty("url")) {
            this.#fireOnlyOnce(info.url);
        }
    }
    
    #readTab(tab) {
        if (tab === undefined)
            return;
        this.#fireOnlyOnce(tab.url);
    }
}
    
function promiseError(error) {
    console.log(error);
}

export {UrlListener}