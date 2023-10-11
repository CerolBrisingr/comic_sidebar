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
        readerObject = readerData.returnAsObject();
        let newReaderData = ReaderData.buildForEditor(readerObject);
        expect(newReaderData).toEqual(readerData);
        expect(readerObject).toEqual(newReaderData.returnAsObject());
    });

});

function compareReader(readerData, object) {
    expect(readerData).not.toBeUndefined();
    expect(readerData.getLabel()).toBe(object.label);
    expect(readerData.getPrefixMask()).toBe(object.prefix_mask);
    expect(readerData.getMostRecentAutomaticUrl()).toBe(object.automatic[0].href);
}

function compareReaderObject(readerObject, object) {
    expect(readerObject).not.toBeUndefined();
    expect(readerObject.label).toBe(object.label);
    expect(readerObject.prefix_mask).toBe(object.prefix_mask);
    expect(readerObject.automatic).toEqual(object.automatic);
}

function readerObjectStub() {
    return {
        prefix_mask: "http://www.somecomic.com",
        label: "Some Comic",
        automatic: [
            {href: "http://www.somecomic.com/123/"}
        ], 
        manual: [
            {href: "http://www.somecomic.com/173", label: "test"}
        ]
    }
}