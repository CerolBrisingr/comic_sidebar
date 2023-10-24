class CanvasIcon {
    #canvas;
    #context;
    #width;
    #height;

    constructor(canvas, source) {
        if (typeof canvas === "string")
            canvas = document.getElementById(canvas);
        this.#canvas = canvas;
        this.#width = this.#canvas.width;
        this.#height = this.#canvas.height;
        this.#context = this.#canvas.getContext("2d");

        if (source !== undefined)
            this.setImage(source);
    }

    async setImage(source) {
        let image = new Image();
        image.src = source;
        await image.decode();

        this.#context.drawImage(image, 0, 0, this.#width, this.#height);
    }
}

export {CanvasIcon}