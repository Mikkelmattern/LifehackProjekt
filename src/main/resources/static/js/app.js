const editorCanvas = document.getElementById("editorCanvas");
const editorCtx = editorCanvas.getContext("2d");

const colorInput = document.getElementById("colorInput");
const toolSelect = document.getElementById("toolSelect");
const toggleGrid = document.getElementById("toggleGrid");
const clearButton = document.getElementById("clearButton");
const app = document.querySelectorAll(".app")

const SKIN_WIDTH = 16;
const SKIN_HEIGHT = 16;

const PIXEL_SIZE = 24;

editorCanvas.width = SKIN_WIDTH * PIXEL_SIZE;
editorCanvas.height = SKIN_HEIGHT * PIXEL_SIZE;

const skinCanvas = document.createElement("canvas");
//Højden og breden på canvas
skinCanvas.width = SKIN_WIDTH;
skinCanvas.height = SKIN_HEIGHT;
const skinCtx = skinCanvas.getContext("2d", { willReadFrequently: true });

skinCtx.clearRect(0, 0, SKIN_WIDTH, SKIN_HEIGHT);

let isDrawing = false;
let currentTool = "pencil";

app.forEach(task => { task.addEventListener("click", event => {console.log(event.target)})})

toolSelect.addEventListener("change", () => {
    currentTool = toolSelect.value;
});

clearButton.addEventListener("click", () => {
    const confirmed = confirm("Vil du rydde tegnebrættet?");
    if (!confirmed) return;

    skinCtx.clearRect(0, 0, SKIN_WIDTH, SKIN_HEIGHT);
    renderEditor();
});

editorCanvas.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return;

    isDrawing = true;
    paintFromEvent(event);
});

window.addEventListener("mouseup", () => {
    isDrawing = false;
});

editorCanvas.addEventListener("mousemove", (event) => {
    if (!isDrawing) return;
    paintFromEvent(event);
});

function paintFromEvent(event) {
    const pixel = getPixelFromMouseEvent(event);
    if (!pixel) return;

    if (currentTool === "pencil") {
        paintPixel(pixel.x, pixel.y, colorInput.value);
    } else if (currentTool === "eraser") {
        erasePixel(pixel.x, pixel.y);
    }

    renderEditor();
}

function getPixelFromMouseEvent(event) {
    const rect = editorCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const x = Math.floor(mouseX / PIXEL_SIZE);
    const y = Math.floor(mouseY / PIXEL_SIZE);

    if (x < 0 || x >= SKIN_WIDTH || y < 0 || y >= SKIN_HEIGHT) {
        return null;
    }

    return { x, y };
}

function paintPixel(x, y, color) {
    skinCtx.clearRect(x, y, 1, 1);
    skinCtx.fillStyle = color;
    skinCtx.fillRect(x, y, 1, 1);
}

function erasePixel(x, y) {
    skinCtx.clearRect(x, y, 1, 1);
}

function renderEditor() {
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    editorCtx.imageSmoothingEnabled = false;

    editorCtx.drawImage(
        skinCanvas,
        0,
        0,
        SKIN_WIDTH,
        SKIN_HEIGHT,
        0,
        0,
        editorCanvas.width,
        editorCanvas.height
    );

    if (toggleGrid.checked) {
        drawGrid();
    }
}

function drawGrid() {
    editorCtx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    editorCtx.lineWidth = 1;

    for (let x = 0; x <= SKIN_WIDTH; x++) {
        const xPos = x * PIXEL_SIZE;
        editorCtx.beginPath();
        editorCtx.moveTo(xPos, 0);
        editorCtx.lineTo(xPos, editorCanvas.height);
        editorCtx.stroke();
    }

    for (let y = 0; y <= SKIN_HEIGHT; y++) {
        const yPos = y * PIXEL_SIZE;
        editorCtx.beginPath();
        editorCtx.moveTo(0, yPos);
        editorCtx.lineTo(editorCanvas.width, yPos);
        editorCtx.stroke();
    }
}

toggleGrid.addEventListener("change", renderEditor);

renderEditor();