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

    siteIsCompatible(url, title = "") {
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
    #lastTitle;
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