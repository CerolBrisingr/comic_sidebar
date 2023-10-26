// This connection is accessed from different points
// Keep the request structure somewhat central and make 
// usage easier to track

class TrackingState {
    #port;
    constructor(port) {
        this.#port = port;
    }

    requestCurrentState() {
        this.#port.sendMessage("requestActiveState");
    }
    
    requestToggleState() {
        this.#port.sendMessage("requestActiveStateChange");
    }

}

export {TrackingState}