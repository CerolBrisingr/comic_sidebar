import {SubscriberPort} from "../sidebar/subscriber_port.js"
import {ListeningPort} from "../background/listening_port.js"

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
}

class ReaderSyncCore extends ReaderSync {
    #readerData;
    constructor(intId, readerData) {
        super(intId);
        this.#setReaderData(readerData);
    }
    
    #setReaderData(readerData) {
        if (this.#readerData)
            return;
        this.#readerData = readerData;
        this.#setUp();
    }
    
    #setUp() {
        let fktReceive = (message) => {this.#receive(message);};
        this.port = new ListeningPort(fktReceive, this.getStrId());
    }
    
    #receive(message) {
        console.log(message);
        if (message.hasOwnProperty("pinRequest")) {
            this.#pinRequestHandler(message.pinRequest);
            return;
        }
        if (message.hasOwnProperty("unpinRequest")) {
            this.#unpinRequestHandler(message.unpinRequest);
        }
    }
    
    #pinRequestHandler(url) {
        if (this.#readerData.addManual(url)) {
            this.port.sendMessage({pinCommand: url});
        }
    }
    
    #unpinRequestHandler(url) {
        if (this.#readerData.removeManual(url)) {
            this.port.sendMessage({unpinCommand: url});
        }
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
        console.log(message);
        if (message.hasOwnProperty("pinCommand")) {
            this.#handlePinCommand(message.pinCommand);
            return;
        }
        if (message.hasOwnProperty("unpinCommand")) {
            this.#handleUnpinCommand(message.unpinCommand);
            return;
        }
    }
    
    #handlePinCommand(url) {
        this.#readerManager.addManual(url);
    }
    
    #handleUnpinCommand(url) {
        this.#readerManager.removeManual(url);
    }
}

export {ReaderSync}