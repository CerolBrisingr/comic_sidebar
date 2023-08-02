class UrlListener {
    #fktReactToUrl;
    #isActive;
    #fktWebNavEvent;
    #fktTabEvent;
    #latestUrl;
    
    constructor(fktReactToUrl) {
        this.#fktReactToUrl = fktReactToUrl;
        this.#fktWebNavEvent = (event) => {this.#webNavEvent(event);};
        this.#fktTabEvent = (tabInfo) => {this.#tabEvent(tabInfo);};
        this.activate();
        this.#connect();
    }
    
    #connect() {
        browser.tabs.onActivated.addListener(this.#fktTabEvent);
        browser.webNavigation.onDOMContentLoaded.addListener(this.#fktWebNavEvent);
        browser.webNavigation.onReferenceFragmentUpdated.addListener(this.#fktWebNavEvent);
    }
    
    #disconnect() {
        // Can use this again if I find out how to do "pushLatestUrl()" then
        browser.tabs.onActivated.removeListener(this.#fktTabEvent);
        browser.webNavigation.onDOMContentLoaded.removeListener(this.#fktWebNavEvent);
        browser.webNavigation.onReferenceFragmentUpdated.removeListener(this.#fktWebNavEvent);
    }
    
    activate() {
        this.#isActive = true;
        this.retransmit();
    }
    
    deactivate() {
        this.#isActive = false;
    }
    
    retransmit() {
        if (this.#latestUrl === undefined)
            return;
        this.#fktReactToUrl(this.#latestUrl);
    }
    
    #webNavEvent(event) {
        // Filter out any sub-frame related navigation event
        if (event.frameId !== 0) {
            return;
        }
        // Save url for next activation
        this.#latestUrl = event.url;
        if (!this.#isActive)
            return;
        this.#fktReactToUrl(event.url);
    }
    
    #tabEvent(tabInfo) {
        let fktReadTab = (tab) => {this.#readTab(tab);};
        let getTab = browser.tabs.get(tabInfo.tabId);
        getTab.then(fktReadTab, promiseError);
    }
    
    #readTab(tab) {
        if (tab === undefined)
            return;
        // Save url for next activation
        this.#latestUrl = tab.url;
        if (!this.#isActive)
            return;
        this.#fktReactToUrl(tab.url);
    }
}
    
function promiseError(error) {
    console.log(error);
}

export {UrlListener}