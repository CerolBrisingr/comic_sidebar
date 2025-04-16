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

        expect(siteDetection.overlapsWith(siteDetection)).toBe(false);
        expect(siteDetection.overlapsWith(2)).toBe(true);

        let siteDetection2 = SiteDetection.buildFromUrl("http://www.some.site/1234");
        expect(siteDetection.overlapsWith(siteDetection2)).toBe(true);
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

    it('can check for overlaps', function() {
        let site = {prefix: "http://www.some.site/123", titleToken: "test"};
        let data = {sites: [site]};
        let siteDetection = new SiteDetection(data);
        siteDetection.siteIsCompatible("http://www.some.site/1234", "..test..");

        site.titleToken = "tes";
        let siteDetection2 = new SiteDetection(data);
        let extractedObject2 = siteDetection2.returnAsObject();
        expect(extractedObject2.sites[0].titleToken).toEqual("tes");
        expect(siteDetection.overlapsWith(siteDetection2)).toBe(true);
        expect(siteDetection2.overlapsWith(siteDetection)).toBe(true);

        site.titleToken = "nope";
        let siteDetection3 = new SiteDetection(data);
        expect(siteDetection.overlapsWith(siteDetection3)).toBe(false);
        expect(siteDetection3.overlapsWith(siteDetection)).toBe(false);
        expect(siteDetection2.overlapsWith(siteDetection3)).toBe(false);
        expect(siteDetection3.overlapsWith(siteDetection2)).toBe(false);

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
