const startScreen = document.getElementById("start-screen");
const instructionScreen = document.getElementById("instruction-screen");
const photoboothScreen = document.getElementById("photobooth-screen");

const btnStart = document.getElementById("btn-start");
const btnInstructions = document.getElementById("btn-instructions");
const btnBack = document.getElementById("btn-back");
const btnStartFromInstructions = document.getElementById("btn-start-from-instructions");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");    // A paintbrush for the canvas
const countdownEl = document.getElementById("countdown");
const downloadBtn = document.getElementById("download");
const addFrameBtn = document.getElementById("add-frame");

let photos = [];
let stickersOnCanvas = [];
let cameraStarted = false;
const BORDER_WIDTH = 20;
const BORDER_COLOR = "#B5B88C";
let frameEnabled = false;

function startCamera() {
    if (cameraStarted) return;
    cameraStarted = true;

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => video.srcObject = stream)
        .catch(() => {
            alert("Camera access denied.");
        });
}

function showScreen(target) {
    startScreen.classList.remove("active");
    instructionScreen.classList.remove("active");
    photoboothScreen.classList.remove("active");

    if (target === "start") startScreen.classList.add("active");
    if (target === "instruction") instructionScreen.classList.add("active");
    if (target === "photobooth") {
        photoboothScreen.classList.add("active");
        startCamera();
    }
}

btnStart.addEventListener("click", () => showScreen("photobooth"));
btnInstructions.addEventListener("click", () => showScreen("instruction"));
btnBack.addEventListener("click", () => showScreen("start"));
btnStartFromInstructions.addEventListener("click", () => showScreen("photobooth"));

addFrameBtn.addEventListener("click", () => {
    frameEnabled = !frameEnabled;
    addFrameBtn.textContent = frameEnabled ? "Remove Frame" : "Add Frame";
    redrawCanvas();
});

// Start taking photo
function startSession(photoCount) {
    photos = [];
    stickersOnCanvas = [];
    frameEnabled = false;
    addFrameBtn.textContent = "Add Frame";
    /**
     * 2 photos: 1 column 2 rows
     * 4 photos: 2 columns 2 rows
     */
    const cols = photoCount === 4 ? 2 : 1; // If 4 photos then 2 columns, if not then 1 column
    const rows = photoCount === 4 ? 2 : 2;

    const photoWidth = 320;
    const photoHeight = 240;

    canvas.width = cols * photoWidth;
    canvas.height = rows * photoHeight;

    let currentPhoto = 0;

    takeNextPhoto();

    function takeNextPhoto() {
        if (currentPhoto >= photoCount) {
            countdownEl.textContent = "Done!";
            return;
        }

        let timeLeft = 5;
        countdownEl.textContent = timeLeft;

        const timer = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = timeLeft;

            if (timeLeft === 0) {
                let snap = new Audio("Sound/snap.mp3");
                snap.play();

                clearInterval(timer);

                const col = currentPhoto % cols;
                const row = Math.floor(currentPhoto / cols);

                // Capture a frozen, mirrored snapshot into an offscreen canvas
                const snapCanvas = document.createElement('canvas');
                snapCanvas.width = photoWidth;
                snapCanvas.height = photoHeight;
                const snapCtx = snapCanvas.getContext('2d');
                snapCtx.save();
                snapCtx.scale(-1, 1);
                snapCtx.drawImage(video, -photoWidth, 0, photoWidth, photoHeight);
                snapCtx.restore();

                // Draw the captured image onto the main canvas immediately
                ctx.drawImage(snapCanvas, col * photoWidth, row * photoHeight, photoWidth, photoHeight);

                // Store the frozen image for later redraws
                const img = new Image();
                img.src = snapCanvas.toDataURL('image/png');
                img.onload = () => {
                    // ensure canvas can be redrawn once image data is available
                };

                photos.push({
                    img: img,
                    x: col * photoWidth,
                    y: row * photoHeight,
                    width: photoWidth,
                    height: photoHeight
                });

                currentPhoto++;
                takeNextPhoto();
            }
        }, 1000);
    }
}

// Adding stickers
let draggedStickerSrc = null;
let draggedStickerSize = 0;

// Remember which sticker is being dragged
document.querySelectorAll(".sticker").forEach(sticker => {
    sticker.addEventListener("dragstart", e => {
        draggedStickerSrc = e.target.src;
        draggedStickerSize = e.target.clientWidth;
    });
});

// Allow dropping onto canvas
canvas.addEventListener("dragover", e => {
    e.preventDefault();
});

// Drop sticker onto canvas
canvas.addEventListener("drop", e => {
    e.preventDefault();

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const img = new Image();
    img.src = draggedStickerSrc;

    img.onload = () => {
        stickersOnCanvas.push({
            img,
            x: x - draggedStickerSize / 2,
            y: y - 30,
            size: draggedStickerSize
        });

        redrawCanvas();
    };
});

function redrawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    photos.forEach(photo => {
        // If the stored image isn't loaded yet, redraw after it loads
        if (!photo.img || !photo.img.complete) {
            if (photo.img) photo.img.onload = () => redrawCanvas();
            return;
        }

        ctx.drawImage(
            photo.img,
            photo.x,
            photo.y,
            photo.width,
            photo.height
        );
    });

    if (frameEnabled) {
        const borderWidth = BORDER_WIDTH;
        const borderColor = BORDER_COLOR;
        if (borderWidth > 0) {
            ctx.lineWidth = borderWidth;
            ctx.strokeStyle = borderColor;
            const inset = borderWidth / 2;
            ctx.strokeRect(inset, inset, canvas.width - borderWidth, canvas.height - borderWidth);
        }
    }

    stickersOnCanvas.forEach(sticker => {
        ctx.drawImage(
            sticker.img,
            sticker.x,
            sticker.y,
            sticker.size,
            sticker.size
        );
    });
}

// Download the image when button is clicked
downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "photobooth.png";
    const borderWidth = frameEnabled ? BORDER_WIDTH : 0;
    const borderColor = BORDER_COLOR;

    if (borderWidth > 0) {
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        const exportCtx = exportCanvas.getContext("2d");

        let allReady = true;
        photos.forEach(photo => {
            if (!photo.img || !photo.img.complete) {
                allReady = false;
                return;
            }
            exportCtx.drawImage(photo.img, photo.x, photo.y, photo.width, photo.height);
        });

        if (allReady) {
            // Draw border above photos but below stickers so stickers can overlap it.
            exportCtx.lineWidth = borderWidth;
            exportCtx.strokeStyle = borderColor;
            const inset = borderWidth / 2;
            exportCtx.strokeRect(inset, inset, canvas.width - borderWidth, canvas.height - borderWidth);

            stickersOnCanvas.forEach(sticker => {
                if (!sticker.img || !sticker.img.complete) {
                    allReady = false;
                    return;
                }
                exportCtx.drawImage(sticker.img, sticker.x, sticker.y, sticker.size, sticker.size);
            });
        }

        link.href = allReady ? exportCanvas.toDataURL("image/png") : canvas.toDataURL("image/png");
    } else {
        link.href = canvas.toDataURL("image/png");
    }
    link.click();
});
