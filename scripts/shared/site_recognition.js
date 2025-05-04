import { dissectUrl, urlFitsPrefix } from "./url.js"

class SiteRecognition {
    #sites = [];

    static buildFromUrl(url) {
        let urlPieces = dissectUrl(url);
        return SiteRecognition.buildFromPrefix(urlPieces.base_url, url);
    }

    static buildFromPrefix(prefix, url = "") {
        let siteData = [{prefix: prefix, lastUrl: url}];
        return new SiteRecognition({sites: siteData});
    }

    constructor(data) {
        this.update(data);
    }

    update(objectLike) {
        if (!objectLike.hasOwnProperty('sites')) return false;
        if (!Array.isArray(objectLike.sites)) return false;
        this.#sites.length = 0;
        for (let siteData of objectLike.sites) {
            this.#pushSiteIfValid(siteData);
        }
        return this.#sites.length > 0;
    }

    #pushSiteIfValid(siteData) {
        // Minimum viable input
        if (!siteData.hasOwnProperty('prefix')) return;
        if (siteData.prefix === undefined) return;

        // Try to build Site recognition object
        let site = new Site(siteData);
        if (!site.isValid()) return;

        // Successful? Push to list.
        this.#sites.push(site);
    }

    getPrefixMasks() {
        let masks = [];
        for (let site of this.#sites) {
            masks.push(site.getPrefix());
        }
        return masks;
    }

    // It is not guaranteed that the returned sites will not be replaced
    // by SiteRecognition.
    getSites() {
        return this.#sites;
    }
    
    createSiteFromTab(tabData) {
        // Dissect tab information to build new site module
        let urlPieces = dissectUrl(tabData.url);
        if (urlPieces === undefined)
            return;
        const data = {
            prefix: urlPieces.base_url,
            lastUrl: tabData.url,
            lastTitle: tabData.title
        }
        const site = this.createSite(data);
        return site;
    }

    createSite(data) {
        const site = new Site(data);
        this.#sites.push(site);
        return site;
    }

    removeSite(siteToRemove) {
        const index = this.#sites.indexOf(siteToRemove);
        if (index > -1) {                   // only splice array when item is found
            this.#sites.splice(index, 1);   // remove one element
        }
    }

    overlapsWith(other) {
        // Don't accept it if it's not even the correct class!
        if (!(other instanceof SiteRecognition)) return true;
        // Can't collide with yourself
        if (other == this) return false;

        // As of now, we expect unilateral tests to be enough
        // One reason why URLs and titles are stored
        let otherSites = other.#sites;
        for (let mySite of this.#sites) {
            for (let otherSite of otherSites) {
                if (mySite.overlapsWith(otherSite)) return true;
            }
        }

        // No conflict detected
        return false;
    }

    siteIsCompatible(url, title = "", allowPrefix = false) {
        if (title === undefined) title = "";
        for (let site of this.#sites) {
            if (site.isCompatible(url, title, allowPrefix)) {
                return true;
            }
        }
        return false;
    }

    getInterface() {
        return new SiteRecognitionInterface(this);
    }

    getUrlRemainder(url, title) {
        for (let site of this.#sites) {
            if (!site.isCompatible(url, title)) continue;
            let urlPieces = dissectUrl(url, site.getPrefix());
            if (urlPieces === undefined) continue;      // Failure, find another or use full URL
            if (urlPieces.tail == "") continue;         // Don't want an empty label
            if (urlPieces.tail == "/") continue;        // Don't want that either
            return urlPieces.tail;
        }
        // Fallback for links that no longer match any (still) listed sites
        return url;
    }

    isValid() {
        return this.#sites.length > 0;
    }

    returnAsObject() {
        let detectors = [];
        for (let detector of this.#sites) {
            detectors.push(detector.returnAsObject());
        }
        return {
            sites: detectors
        }
    }
}

class SiteRecognitionInterface {
    #siteRecognition;

    constructor(siteRecognition) {
        this.#siteRecognition = siteRecognition;
    }

    canCoexistWith(otherSiteRecognitionInterface) {
        if (!(otherSiteRecognitionInterface instanceof SiteRecognitionInterface)) {
            return false;
        }
        return !this.#siteRecognition.overlapsWith(otherSiteRecognitionInterface.#siteRecognition);
    }

    getUrlRemainder(url, title = "") {
        return this.#siteRecognition.getUrlRemainder(url, title);
    }
}

// Site represents one recognition match by url and title
class Site {

    #prefix;            // start of URL needs to match this string
    #titleToken = "";   // if set the website title needs to contain this string
    #lastUrl;
    #lastTitle = "";
    #isValid = false;

    constructor(data) {
        // Not setting valid flag if prefix is not within expectations
        if (!data.hasOwnProperty('prefix')) return;
        if (data.prefix === undefined || data.prefix.len == 0) return;
        this.#prefix = String(data.prefix);

        if (data.hasOwnProperty('titleToken')) {
            this.#titleToken = String(data.titleToken);
        }

        if (data.hasOwnProperty('lastUrl')) {
            this.#lastUrl = String(data.lastUrl);
        } else {
            this.#lastUrl = String(this.#prefix);
        }

        if (data.hasOwnProperty('lastTitle')) {
            this.#lastTitle = String(data.lastTitle);
        }
        this.#isValid = true;
    }

    isValid() {
        return this.#isValid;
    }

    getPrefix() {
        return this.#prefix;
    }

    updatePrefix(prefix) {
        this.#prefix = String(prefix);
    }

    getTitleToken() {
        return this.#titleToken;
    }

    updateTitleToken(titleToken) {
        this.#titleToken = String(titleToken);
    }

    getLastUrl() {
        return this.#lastUrl;
    }

    getLastTitle() {
        return this.#lastTitle;
    }
    isCompatible(url, title, allowPrefix) {
        if (!allowPrefix && url == this.#prefix) {
            return false;  // Will not accept 100% match
        }
        let doesMatch = urlFitsPrefix(url, this.#prefix);
        if (doesMatch && this.#titleToken != "") {
            doesMatch = title.includes(this.#titleToken);
        }
        if (doesMatch) {
            this.#lastUrl = url;
            this.#lastTitle = title;  // Title is allowed to stay empty
        }
        return doesMatch;
    }

    overlapsWith(otherSite) {
        // If you manage to sneak another object type in here, that's on you
        // If you manage to have the same class identifier in two different
        //    SiteDetectors, that's still an issue and will show anyway.
        return otherSite.isCompatible(this.#lastUrl, this.#lastTitle);
    }

    returnAsObject() {
        return {
            prefix: this.#prefix,
            titleToken: this.#titleToken,
            lastUrl: this.#lastUrl,
            lastTitle: this.#lastTitle
        }
    }
}

export {SiteRecognition}