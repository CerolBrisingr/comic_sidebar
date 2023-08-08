class SubscriberPort {
    #connection;
    #fktReceive;
    #connectionName;
    
    constructor(fktReceive, connectionName = "port_from_sidebar") {
        this.#fktReceive = fktReceive;
        this.#connectionName = connectionName;
        this.#connection = browser.runtime.connect(
            "sb_webcomic_sidebar@whythis.format",
            {name: connectionName});
        this.#connection.onMessage.addListener((message) => {
            this.#fktReceive(message);
        });
    }
    
    sendMessage(message) {
        if (message === undefined)
            return;
        if (this.#connection === undefined)
            return;
        this.#connection.postMessage(message);
    }
    
    disconnect() {
        this.#connection = undefined;
    }
}

export {SubscriberPort}