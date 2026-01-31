const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");    // A paintbrush for the canvas
const countdownEl = document.getElementById("countdown");

// Turn on camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => {
        alert("Camera access denied 😢");
    });

function startSession(photoCount) {
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
            clearInterval(timer);

        const col = currentPhoto % cols;
        const row = Math.floor(currentPhoto / cols);

        // Mirror photo draw
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
            video,
          -((col + 1) * photoWidth),
          row * photoHeight,
            photoWidth,
            photoHeight
        );
        ctx.restore();

        currentPhoto++;
        takeNextPhoto();
        }
    }, 1000);
    }
}