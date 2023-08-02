let connectionAlive = false;

class ListeningPort {
    #connectionName;
    #connection;
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
        if (connectionAlive)
            this.#connection.postMessage(message);
    }
    
    #contacted(port) {
        if (port.name !== this.#connectionName) {
            console.log("Connection failed due to identification");
            return;
        }
        this.#connection = port;
        connectionAlive = true;
        this.#connection.onMessage.addListener((message) => {
            this.#fktReceive(message);
        });
        this.#connection.onDisconnect.addListener((event) => {
            connectionAlive = false;
        });
    }
}

export {ListeningPort}