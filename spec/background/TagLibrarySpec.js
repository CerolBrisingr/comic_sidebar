import { ReaderData } from "../../scripts/shared/reader_data.js";
import { TagLibrary } from "../../scripts/background/tag_libraray.js";

describe("TagLibrary", function() {
    let object = new ReaderObjectStub();
    let readerData;
    let tagLibrary;

    beforeEach(function() {
        readerData = ReaderData.buildForEditor(object);
        readerData.addTag("test1");
        readerData.addTag("test2");

        tagLibrary = new TagLibrary();
    });

    it("should read tags from ReaderData", function() {
        tagLibrary.registerTags(readerData);
        expect(tagLibrary.isFine()).toBeTrue();
        expect(tagLibrary.getKnownTags()).toEqual(["test1", "test2"]);
        expect(tagLibrary.getCorrespondingValues()).toEqual([1, 1]);
    });

    it("should be able to clear its memory", function() {
        tagLibrary.registerTags(readerData);
        tagLibrary.clear();
        expect(tagLibrary.isFine()).toBeTrue();
        expect(tagLibrary.getKnownTags()).toEqual([]);

        tagLibrary.retractTags(readerData);
        expect(tagLibrary.isFine()).toBeFalse();
        tagLibrary.clear();
        expect(tagLibrary.isFine()).toBeTrue();
    });

    it("should have issues removing tags from an empty library", function() {
        tagLibrary.retractTags(readerData);
        expect(tagLibrary.isFine()).toBeFalse();
        expect(tagLibrary.getKnownTags()).toEqual([]);
    });

    it("should have no issues removing no tags from an empty library", function() {
        readerData = ReaderData.buildForEditor(object);
        tagLibrary.retractTags(readerData);
        expect(tagLibrary.isFine()).toBeTrue();
        expect(tagLibrary.getKnownTags()).toEqual([]);
    });

    it("should be able to add and remove tags", function() {
        tagLibrary.registerTags(readerData);
        expect(tagLibrary.getKnownTags()).toEqual(["test1", "test2"]);
        tagLibrary.retractTags(readerData);
        expect(tagLibrary.isFine()).toBeTrue();
        expect(tagLibrary.getKnownTags()).toEqual([]);
    });

    it("should be able to combine tags", function() {
        let readerData2 = ReaderData.buildForEditor(object);
        readerData2.addTag("test2");
        readerData2.addTag("test3");
        tagLibrary.registerTags(readerData);
        tagLibrary.registerTags(readerData2);
        expect(tagLibrary.isFine()).toBeTrue();
        expect(tagLibrary.getKnownTags()).toEqual(["test1", "test2", "test3"]);
        expect(tagLibrary.getCorrespondingValues()).toEqual([1, 2, 1]);

        tagLibrary.retractTags(readerData2);
        expect(tagLibrary.isFine()).toBeTrue();
        expect(tagLibrary.getKnownTags()).toEqual(["test1", "test2"]);
        expect(tagLibrary.getCorrespondingValues()).toEqual([1, 1]);
    });
});

function ReaderObjectStub() {
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