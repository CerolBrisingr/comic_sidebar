import {SubscriberPort} from "../sidebar/subscriber_port.js"
import {ListeningPort} from "../background/listening_port.js"
import { ReaderEditorControl } from "../editor/reader_editor_control.js";

// Direct communication between the instance of a reader in 
// the background script and it's representations within each sidebar

class ReaderSync {
    intId;
    port;
    
    static makeCore(intId, readerData) {
        return new ReaderSyncCore(intId, readerData);
    }
    static makeSatellite(intId, readerManager) {
        return new ReaderSyncSatellite(intId, readerManager);
    }
    
    constructor(intId) {
        if (this.constructor === ReaderSync)
            throw new Error("ReaderSync is abstract, cannot instantiate!");
        this.intId = intId;
    }
    
    getId() {
        return this.intId;
    }
    
    getStrId() {
        return `id${this.intId}`;
    }
    
    disconnect() {
        this.port.disconnect();
    }
}

class ReaderSyncCore extends ReaderSync {
    #readerManager;
    constructor(intId, readerManager) {
        super(intId);
        this.#setReaderData(readerManager);
    }
    
    #setReaderData(readerManager) {
        if (this.#readerManager)
            return;
        this.#readerManager = readerManager;
        this.#setUp();
    }
    
    #setUp() {
        let fktReceive = (message) => {this.#receive(message);};
        this.port = new ListeningPort(fktReceive, this.getStrId());
    }
    
    #receive(message) {
        if (message.hasOwnProperty("pinRequest")) {
            this.#pinRequestHandler(message.pinRequest);
            return;
        }
        if (message.hasOwnProperty("unpinRequest")) {
            this.#unpinRequestHandler(message.unpinRequest);
            return;
        }
        if (message.hasOwnProperty("editRequest")) {
            this.#editRequestHandler(this.#readerManager, message.editRequest);
            return;
        }
        if (message.hasOwnProperty("updateBookmarkLabelRequest")) {
            this.#updateBookmarkLabelRequestHandler(message.updateBookmarkLabelRequest);
            return;
        }
    }
    
    #pinRequestHandler(url) {
        if (this.#readerManager.addManual(url)) {
            this.port.sendMessage({pinCommand: url});
        }
    }
    
    #unpinRequestHandler(url) {
        if (this.#readerManager.removeManual(url)) {
            this.port.sendMessage({unpinCommand: url});
        }
    }
    
    #editRequestHandler(readerManager, favIcon) {
        let readerObject = readerManager.returnAsObject();
        readerObject.knownTags = readerManager.getKnownTags();
        readerObject.favIcon = favIcon;
        readerObject.mostRecentAutomaticUrl = readerManager.getMostRecentAutomaticUrl();
        ReaderEditorControl.updateReaderEntry(readerObject, (readerObjectLike) => {
            this.#handleReaderEdit(readerObjectLike);
        });
    }

    #handleReaderEdit(readerObjectLike) {
        if (readerObjectLike.hasOwnProperty("deleteMe")) {
            this.#deleteRequestHandler(readerObjectLike.deleteMe);
            return;
        }
        if (!this.#readerManager.canBeUpdatedWith(readerObjectLike)) {
            console.log("Conflict detected, will not update ");
            // TODO: notify editor of failure
            return;
        }
        this.#readerManager.editReader(readerObjectLike);
        this.port.sendMessage({editCommand: readerObjectLike});
    }
    
    #deleteRequestHandler(deleteMe) {
        if (!deleteMe)
            return;
        this.port.sendMessage("deleteCommand");
        this.#readerManager.deleteMe();
    }
    
    #updateBookmarkLabelRequestHandler(payload) {
        this.#readerManager.updateBookmarkLabel(payload.url, payload.newLabel);
        this.port.sendMessage({updateBookmarkLabel: payload});
    }
}

class ReaderSyncSatellite extends ReaderSync {
    #readerManager;
    constructor(intId, readerManager) {
        super(intId);
        this.#setReaderManager(readerManager);
    }
    
    sendPinRequest(url) {
        this.port.sendMessage({pinRequest: url});
    }
    
    sendUnpinRequest(url) {
        this.port.sendMessage({unpinRequest: url});
    }
    
    
    sendEditRequest(favIcon) {
        this.port.sendMessage({editRequest: favIcon});
    }
    
    sendBookmarkLabelUpdateRequest(url, newLabel) {
        let payload = {url: url, newLabel: newLabel};
        this.port.sendMessage({updateBookmarkLabelRequest: payload});
    }
    
    #setReaderManager(readerManager) {
        if (this.#readerManager)
            return;
        this.#readerManager = readerManager;
        this.#setUp();
    }
    
    #setUp() {
        let fktReceive = (message) => {this.#receive(message);};
        this.port = new SubscriberPort(fktReceive, this.getStrId());
    }
    
    #receive(message) {
        if (message.hasOwnProperty("pinCommand")) {
            this.#handlePinCommand(message.pinCommand);
            return;
        }
        if (message.hasOwnProperty("unpinCommand")) {
            this.#handleUnpinCommand(message.unpinCommand);
            return;
        }
        if (message.hasOwnProperty("editCommand")) {
            this.#handleEditCommand(message.editCommand);
            return;
        }
        if (message === "deleteCommand") {
            this.#handleDeleteCommand();
            return;
        }
        if (message.hasOwnProperty("updateBookmarkLabel")) {
            this.#handleUpdateBookmarkLabelCommand(message.updateBookmarkLabel);
            return;
        }
    }
    
    #handlePinCommand(url) {
        this.#readerManager.addManual(url);
    }
    
    #handleUnpinCommand(url) {
        this.#readerManager.removeManual(url);
    }
    
    #handleEditCommand(readerEssentials) {
        this.#readerManager.editReader(readerEssentials);
    }
    
    #handleDeleteCommand() {
        this.#readerManager.deleteMe();
    }
    
    #handleUpdateBookmarkLabelCommand(payload) {
        this.#readerManager.updateBookmarkLabel(payload.url, payload.newLabel);
    }
}

export {ReaderSync}