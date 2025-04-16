import { SiteDetection } from "../../scripts/shared/site_detection.js";

describe('Single Site', function() {
    it('can be built from url', function() {
        let siteDetection = SiteDetection.buildFromUrl("http://www.some.site/1234");
        expect(siteDetection.isValid()).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123")).toBe(true);
        expect(siteDetection.siteIsCompatible("nope")).toBe(false);

        let extractedObject = siteDetection.returnAsObject();
        expect(extractedObject.sites.length).toBe(1);
        expect(extractedObject.sites[0].lastUrl).toEqual("http://www.some.site/123");
    });

    it('can be built via prefix', function() {
        let siteDetection = SiteDetection.buildFromPrefix("http://www.some.site/123");
        expect(siteDetection.isValid()).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site")).toBe(false);
    });

    it('can be built from dictionary', function() {
        let site = {prefix: "http://www.some.site/123", titleToken: ""};
        let data = {sites: [site]};
        let siteDetection = new SiteDetection(data);
        expect(siteDetection.isValid()).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site")).toBe(false);
    });

    it('can test title when built from dictionary', function() {
        let site = {prefix: "http://www.some.site/123", titleToken: "test"};
        let data = {sites: [site]};
        let siteDetection = new SiteDetection(data);
        expect(siteDetection.isValid()).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "blabla")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "..test..")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/1234", "..test..")).toBe(true);

        let extractedObject = siteDetection.returnAsObject();
        expect(extractedObject.sites[0].titleToken).toEqual("test");
        expect(extractedObject.sites[0].lastUrl).toEqual("http://www.some.site/1234");
        expect(extractedObject.sites[0].lastTitle).toEqual("..test..");
    });
});

describe('Two sites', function() {

    it('can trigger on 2 keywords individually', function() {
        let site1 = {prefix: "http://www.some.site/123", titleToken: "test"};
        let site2 = {prefix: "http://www.some.site/123", titleToken: "tset"};
        let data = {sites: [site1, site2]};
        let siteDetection = new SiteDetection(data);
        expect(siteDetection.isValid()).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "blabla")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "..test..")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "..tset..")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/1234", "..test..")).toBe(true);
    });

    it('don\'t crosstalk', function() {
        let site1 = {prefix: "http://www.some.site/123", titleToken: "test"};
        let site2 = {prefix: "http://www.some.site/321", titleToken: "tset"};
        let data = {sites: [site1, site2]};
        let siteDetection = new SiteDetection(data);
        expect(siteDetection.isValid()).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "blabla")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "..test..")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/123", "..tset..")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/321", "..test..")).toBe(false);
        expect(siteDetection.siteIsCompatible("http://www.some.site/321", "..tset..")).toBe(true);
        expect(siteDetection.siteIsCompatible("http://www.some.site/1234", "..test..")).toBe(true);
    });
});
