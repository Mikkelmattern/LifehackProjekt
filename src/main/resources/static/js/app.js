document.addEventListener("DOMContentLoaded", () => {
    console.log("app.js loaded");

    const previewCanvas = document.getElementById("previewCanvas");

    const eraserTool = document.querySelector(".bi-eraser");
    const pencilTool = document.querySelector(".bi-pencil-fill");
    const palette = document.querySelector(".bi-palette-fill");
    const paintBucket = document.querySelector(".bi-paint-bucket")
    const toggleGrid = document.querySelector(".bi-grid-3x2-gap-fill");
    const toggleLabels = document.querySelector(".bi-fonts");
    const clearButton = document.querySelector(".bi-trash");
    const downloadButton = document.querySelector(".bi-download");
    let volumeButton = document.querySelector(".bi-volume-up-fill");
    const partTile = document.querySelectorAll(".head")


    const colorPicker = document.createElement("input")
    colorPicker.type = "color"
    colorPicker.style.display = "none"
    document.body.appendChild(colorPicker);

    let toolSelect = "pencil";

    /*
    if (!toolSelect || !toggleGrid || !toggleLabels || !clearButton || !downloadButton || !previewCanvas) {
        console.error("ERROR: Could not find all elements in HTML...");
        return;
    }
     */

    const previewCtx = previewCanvas.getContext("2d");

    const skinCanvas = document.createElement("canvas");
    skinCanvas.width = 64;
    skinCanvas.height = 64;
    const skinCtx = skinCanvas.getContext("2d", {willReadFrequently: true});

    const PIXEL_SIZE = 24;
    const SCALE = 6;
    const PREVIEW_SCALE = 15;

    previewCanvas.width = 16 * PREVIEW_SCALE;
    previewCanvas.height = 32 * PREVIEW_SCALE;

    const currentState = {
        color: "#000000",
        tool: toolSelect,
    };

    const HEAD_PARTS = {
        headTop: {
            x: 8,
            y: 0,
            w: 8,
            h: 8,
            canvasId: "headTopCanvas"
        },
        headBottom: {
            x: 16,
            y: 0,
            w: 8,
            h: 8,
            canvasId: "headBottomCanvas"
        },
        headLeft: {
            x: 0,
            y: 8,
            w: 8,
            h: 8,
            canvasId: "headLeftCanvas"
        },
        headRight: {
            x: 16,
            y: 8,
            w: 8,
            h: 8,
            canvasId: "headRightCanvas"
        },
        headFront: {
            x: 8,
            y: 8,
            w: 8,
            h: 8,
            canvasId: "headFrontCanvas"
        },
        headBack: {
            x: 24,
            y: 8,
            w: 8,
            h: 8,
            canvasId: "headBackCanvas"
        }
    };

    const TORSO_PARTS = {
        torsoTop: {
            x: 20,
            y: 16,
            w: 8,
            h: 4,
            canvasId: "torsoTopCanvas"
        },
        torsoBottom: {
            x: 28,
            y: 16,
            w: 8,
            h: 4,
            canvasId: "torsoBottomCanvas"
        },
        torsoLeft: {
            x: 28,
            y: 20,
            w: 4,
            h: 12,
            canvasId: "torsoLeftCanvas"
        },
        torsoRight: {
            x: 16,
            y: 20,
            w: 4,
            h: 12,
            canvasId: "torsoRightCanvas"
        },
        torsoFront: {
            x: 20,
            y: 20,
            w: 8,
            h: 12,
            canvasId: "torsoFrontCanvas"
        },
        torsoBack: {
            x: 32,
            y: 20,
            w: 8,
            h: 12,
            canvasId: "torsoBackCanvas"
        }
    };

    const ARM_PARTS = {
        armTop: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "armTopCanvas"
        },
        armBottom: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "armBottomCanvas"
        },
        armLeft: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "armLeftCanvas"
        },
        armRight: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "armRightCanvas"
        },
        armFront: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "armFrontCanvas"
        },
        armBack: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "armBackCanvas"
        }
    };

    const LEG_PARTS = {
        legTop: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "legTopCanvas"
        },
        legBottom: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "legBottomCanvas"
        },
        legLeft: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "legLeftCanvas"
        },
        legRight: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "legRightCanvas"
        },
        legFront: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "legFrontCanvas"
        },
        legBack: {
            x: 0,
            y: 0,
            w: 0,
            h: 0,
            canvasId: "legBackCanvas"
        }
    };

    const editors = [];

    function drawGrid(ctx, widthInPixels, heightInPixels, pixelSize) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 1;

        for (let x = 0; x <= widthInPixels; x++) {
            const xPos = x * pixelSize;
            ctx.beginPath();
            ctx.moveTo(xPos, 0);
            ctx.lineTo(xPos, heightInPixels * pixelSize);
            ctx.stroke();
        }

        for (let y = 0; y <= heightInPixels; y++) {
            const yPos = y * pixelSize;
            ctx.beginPath();
            ctx.moveTo(0, yPos);
            ctx.lineTo(widthInPixels * pixelSize, yPos);
            ctx.stroke();
        }
    }

    function copyFlippedRegion(sourceX, sourceY, width, height, targetX, targetY) {
        const sourceImage = skinCtx.getImageData(sourceX, sourceY, width, height);
        const flippedImage = skinCtx.createImageData(width, height);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIndex = (y * width + x) * 4;
                const dstX = width - 1 - x;
                const dstIndex = (y * width + dstX) * 4;

                flippedImage.data[dstIndex] = sourceImage.data[srcIndex];
                flippedImage.data[dstIndex + 1] = sourceImage.data[srcIndex + 1];
                flippedImage.data[dstIndex + 2] = sourceImage.data[srcIndex + 2];
                flippedImage.data[dstIndex + 3] = sourceImage.data[srcIndex + 3];
            }
        }

        skinCtx.putImageData(flippedImage, targetX, targetY);
    }

    /**
     * This function mirrors both arms and legs.<p>
     * **Right leg -> left leg:**
     * -- Top
     * -- Bottom
     * -- Right side -> left side
     * -- Front
     * -- Left side -> right side
     * -- Back -> back
     * **Right arm -> left arm:**<p>
     * -- Top
     * -- Bottom
     * -- Right side -> left side
     * -- Front
     * -- Left side -> right side
     * -- Back -> back
     *
     */
    function syncMirroredLimbs() {

        copyFlippedRegion(4, 16, 4, 4, 20, 48);

        copyFlippedRegion(8, 16, 4, 4, 24, 48);

        copyFlippedRegion(0, 20, 4, 12, 24, 52);

        copyFlippedRegion(4, 20, 4, 12, 20, 52);

        copyFlippedRegion(8, 20, 4, 12, 16, 52);

        copyFlippedRegion(12, 20, 4, 12, 28, 52);


        copyFlippedRegion(44, 16, 4, 4, 36, 48);

        copyFlippedRegion(48, 16, 4, 4, 40, 48);

        copyFlippedRegion(40, 20, 4, 12, 40, 52);

        copyFlippedRegion(44, 20, 4, 12, 36, 52);

        copyFlippedRegion(48, 20, 4, 12, 32, 52);

        copyFlippedRegion(52, 20, 4, 12, 44, 52);
    }

    function renderPreview() {
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
        previewCtx.imageSmoothingEnabled = false;

        // HEAD (front)
        previewCtx.drawImage(
            skinCanvas,
            8, 8, 8, 8,
            4 * PREVIEW_SCALE, 0,
            8 * PREVIEW_SCALE, 8 * PREVIEW_SCALE
        );

        // BODY (front)
        previewCtx.drawImage(
            skinCanvas,
            20, 20, 8, 12,
            4 * PREVIEW_SCALE, 8 * PREVIEW_SCALE,
            8 * PREVIEW_SCALE, 12 * PREVIEW_SCALE
        );

        // LEFT ARM
        previewCtx.drawImage(
            skinCanvas,
            44, 20, 4, 12,
            0, 8 * PREVIEW_SCALE,
            4 * PREVIEW_SCALE, 12 * PREVIEW_SCALE
        );

        // RIGHT ARM
        previewCtx.drawImage(
            skinCanvas,
            44, 20, 4, 12,
            12 * PREVIEW_SCALE, 8 * PREVIEW_SCALE,
            4 * PREVIEW_SCALE, 12 * PREVIEW_SCALE
        );

        // LEFT LEG
        previewCtx.drawImage(
            skinCanvas,
            4, 20, 4, 12,
            4 * PREVIEW_SCALE, 20 * PREVIEW_SCALE,
            4 * PREVIEW_SCALE, 12 * PREVIEW_SCALE
        );

        // RIGHT LEG
        previewCtx.drawImage(
            skinCanvas,
            4, 20, 4, 12,
            8 * PREVIEW_SCALE, 20 * PREVIEW_SCALE,
            4 * PREVIEW_SCALE, 12 * PREVIEW_SCALE
        );
    }

    function createPartEditor(part) {
        const canvas = document.getElementById(part.canvasId);

        if (!canvas) {
            console.error(`ERROR: Could not find canvas with id: ${part.canvasId}...`);
            return null;
        }

        const ctx = canvas.getContext("2d");
        canvas.width = part.w * PIXEL_SIZE;
        canvas.height = part.h * PIXEL_SIZE;

        let isDrawing = false;

        function render() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.imageSmoothingEnabled = false;

            ctx.drawImage(
                skinCanvas,
                part.x,
                part.y,
                part.w,
                part.h,
                0,
                0,
                canvas.width,
                canvas.height
            );

            if (currentState.showGrid) {
                drawGrid(ctx, part.w, part.h, PIXEL_SIZE);
            }
        }

        function getLocalPixel(event) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;

            const localX = Math.floor((mouseX * scaleX) / PIXEL_SIZE);
            const localY = Math.floor((mouseY * scaleY) / PIXEL_SIZE);

            if (localX < 0 || localX >= part.w || localY < 0 || localY >= part.h) {
                return null;
            }

            return {localX, localY};
        }

        function paint(event) {
            const pixel = getLocalPixel(event);
            if (!pixel) return;

            const skinX = part.x + pixel.localX;
            const skinY = part.y + pixel.localY;

            if (currentState.tool === "pencil") {
                skinCtx.clearRect(skinX, skinY, 1, 1);
                skinCtx.fillStyle = currentState.color;
                skinCtx.fillRect(skinX, skinY, 1, 1);
            } else if (currentState.tool === "eraser") {
                skinCtx.fillStyle = "#ffffff"
                skinCtx.fillRect(skinX, skinY, 1, 1);
            } else if (currentState.tool === "paintbucket") {
                const part = Object.values(HEAD_PARTS).find(p => p.canvasId === event.target.id)
                skinCtx.fillStyle = currentState.color;
                skinCtx.fillRect(part.x, part.y, part.w, part.h);
            }

            syncMirroredLimbs();
            renderAllEditors();
        }

        canvas.addEventListener("mousedown", (event) => {
            if (event.button !== 0) return;
            isDrawing = true;
            paint(event);
        });

        canvas.addEventListener("mousemove", (event) => {
            if (!isDrawing) return;
            paint(event);
        });

        window.addEventListener("mouseup", () => {
            isDrawing = false;
        });

        return {render};
    }

    function renderAllEditors() {
        editors.forEach(editor => editor.render());
        renderPreview();
    }

    function setupHeadEditors() {
        Object.values(HEAD_PARTS).forEach(part => {
            const editor = createPartEditor(part);
            if (editor) {
                editors.push(editor);
            }
        });

        renderAllEditors();
    }

    /*
        function setupTorsoEditors() {
            Object.values(TORSO_PARTS).forEach(part => {
                const editor = createPartEditor(part);
                if (editor) {
                    editors.push(editor);
                }
            });

            renderAllEditors();
        }

        function setupArmEditors() {
            Object.values(ARM_PARTS).forEach(part => {
                const editor = createPartEditor(part);
                if (editor) {
                    editors.push(editor);
                }
            });

            renderAllEditors();
        }

        function setupLegEditors() {
            Object.values(LEG_PARTS).forEach(part => {
                const editor = createPartEditor(part);
                if (editor) {
                    editors.push(editor);
                }
            });

            renderAllEditors();
        }*/

    function renderToolCursor(){
      const tool = currentState.tool
        partTile.forEach(el => {
            el.style.cursor = `url('/images/${tool}.png') 0 32, crosshair`;
        })
    }

    eraserTool.addEventListener("click", (e) => {
        currentState.tool = "eraser";
        if (pencilTool.classList.contains("bi-pencil-fill")) {
            pencilTool.classList.remove("bi-pencil-fill")
            pencilTool.classList.add("bi-pencil")
        }
        e.target.classList.remove("bi-eraser")
        e.target.classList.add("bi-eraser-fill")
        renderToolCursor()
    });

    pencilTool.addEventListener("click", (e) => {
        currentState.tool = "pencil";
        if (eraserTool.classList.contains("bi-eraser-fill")) {
            eraserTool.classList.remove("bi-eraser-fill")
            eraserTool.classList.add("bi-eraser")
        }
        e.target.classList.remove("bi-pencil")
        e.target.classList.add("bi-pencil-fill")
        renderToolCursor()

    })

    colorPicker.addEventListener("change", (e) => {
        currentState.color = e.target.value;
    })

    palette.addEventListener("click", (event) => {
        colorPicker.click();
    })

    volumeButton.addEventListener("click", (e) => {
        if (e.target.classList.contains("bi-volume-up-fill")) {
            e.target.classList.remove("bi-volume-up-fill");
            e.target.classList.add("bi-volume-mute-fill")
            music.muted = true;
        } else if (e.target.classList.contains("bi-volume-mute-fill")) {
            e.target.classList.add("bi-volume-up-fill");
            e.target.classList.remove("bi-volume-mute-fill")
            music.muted = false;
        }
    })


    toggleGrid.addEventListener("change", () => {
        currentState.showGrid = toggleGrid.checked;
        renderAllEditors();
    });
    let on = true;
    toggleLabels.addEventListener("click", () => {
        if (on) {
            on = !on;
            document.querySelectorAll(".part-label").forEach(label => {
                label.style.display = "none";
            });
        } else if (!on){
            on = !on;
            document.querySelectorAll(".part-label").forEach(label => {
                label.style.display = "flex";
            });
        }
    });

    clearButton.addEventListener("click", () => {
        const confirmed = confirm("Do you want to clear the template?");
        if (!confirmed) return;

        Object.values(HEAD_PARTS).forEach(part => {
            skinCtx.fillStyle = "#ffffff"
            skinCtx.fillRect(part.x, part.y, part.w, part.h);
        });

        renderAllEditors();
    });


    paintBucket.addEventListener("click", (e) => {
        currentState.tool = "paintbucket"
        renderToolCursor()
    })


    downloadButton.addEventListener("click", () => {
        syncMirroredLimbs();

        const link = document.createElement("a");
        link.download = "minecraft-head-skin.png";
        link.href = skinCanvas.toDataURL("image/png");
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
        }, 100);
    });

    setupHeadEditors();
    /*
    setupTorsoEditors();
    setupArmEditors();
    setupLegEditors();
     */

    const defaultSkin = new Image();
    defaultSkin.src = "/images/default-skin.png";

    defaultSkin.onload = () => {
        skinCtx.clearRect(0, 0, skinCanvas.width, skinCanvas.height);
        skinCtx.drawImage(defaultSkin, 0, 0, 64, 64);
        syncMirroredLimbs();
        renderAllEditors();
    };

    defaultSkin.onerror = () => {
        console.error("ERROR: Could not load default skin...");
    };
});