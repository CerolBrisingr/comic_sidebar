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
        if (!data.hasOwnProperty('sites')) return;
        for (let siteData of data.sites) {
            // Minimum viable input
            if (!siteData.hasOwnProperty('prefix')) continue;
            if (siteData.prefix === undefined) continue;

            // Try to build Site recognition object
            let site = new Site(siteData);
            if (!site.isValid()) continue;

            // Successful? Push to list.
            this.#sites.push(site);
        }
    }

    // TODO: deprecated interface
    setPrefixMask(prefixMask) {
        if (this.#sites.length == 0) {
            // Try to set a new mask
            let siteData = {prefix: prefixMask, lastUrl: prefixMask};
            let site = new Site(siteData);
            if (!site.isValid()) return;
        } else {
            this.#sites[0].updatePrefix(prefixMask);
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

    siteIsCompatible(url, title = "") {
        if (title === undefined) title = "";
        for (let site of this.#sites) {
            if (site.isCompatible(url, title)) {
                return true;
            }
        }
        return false;
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

    updatePrefix(prefix) {
        this.#prefix = String(prefix);
    }

    isCompatible(url, title) {
        if (url == this.#prefix) {
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