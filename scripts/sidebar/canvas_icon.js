class CanvasIcon {
    #canvas;
    #context;

    constructor(canvas, source) {
        if (typeof canvas === "string")
            canvas = document.getElementById(canvas);
        this.#canvas = canvas;
        this.#context = this.#canvas.getContext("2d");

        if (source !== undefined)
            this.setImage(source);
    }

    async setImage(source) {
        let image = new Image();
        image.src = source;
        await image.decode();

        const width = this.#canvas.width;
        const height = this.#canvas.height;
        this.#context.drawImage(image, 0, 0, width, height);
    }
}

export {CanvasIcon}