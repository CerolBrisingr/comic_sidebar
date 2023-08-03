let connectionAlive = false;

class ListeningPort {
    #connectionName;
    #connections = new Map();
    #fktReceive;
    
    constructor(fktReceive, connectionName = "port_from_sidebar") {
        this.#fktReceive = fktReceive;
        this.#connectionName = connectionName;
        browser.runtime.onConnect.addListener((port) => {
            this.#contacted(port);
        });
    }
    
    isConnected() {
        return connectionAlive();
    }
    
    sendMessage(message) {
        if (!connectionAlive)
            return;
        for (let connection of this.#connections.values())
            connection.postMessage(message);
    }
    
    #contacted(port) {
        if (port.name !== this.#connectionName) {
            console.log("Connection failed due to identification");
            return;
        }
        let contextId = port.sender.contextId;
        this.#connections.set(contextId, port);
        connectionAlive = true;
        port.onMessage.addListener((message) => {
            this.#fktReceive(message);
        });
        port.onDisconnect.addListener((event) => {
            this.#connections.delete(contextId);
            connectionAlive = this.#connections.size === 0;
        });
    }
}

export {ListeningPort}