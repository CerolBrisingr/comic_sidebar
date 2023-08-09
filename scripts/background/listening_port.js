class ListeningPort {
    
    static openConnections = new Map();
    
    #connectionName;
    #connected = new Map();
    #fktReceive;
    #connectionAlive = false;
    
    constructor(fktReceive, connectionName = "port_from_sidebar") {
        this.#fktReceive = fktReceive;
        this.#connectionName = connectionName;
        this.#startListening();
        this.#registerOpenPort();
    }
    
    #startListening() {
        if (!browser.runtime.onConnect.hasListener(ListeningPort.listenForSubscribers))
            browser.runtime.onConnect.addListener(ListeningPort.listenForSubscribers);
    }

    static listenForSubscribers(port) {
        if (ListeningPort.openConnections.has(port.name)) {
            let fkt = ListeningPort.openConnections.get(port.name);
            fkt(port);
        } else {
            console.log(`Failed to find port "${port.name}"`);
        }
    }
    
    #registerOpenPort() {
        if (ListeningPort.openConnections.has(this.#connectionName)) {
            console.log(`Conflict: replacing connection "${this.#connectionName}"`);
            ListeningPort.openConnections.delete(this.#connectionName);
        }
        let fktContacted = (port) => {this.#contacted(port);}
        ListeningPort.openConnections.set(this.#connectionName, fktContacted);
    }
    
    disconnect() {
        ListeningPort.openConnections.delete(this.#connectionName);
        this.#connected.clear();
    }
    
    isConnected() {
        return this.#connectionAlive;
    }
    
    sendMessage(message) {
        if (!this.#connectionAlive)
            return;
        for (let connection of this.#connected.values())
            connection.postMessage(message);
    }
    
    #contacted(port) {
        if (port.name !== this.#connectionName) {
            console.log("Connection failed due to identification");
            return;
        }
        let contextId = port.sender.contextId;
        this.#connected.set(contextId, port);
        this.#connectionAlive = true;
        port.onMessage.addListener((message) => {
            this.#fktReceive(message);
        });
        port.onDisconnect.addListener((event) => {
            this.#connected.delete(contextId);
            this.#connectionAlive = !(this.#connected.size === 0);
        });
    }
}

export {ListeningPort}