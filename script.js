const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");    // A paintbrush for the canvas
const countdownEl = document.getElementById("countdown");
const downloadBtn = document.getElementById("download");

let photos = [];
let stickersOnCanvas = [];

// Turn on camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => {
        alert("Camera access denied 😢");
    });

// Start taking photo
function startSession(photoCount) {
    photos = [];
    stickersOnCanvas = [];
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
            countdownEl.textContent = "✨ Done!";
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
})

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
            x: x-draggedStickerSize / 2,
            y: y-30,
            size: draggedStickerSize
        });

        redrawCanvas();
    };
})

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
    })

    stickersOnCanvas.forEach(sticker => {
        ctx.drawImage(
            sticker.img,
            sticker.x,
            sticker.y,
            sticker.size,
            sticker.size
        )
    })
}

// Download the image when button is clicked
downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "photobooth.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

