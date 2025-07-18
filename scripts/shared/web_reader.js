import { HtmlContainer } from "./html_container.js"
import { CoreReaderManager, SidebarReaderManager } from "./reader_manager.js"
import { importBackup, unpackReaderObjectList } from "./backup_import.js"
import { saveBackup, buildWebReaderObject } from "./backup_export.js"
import { ReaderFilter } from "../sidebar/reader_filter.js"
import { TagFilter } from "../sidebar/tag_filter.js"
import { SortSelector } from "../sidebar/reader_sort.js"
import { ReaderSort } from "../sidebar/reader_sort.js"
import { FavIconController, FavIconSubscriber } from "./fav_icon_manager.js"
import { dissectUrl } from "./url.js"
import { TagLibrary } from "../background/tag_libraray.js"
import { TagEditorFilter } from "./tag_editor.js"

class WebReader {
    _tagLibrary = new TagLibrary();
    _readerSort = new ReaderSort("Name");

    constructor() {
        this._currentReader = new ReaderClassDummy();
        this._savingSuspended = false;
        this._readerStorage = this.#buildStorage();
        this._latestId = 0;
    }

    #buildStorage() {
        const fktIdentifyExtension = (entry, identification) => {
            return entry.urlIsCompatible(identification, false);
        };
        const fktIdentifyObject = (entry, identification) => {
            return entry.urlIsCompatible(identification, true);
        };
        return new HtmlContainer(fktIdentifyExtension, fktIdentifyObject);
    }
    
    async importBackup(file, fktDone) {
        let fktImportBackup = (readerObjectList) => {
            let run = this._importReaderObjectList(readerObjectList);
            run.then(() => {
                fktDone();
            });
        }
        importBackup(file, fktImportBackup);
    }
    
    updateBookmark(data) {
        let object = this._selectCorrespondingStorage(data.url);
        if (!object.isValid()) {
            data.doCollapse = true;
            return true;
        }
        data.doCollapse = false;
        return object.addAutomatic(data);
    }
    
    saveBackup() {
        saveBackup(this._getSortedStorage());
    }
    
    _clearData() {
        for (let storageObject of this._readerStorage.getList()) {
            storageObject.deleteMe();
        }
        this._readerStorage.clearData();
    }

    _getSortedStorage() {
        return this._readerSort.apply(this._readerStorage.getList());
    }
    
    getObjectList() {
        let readerObject = buildWebReaderObject(this._getSortedStorage());
        return readerObject.data;
    }
    
    _selectCorrespondingStorage(url) {
        if (this._currentReader.urlIsCompatible(url))
            return this._currentReader;
        let object = this._readerStorage.getObject(url);
        if (object === undefined) {
            this._updateCurrentReader(new ReaderClassDummy());
            return this._currentReader;
        }
        this._updateCurrentReader(object);
        return object;
    }
    
    _updateCurrentReader(newObject) {
        this._currentReader.collapse();
        newObject.expand();
        this._currentReader = newObject;
    }
    
    _importReaderObjectList(readerObjectList){
        this._clearData();
        this._savingSuspended = true;
        for (let [index, readerObject] of readerObjectList.entries()) {
            this._latestId = index;
            let newObject = this._createReaderClass(readerObject, index);
            if (!newObject.isValid())
                continue;
            this._readerStorage.saveObject(newObject, newObject.getPrefixMasks());
        }
        this._savingSuspended = false;
        this.saveProgress();
    }
    
    _createReaderClass(readerObject, intId) {
        throw new Error("not implemented");
    }

    getKnownTags() {
        return this._tagLibrary.getKnownTags();
    }

    recountTags() {
        this._tagLibrary.clear();
        let readerManagerList = this._readerStorage.getList();
        for (let readerManager of readerManagerList) {
            this._tagLibrary.registerTags(readerManager);
        }
    }
    
    async registerReader(readerObjectLike) {
        let storageObject 
            = this._selectCorrespondingStorage(readerObjectLike.url);
        if (storageObject.isValid()) {
            console.log("Page already registered as " + storageObject.getLabel());
            return -1;
        }
        this._latestId += 1;
        let newManager = this._createReaderClass(readerObjectLike, this._latestId);
        if (!newManager.isValid()) {
            console.log("Failed to build comic entry");
            return -1;
        }
        this._readerStorage.saveObject(newManager, newManager.getPrefixMasks());
        await this._registerFavIcon(readerObjectLike);
        await this.updateBookmark(readerObjectLike, false); // This also updates storage
        this.relistViewers();
        return this._latestId;
    }
    
    removeReader(prefixMasks) {
        for (let prefixMask of prefixMasks) {
            if (this._currentReader.urlIsCompatible(prefixMask, true))
                this._updateCurrentReader(new ReaderClassDummy());
        }
        this._readerStorage.removeObject(prefixMasks);
        this.saveProgress();
    }

    relistViewers() {}
    saveProgress() {}
    _updateFavIcon() {}
    recountTags() {}
    async _registerFavIcon() {}
}

class WebReaderBackground extends WebReader {
    #favIconController = new FavIconController();
    
    constructor() {
        super();
    }

    _createReaderClass(readerObject, intId) {
        return new CoreReaderManager(
            readerObject,
            new WebReaderInterface(this),
            this._tagLibrary,
            intId
        )
    }
    
    async loadInterface() {
        let storageResult = await browser.storage.local.get("comicData");
        if (!storageResult.hasOwnProperty("comicData")) {
            console.log("No data stored locally, aborting loading sequence!");
            return;
        }
        let readerObjectList = unpackReaderObjectList(storageResult.comicData);
        await this._importReaderObjectList(readerObjectList);
    }

    async _importReaderObjectList(readerObjectList) {
        super._importReaderObjectList(readerObjectList);
        await this.#favIconController.initialize(this._readerStorage.keys());
    }

    canReaderBeUpdatedWith(readerData, newReaderData) {
        // A prefixMask always contains at least the host url
        const prefixList = newReaderData.getPrefixMasks();
        for (const prefix of prefixList) {
            const candidates = this._readerStorage.getCargoListForUrl(prefix);
            if (!this.#testEditWithCandidates(candidates, readerData, newReaderData))
                return false;
        }
        return true;
    }

    #testEditWithCandidates(candidates, readerData, newReaderData) {
        const newSiteRecognition = newReaderData.getRecognitionInterface();
        for (const candidate of candidates) {
            // Edited version will replace the version to edit
            if (candidate.managesThis(readerData)) continue;

            // Bilaterally test for conflicts with unrelated element
            const siteRecognition = candidate.getRecognitionInterface();
            if (!siteRecognition.canCoexistWith(newSiteRecognition)) return false;
            if (!newSiteRecognition.canCoexistWith(siteRecognition)) return false;
        }
        return true;
    }

    async updateBookmark(data, doClean = true) {
        let wasValid = this._currentReader.isValid();
        let bookmarkIsNew = super.updateBookmark(data);
        let favIconIsNew = await this._updateFavIcon(data);
        if (!favIconIsNew & doClean) {
            delete data.favIcon;
        }
        let sendReset = wasValid & data.doCollapse;
        return bookmarkIsNew | favIconIsNew | sendReset;
    }

    async _registerFavIcon(data) {
        const urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined) {
            delete data.favIcon;
            return false;
        }
        const info = await this.#favIconController.setValue(urlPieces.host, data.favIcon);
        data.favIcon = info.favIcon;
    }

    async _updateFavIcon(data) {
        if (data.favIcon === undefined) {
            return false;
        }
        const urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined) {
            return false;
        }
        const info = await this.#favIconController.updateValue(urlPieces.host, data.favIcon);
        if (!info.hasUpdate) {
            return false;
        }
        data.favIcon = info.favIcon;
        return true;
    }
    
    saveProgress() {
        if (this._savingSuspended)
            return;
        let comicDataObject = buildWebReaderObject(this._readerStorage.getList());
        browser.storage.local.set({comicData: comicDataObject});
    }
}

class WebReaderSidebar extends WebReader {
    #container;
    #showAllInterface;
    #sortControl;
    #tagEditor;
    #tagFilter;
    #favIconSubscriber = new FavIconSubscriber();
    #readerFilter = new ReaderFilter("");

    constructor(container, showAllInterface, sortUi) {
        if (container == undefined)
            throw new Error("Containing element for reader listings must be provided");
        super();
        this.#createSortControl(sortUi);
        this.#createTagDropdown(sortUi.filter);
        this.#setUpSearchBar(sortUi.filter.titleFilterInput);
        this.#createTagFilter();
        this.#container = container;
        this.#showAllInterface = showAllInterface;
    }

    #createSortControl(sortUi) {
        const fcnUpdate = (strRule) => {
            this._readerSort.setRule(strRule);
            this.relistViewers();
        };
        this.#sortControl = new SortSelector(sortUi);
        this.#sortControl.setOnUpdate(fcnUpdate);
    }

    #setUpSearchBar(searchBox) {
        searchBox.addEventListener("input", (event) => {
            this.#readerFilter.setFilter(event.target.value);
            this.relistViewers();
        });
    }

    #createTagDropdown(filter) {
        this.#tagEditor = new TagEditorFilter(this._tagLibrary); // Hardcoded ids as of now
        this.#sortControl.setOnClickFilter((newState) => {
            if (newState) {
                filter.icon.style.visibility = "visible";
                filter.tagFilterDiv.style.display = "block";
            } else {
                filter.icon.style.visibility = "hidden";
                filter.tagFilterDiv.style.display = "none";
            }
        });
        this.#sortControl.triggerOnClickFilter();
    }
    
    #createTagFilter() {
        this.#tagFilter = new TagFilter(this.#tagEditor);
        this.#tagEditor.setTagsChangedFcn(() => {
            this.relistViewers();
        });
    }

    _createReaderClass(readerObject) {
        return new SidebarReaderManager(
            readerObject,
            new WebReaderInterface(this),
            this.#showAllInterface,
            this._tagLibrary
        )
    }

    async _importReaderObjectList(readerObjectList) {
        super._importReaderObjectList(readerObjectList);
        await this.#favIconSubscriber.initialize(this._readerStorage.keys());
        this.#setFavIcons();
        this._setContainerContent();
    }

    async updateBookmark(data) {
        if (data.doCollapse) {
            this._updateCurrentReader(new ReaderClassDummy());
            this.relistViewers();
        } else {
            super.updateBookmark(data);
        }
        this._updateFavIcon(data);
    }

    async _registerFavIcon(data) {
        const urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined) {
            delete data.favIcon;
            return false;
        }
        await this.#favIconSubscriber.setValue(urlPieces.host, data.favIcon);
        this.setFavIconFromKey(urlPieces.host, data.favIcon);
    }
    
    _updateFavIcon(data) {
        if (!data.hasOwnProperty("favIcon")) {
            return;
        }
        const urlPieces = dissectUrl(data.url);
        if (urlPieces === undefined)
            return; // Should not happen in sidebar
        let update = this.#favIconSubscriber.updateValue(urlPieces.host, data.favIcon);
        update.then((info) => {
            if (!info.hasUpdate)
                return;
            this.setFavIconFromKey(urlPieces.host, info.favIcon);
        });
    }

    #setFavIcons() {
        for (const [key, value] of this.#favIconSubscriber.entries()) {
            this.setFavIconFromKey(key, value);
        }
    }

    setFavIconFromKey(key, value) {
        let managerList = this._readerStorage.getPrimaryCargoListForHost(key);
        for (const manager of managerList) {
            manager.updateFavIcon(value);
        }
    }

    _selectCorrespondingStorage(url) {
        let newReader = super._selectCorrespondingStorage(url);
        this.relistViewers();
        return newReader;
    }

    relistViewers() {
        this._setContainerContent();
    }
    
    _setContainerContent() {
        let visualsList = [];
        for (let manager of this._getSortedStorage()) {
            if (!manager.isValid())
                continue;
            if (!this.#readerFilter.fits(manager))
                continue;
            if (!this.#tagFilter.fits(manager))
                continue;
            if (!this.#canShow(manager))
                continue;
            visualsList.push(manager.getVisuals());
        }
        this.#container.replaceChildren(...visualsList);
    }

    #canShow(manager) {
        return manager.canShow() | manager === this._currentReader;
    }
    
    async importInterface(readerObjectList) {
        if (readerObjectList === undefined)
            return;
        this._importReaderObjectList(readerObjectList);
    }
}


class WebReaderInterface {
    #webReader
    
    constructor(webReader) {
        this.#webReader = webReader;
    }
    
    saveProgress() {
        this.#webReader.saveProgress();
    }
    
    removeReader(prefixMasks) {
        this.#webReader.removeReader(prefixMasks);
    }

    canWeUpdateReaderWith(readerData, newReaderData) {
        return this.#webReader.canReaderBeUpdatedWith(readerData, newReaderData);
    }
    
    relistViewerDisplay() {
        this.#webReader.relistViewers();
    }

    recountTags() {
        this.#webReader.recountTags();
    }
}

class ReaderClassDummy {
    constructor() {}
    
    isValid() {
        return false;
    }

    getLabel() {
        return "Dummy";
    }
    
    urlIsCompatible(url, allowPrefix) {
        return false;
    }

    canShow() {
        return false;
    }
    
    expand() {}
    collapse() {}
}

export {WebReaderSidebar, WebReaderBackground}