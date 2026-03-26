document.addEventListener("DOMContentLoaded", () => {
    console.log("app.js loaded");

    const colorInput = document.getElementById("colorInput");
    const toggleGrid = document.getElementById("toggleGrid");
    const toggleLabels = document.getElementById("toggleLabels");
    const clearButton = document.getElementById("clearButton");
    const downloadButton = document.getElementById("downloadButton");
    const previewCanvas = document.getElementById("previewCanvas");

    const eraserTool = document.querySelector(".bi-eraser-fill");
    const pencilTool = document.querySelector(".bi-pencil-fill");

    let toolSelect = "pencil";

    if (!colorInput || !toolSelect || !toggleGrid || !toggleLabels || !clearButton || !downloadButton || !previewCanvas) {
        console.error("ERROR: Could not find all elements in HTML...");
        return;
    }

    const previewCtx = previewCanvas.getContext("2d");

    const skinCanvas = document.createElement("canvas");
    skinCanvas.width = 64;
    skinCanvas.height = 64;
    const skinCtx = skinCanvas.getContext("2d", { willReadFrequently: true });

    const PIXEL_SIZE = 24;
    const SCALE = 6;
    const PREVIEW_SCALE = 15;

    previewCanvas.width = 16 * PREVIEW_SCALE;
    previewCanvas.height = 32 * PREVIEW_SCALE;

    const currentState = {
        color: colorInput.value,
        tool: toolSelect,
        showGrid: toggleGrid.checked
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
            console.error("ERROR: Could not find canvas with id: ${part.canvasId}...");
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

            const localX = Math.floor(mouseX / PIXEL_SIZE);
            const localY = Math.floor(mouseY / PIXEL_SIZE);

            if (localX < 0 || localX >= part.w || localY < 0 || localY >= part.h) {
                return null;
            }

            return { localX, localY };
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
                skinCtx.clearRect(skinX, skinY, 1, 1);
            }

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

        return { render };
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
    }

    colorInput.addEventListener("input", () => {
        currentState.color = colorInput.value;
    });

    eraserTool.addEventListener("click", () => {
        currentState.tool = "eraser";
    });

    pencilTool.addEventListener("click", () => {
        currentState.tool = "pencil";
    })

    toggleGrid.addEventListener("change", () => {
        currentState.showGrid = toggleGrid.checked;
        renderAllEditors();
    });

    toggleLabels.addEventListener("change", () => {
        document.querySelectorAll(".part-label").forEach(label => {
            label.style.display = toggleLabels.checked ? "flex" : "none";
        });
    });

    clearButton.addEventListener("click", () => {
        const confirmed = confirm("Do you want to clear the template?");
        if (!confirmed) return;

        Object.values(HEAD_PARTS).forEach(part => {
            skinCtx.clearRect(part.x, part.y, part.w, part.h);
        });

        renderAllEditors();
    });

    downloadButton.addEventListener("click", () => {
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
    setupTorsoEditors();
    setupArmEditors();
    setupLegEditors();

    const defaultSkin = new Image();
    defaultSkin.src = "/images/default-skin.png";

    defaultSkin.onload = () => {
        skinCtx.clearRect(0, 0, skinCanvas.width, skinCanvas.height);
        skinCtx.drawImage(defaultSkin, 0, 0, 64, 64);
        renderAllEditors();
    };

    defaultSkin.onerror = () => {
        console.error("ERROR: Could not load default skin...");
    };
});