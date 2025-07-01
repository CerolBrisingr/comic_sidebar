import { dissectUrl, urlFitsPrefix, getUrlPrefixTail } from "../../scripts/shared/url.js";

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

describe('getUrlPrefixTail()', function() {
    let url;

    beforeEach(function() {
        url = "https://www.test.com/page1/";
    });

    it('should be able to get a tail via prefix', () => {
        let prefix = "https://www.test.com/";
        let tail = getUrlPrefixTail(url, prefix);
        expect(tail).toBe("page1/");
    });

    it('should be able to get a tail via prefix on http instead of https', () => {
        let prefix = "http://www.test.com/";
        let tail = getUrlPrefixTail(url, prefix);
        expect(tail).toBe("page1/");
    });

    it('should work for different protocol', () => {
        url = "ftp://www.test.com/page1/";
        let prefix = "ftp://www.test.com/";
        let tail = getUrlPrefixTail(url, prefix);
        expect(tail).toBe("page1/");
    });

    it('currently has no error handling', () => {
        expect(true).toBeTrue();
    });
});

describe('dissectUrl()', function() {

    it('should return undefined on reserved url', () => {
        let stuff = dissectUrl('about:config');
        expect(stuff).toBeUndefined();
    });

    it('should return undefined on url without protocol', () => {
        let stuff = dissectUrl('www.test.com');
        expect(stuff).toBeUndefined();
    });

    it('should return use origin as prefix for url only', () => {
        let stuff = dissectUrl('http://www.test.com/1/');
        expect(stuff.host).toBe('www.test.com');
        expect(stuff.tail).toBe("/1/");
        expect(stuff.base_url).toBe("http://www.test.com");
    });

    it('should return undefined on wrong prefix without fallback', () => {
        let stuff = dissectUrl('http://www.test.com/1/', 'http://www.test.cm');
        expect(stuff).toBeUndefined();

        stuff = dissectUrl('http://www.test.com/1/', 'http://www.test.cm', false);
        expect(stuff).toBeUndefined();
    });

    it('should return use origin as prefix for wrong prefix with fallback', () => {
        let stuff = dissectUrl('http://www.test.com/1/', 'http://www.test.cm', true);
        expect(stuff.tail).toBe("/1/");
    });

    it('should cope with https -> http transition', () => {
        let stuff = dissectUrl('http://www.test.com/1/', 'https://www.test.com');
        expect(stuff.tail).toBe("/1/");
    });
});
