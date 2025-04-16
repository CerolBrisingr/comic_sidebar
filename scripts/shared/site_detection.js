import { dissectUrl, urlFitsPrefix } from "./url.js"

class SiteDetection {
    #sites = [];

    static buildFromUrl(url) {
        let urlPieces = dissectUrl(url);
        return SiteDetection.buildFromPrefix(urlPieces.base_url, url);
    }

    static buildFromPrefix(prefix, url = "") {
        let siteData = [{prefix: prefix, lastUrl: url}];
        return new SiteDetection({sites: siteData});
    }

    constructor(data) {
        if (!data.hasOwnProperty('sites')) return;
        for (let siteData of data.sites) {
            // Minimum viable input
            if (!siteData.hasOwnProperty('prefix')) continue;
            if (siteData.prefix === undefined) continue;

            // Try to build Site recognition object
            let site = new Site(siteData)
            if (!site.isValid()) continue;

            // Successful? Push to list.
            this.#sites.push(site);
        }
    }

    overlapsWith(other) {
        // Don't accept it if it's not even the correct class!
        if (!(other instanceof SiteDetection)) return true;
        // Can't collide with yourself
        if (other == this) return false;

        // As of now, we expect unilateral tests to be enough
        // One reason why URLs and titles are stored
        let otherSites = other.#sites;
        for (let mySite of this.#sites) {
            for (let otherSite of otherSites) {
                if (mySite.conflictsWith(otherSite)) return true;
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
        this.#prefix = data.prefix;

        if (data.hasOwnProperty('titleToken')) {
            this.#titleToken = data.titleToken;
        }

        if (data.hasOwnProperty('lastUrl')) {
            this.#lastUrl = data.lastUrl;
        } else {
            this.#lastUrl = this.#prefix;
        }

        if (data.hasOwnProperty('lastTitle')) {
            this.#lastTitle = data.lastTitle;
        }
        this.#isValid = true;
    }

    isValid() {
        return this.#isValid;
    }

    isCompatible(url, title) {
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

export {SiteDetection}