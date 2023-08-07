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
    
    setUp() {}
    receive(message) {}
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
        return this;
    }
    
    #setUp() {
        let fktReceive = (message) => {this.#receive(message);};
        this.port = new ListeningPort(fktReceive, this.getStrId());
    }
    
    #receive(message) {
        console.log(`Core "${this.#readerData.getLabel()}" received:`);
        console.log(message);
    }
    
}

class ReaderSyncSatellite extends ReaderSync {
    #readerManager;
    constructor(intId, readerManager) {
        super(intId);
        this.#setReaderManager(readerManager);
    }
    
    #setReaderManager(readerManager) {
        if (this.#readerManager)
            return;
        this.#readerManager = readerManager;
        this.#setUp();
        return this;
    }
    
    #setUp() {
        let fktReceive = (message) => {this.#receive(message);};
        this.port = new SubscriberPort(fktReceive, this.getStrId());
    }
    
    #receive(message) {
        console.log(`Satellite "${this.#readerManager.getLabel()}" received:`);
        console.log(message);
    }
}

export {ReaderSync}