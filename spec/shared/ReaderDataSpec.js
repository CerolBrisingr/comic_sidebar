import { ReaderData } from "../../scripts/shared/reader_data.js";

describe("ReaderData", function() {
    let object = readerObjectStub();
    let readerData;
    let readerObject;

    it('should be able to construct from this', function() {
        readerData = ReaderData.buildForEditor(object);
        compareReader(readerData, object);
    });

    it('should be possible to export object', function() {
        readerData = ReaderData.buildForEditor(object);
        readerObject = readerData.returnAsObject();
        compareReaderObject(readerObject, object);
    });

    it('should be possible to reload the readerObject', function() {
        readerData = ReaderData.buildForEditor(object);
        readerData.addTag("test");
        readerObject = readerData.returnAsObject();
        let newReaderData = ReaderData.buildForEditor(readerObject);
        expect(newReaderData).toEqual(readerData);
        expect(readerObject).toEqual(newReaderData.returnAsObject());
    });

    it('should be possible to modify a reader Object', function() {
        readerData = ReaderData.buildForEditor(object);
        readerData.addTag("test");
        readerData.setLabel("Updated");
        readerData.setPrefixMask("http://www.somecomic.com/");
        readerObject = readerData.returnAsObject();
        let newReaderData = ReaderData.buildForEditor(object);
        newReaderData.editReader(readerObject);
        expect(newReaderData).toEqual(readerData);
        expect(readerObject).toEqual(newReaderData.returnAsObject());
    });

});

describe("ReaderData tags", function() {
    let object = readerObjectStub();

    it('should not accept identical tags', function() {
        let readerData = ReaderData.buildForEditor(object);
        readerData.addTag("test");
        readerData.addTag("test");
        expect(readerData.getTags()).toEqual(["test"]);
    });

    it('should accept different tags', function() {
        let readerData = ReaderData.buildForEditor(object);
        readerData.addTag("test");
        readerData.addTag("test2");
        expect(readerData.getTags()).toEqual(["test", "test2"]);
    });

    it('should not allow tagging with "untagged"', function() {
        let readerData = ReaderData.buildForEditor(object);
        readerData.addTag("untagged");
        expect(readerData.getTags()).toEqual([]);
    });
});

function compareReader(readerData, object) {
    let retObject = readerData.returnAsObject();
    expect(readerData).not.toBeUndefined();
    expect(readerData.getLabel()).toBe(object.label);
    // TODO: update tests
    expect(readerData.getPrefixMask()).toBe(object.site_recognition.sites[0].prefix);
    expect(readerData.getMostRecentAutomaticUrl()).toBe(object.automatic[0].href);
}

function compareReaderObject(readerObject, object) {
    expect(readerObject).not.toBeUndefined();
    expect(readerObject.label).toBe(object.label);
    expect(readerObject.site_recognition.sites[0].prefix).toEqual(object.site_recognition.sites[0].prefix);
    expect(readerObject.automatic).toEqual(object.automatic);
}

function readerObjectStub() {
    return {
        site_recognition: {
            sites: [
                {
                    prefix: "http://www.somecomic.com",
                    lastUrl: "http://www.somecomic.com"
                }
            ]
        },
        label: "Some Comic",
        automatic: [
            {href: "http://www.somecomic.com/123/"}
        ], 
        manual: [
            {href: "http://www.somecomic.com/173", label: "test"}
        ]
    }
}

export {readerObjectStub}