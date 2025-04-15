import { dissectUrl, urlFitsPrefix } from "./url.js"

class SiteDetection {
    #sites = [];

    static buildForEditorFromUrl(url) {
        let urlPieces = dissectUrl(url);
        return SiteDetection.buildForEditorFromPrefix(urlPieces.base_url);
    }

    static buildForEditorFromPrefix(prefix) {
        let siteData = [{prefix: prefix, titleToken: ""}];
        return new SiteDetection({sites: siteData});
    }

    constructor(data) {
        for (let siteData of data.sites) {
            if (siteData.prefix === undefined) continue;
            let site = new Site(siteData.prefix, siteData.titleToken)
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

class Site {

    #prefix;        // start of URL needs to match this string
    #titleToken;    // if set the website title needs to contain this string

    constructor(prefix, titleToken = "") {
        this.#prefix = prefix;
        this.#titleToken = titleToken;
    }

    isCompatible(url, title) {
        let doesMatch = urlFitsPrefix(url, this.#prefix);
        if (doesMatch && this.#titleToken != "") {
            doesMatch = title.includes(this.#titleToken);
        }
        return doesMatch;
    }

    returnAsObject() {
        return {
            prefix: this.#prefix,
            titleToken: this.#titleToken
        }
    }
}

export {SiteDetection}