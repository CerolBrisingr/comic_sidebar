import { HtmlContainer} from "../../scripts/shared/html_container.js"

describe("MinimalObject", function() {

    it('should properly initialize', function() {
        let object = new MinimalObject();
        expect(object.urls).toEqual([]);

        object = new MinimalObject("test1");
        expect(object.urls).toEqual(["test1"]);
        expect(object.urlIsCompatible("test1")).toBe(true);
        expect(object.urlIsCompatible("test")).toBe(false);

        object = new MinimalObject(["test", "test2"]);
        expect(object.urls).toEqual(["test", "test2"]);
        expect(object.urlIsCompatible("test")).toBe(true);
        expect(object.urlIsCompatible("test2")).toBe(true);
    });

});

describe("HtmlContainer", function() {

    it('needs a default constructor', function() {
        let storage = new HtmlContainer();
        expect(storage.keys()).toEqual([]);
        expect(storage.getList()).toEqual([]);
    });

    it('works with a single element', function() {
        let storage = new HtmlContainer();
        let url = "http://www.test.com/123";
        let object = new MinimalObject(url);

        storage.saveObject(object, object.getPrefixMasks());
        expect(storage.getObject(url)).toBe(object);
        expect(storage.getCargoListForUrl(url)).toEqual([object]);
        expect(storage.getCargoListForHost("www.test.com")).toEqual([object]);
        expect(storage.keys()).toEqual(["www.test.com"]); 
        expect(storage.getList()).toEqual([object]);
    });

    it('works with 3 elements, 2 sharing the host url', function() {
        let storage = new HtmlContainer();
        let url1 = "http://www.test.com/123";
        let url2 = "http://www.test.com/456";
        let url3 = "http://www.test2.com/123";
        let object1 = new MinimalObject(url1);
        let object2 = new MinimalObject(url2);
        let object3 = new MinimalObject(url3);

        storage.saveObject(object1, object1.getPrefixMasks());
        storage.saveObject(object2, object2.getPrefixMasks());
        storage.saveObject(object3, object3.getPrefixMasks());
        
        expect(storage.getObject(url1)).toBe(object1);
        expect(storage.getObject(url2)).toBe(object2);
        expect(storage.getObject(url3)).toBe(object3);

        expect(storage.getCargoListForUrl(url1)).toEqual([object1, object2]);
        expect(storage.getCargoListForUrl(url2)).toEqual([object1, object2]);
        expect(storage.getCargoListForUrl(url3)).toEqual([object3]);

        expect(storage.getCargoListForHost("www.test.com")).toEqual([object1, object2]);
        expect(storage.getCargoListForHost("www.test2.com")).toEqual([object3]);

        expect(storage.keys()).toEqual(["www.test.com", "www.test2.com"]); 
        expect(storage.getList()).toEqual([object1, object2, object3]);

        storage.removeObject(url3);
        expect(storage.keys()).toEqual(["www.test.com"]);
        expect(storage.getList()).toEqual([object1, object2]);
        expect(storage.getObject(url3)).toBe(undefined);

    });

    it('works with aliased object', function() {
        let storage = new HtmlContainer();
        let url1 = "http://www.test.com/123";
        let url2 = "http://www.test2.com/456";
        let object = new MinimalObject([url1, url2]);

        storage.saveObject(object, object.getPrefixMasks());
        expect(storage.getObject(url1)).toBe(object);
        expect(storage.getObject(url2)).toBe(object);
        expect(storage.getCargoListForUrl(url1)).toEqual([object]);
        expect(storage.getCargoListForHost("www.test.com")).toEqual([object]);
        expect(storage.keys()).toEqual(["www.test.com", "www.test2.com"]); 
        expect(storage.getList()).toEqual([object]);
    });

});

class MinimalObject {
    urls = [];

    constructor(urlList){
        if(urlList === undefined) return;
        if(!Array.isArray(urlList)) {
            urlList = [urlList];
        }
        this.urls = urlList;
    }

    getPrefixMasks() {
        return this.urls;
    }

    urlIsCompatible(url) {
        return this.urls.includes(url);
    }
}