import { dissectUrl, urlFitsPrefix, getTail } from "../../scripts/shared/url.js";

describe('urlFitsPrefix()', function() {
    it('should recognize prefix url', () => {
        let prefix = "http://www.test.com";
        expect(urlFitsPrefix(prefix, prefix)).toBeTrue();
    });

    it('should recognize extended prefix', () => {
        let url = "http://www.test.com/page1/";
        let prefix = "http://www.test.com/";
        expect(urlFitsPrefix(url, prefix)).toBeTrue();
    });

    it('should reject reduced prefix url', () => {
        let prefix = "http://www.test.com/page1/";
        let url = "http://www.test.com/";
        expect(urlFitsPrefix(url, prefix)).toBeFalse();
    });

    it('should allow moving from http to https', () => {
        let url = "https://www.test.com/page1/";
        let prefix = "http://www.test.com/";
        expect(urlFitsPrefix(url, prefix)).toBeTrue();
    });

    it('should also allow moving from https to http', () => {
        let url = "http://www.test.com/page1/";
        let prefix = "https://www.test.com/";
        expect(urlFitsPrefix(url, prefix)).toBeTrue();
    });

    it('should still do its job while switching protocol', () => {
        let prefix = "http://www.test.com/page1/";
        let url = "https://www.test.com/";
        expect(urlFitsPrefix(url, prefix)).toBeFalse();
    });

    it('should not allow any other protocol transitions', () => {
        let url = "http://www.test.com/page1/";
        let prefix = "ftp://www.test.com/";
        expect(urlFitsPrefix(url, prefix)).toBeFalse();
    });
});

describe('getTail()', function() {
    it('needs some tests', () => {
        expect(false).toBeTrue();
    });
});

describe('dissectUrl()', function() {
    it('needs some tests', () => {
        expect(false).toBeTrue();
    });
});
