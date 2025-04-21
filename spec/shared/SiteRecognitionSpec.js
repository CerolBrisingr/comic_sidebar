import { SiteRecognition } from "../../scripts/shared/site_recognition.js";

describe('Single Site', function() {
    it('can be built from url', function() {
        let siteRecognition = SiteRecognition.buildFromUrl("http://www.some.site/1234");
        expect(siteRecognition.isValid()).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123")).toBe(true);
        expect(siteRecognition.siteIsCompatible("nope")).toBe(false);

        let extractedObject = siteRecognition.returnAsObject();
        expect(extractedObject.sites.length).toBe(1);
        expect(getLastUrl(extractedObject)).toEqual("http://www.some.site/123");

        expect(siteRecognition.overlapsWith(siteRecognition)).toBe(false);
        expect(siteRecognition.overlapsWith(2)).toBe(true);

        let siteRecognition2 = SiteRecognition.buildFromUrl("http://www.some.site/1234");
        expect(siteRecognition.overlapsWith(siteRecognition2)).toBe(true);
    });

    it('can be built via prefix', function() {
        let siteRecognition = SiteRecognition.buildFromPrefix("http://www.some.site/12");
        expect(siteRecognition.isValid()).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site")).toBe(false);
    });

    it('can be built from dictionary', function() {
        let site = {prefix: "http://www.some.site/12", titleToken: ""};
        let data = {sites: [site]};
        let siteRecognition = new SiteRecognition(data);
        expect(siteRecognition.isValid()).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/12")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site")).toBe(false);
    });

    it('can test title when built from dictionary', function() {
        let site = {prefix: "http://www.some.site/12", titleToken: "test"};
        let data = {sites: [site]};
        let siteRecognition = new SiteRecognition(data);
        expect(siteRecognition.isValid()).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "blabla")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "..test..")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/1234", "..test..")).toBe(true);

        let extractedObject = siteRecognition.returnAsObject();
        expect(getTitleToken(extractedObject)).toEqual("test");
        expect(getLastUrl(extractedObject)).toEqual("http://www.some.site/1234");
        expect(getLastTitle(extractedObject)).toEqual("..test..");
    });

    it('can check for overlaps', function() {
        let site = {prefix: "http://www.some.site/123", titleToken: "test"};
        let data = {sites: [site]};
        let siteRecognition = new SiteRecognition(data);
        siteRecognition.siteIsCompatible("http://www.some.site/1234", "..test..");

        site.titleToken = "tes";
        let siteRecognition2 = new SiteRecognition(data);
        let extractedObject2 = siteRecognition2.returnAsObject();
        expect(getTitleToken(extractedObject2)).toEqual("tes");
        expect(siteRecognition.overlapsWith(siteRecognition2)).toBe(true);
        expect(siteRecognition2.overlapsWith(siteRecognition)).toBe(true);

        site.titleToken = "nope";
        let siteRecognition3 = new SiteRecognition(data);
        expect(siteRecognition.overlapsWith(siteRecognition3)).toBe(false);
        expect(siteRecognition3.overlapsWith(siteRecognition)).toBe(false);
        expect(siteRecognition2.overlapsWith(siteRecognition3)).toBe(false);
        expect(siteRecognition3.overlapsWith(siteRecognition2)).toBe(false);

    });

    it('can update via fitting object', function() {
        let site = {prefix: "http://www.some.site/123", titleToken: "test"};
        let data = {sites: [site]};
        let siteRecognition = new SiteRecognition(data);

        site.titleToken = "tes";
        site.prefix = "http://www.some.site/";
        siteRecognition.update(data);

        let extractedObject = siteRecognition.returnAsObject();
        expect(extractedObject.sites.length).toBe(1);
        expect(getPrefix(extractedObject)).toEqual("http://www.some.site/");
        expect(getTitleToken(extractedObject)).toEqual("tes");
    });
});

describe('Two sites', function() {

    it('can trigger on 2 keywords individually', function() {
        let site1 = {prefix: "http://www.some.site/12", titleToken: "test"};
        let site2 = {prefix: "http://www.some.site/12", titleToken: "tset"};
        let data = {sites: [site1, site2]};
        let siteRecognition = new SiteRecognition(data);
        expect(siteRecognition.isValid()).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "blabla")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "..test..")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "..tset..")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/1234", "..test..")).toBe(true);
    });

    it('don\'t crosstalk', function() {
        let site1 = {prefix: "http://www.some.site/12", titleToken: "test"};
        let site2 = {prefix: "http://www.some.site/32", titleToken: "tset"};
        let data = {sites: [site1, site2]};
        let siteRecognition = new SiteRecognition(data);
        expect(siteRecognition.isValid()).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "blabla")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "..test..")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/123", "..tset..")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/321", "..test..")).toBe(false);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/321", "..tset..")).toBe(true);
        expect(siteRecognition.siteIsCompatible("http://www.some.site/1234", "..test..")).toBe(true);
    });
});

function getPrefix(objectLike, siteId = 0) {
    return objectLike.sites[siteId].prefix;
}

function getTitleToken(objectLike, siteId = 0) {
    return objectLike.sites[siteId].titleToken;
}

function getLastUrl(objectLike, siteId = 0) {
    return objectLike.sites[siteId].lastUrl;
}

function getLastTitle(objectLike, siteId = 0) {
    return objectLike.sites[siteId].lastTitle;
}