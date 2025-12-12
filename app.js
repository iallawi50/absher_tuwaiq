/* ============================================================
   1) تحميل Mediapipe FaceMesh
============================================================ */

const faceMesh = new FaceMesh({
    locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
});

faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6,
});

let originalFace = null;
let _callback = null;

/* ============================================================
   2) استقبال نتائج الذكاء الاصطناعي
============================================================ */

faceMesh.onResults((results) => {
    if (
        !results.multiFaceLandmarks ||
        results.multiFaceLandmarks.length === 0
    ) {
        if (_callback) _callback(null);
        return;
    }

    const face = results.multiFaceLandmarks[0];
    if (_callback) _callback(face);
});

/* ============================================================
   3) تحليل صورة ثابتة (صورة الكارد)
============================================================ */

function analyzeImage(src, callback) {
    _callback = callback;

    const img = new Image();
    img.src = src;

    img.onload = async () => {
        await faceMesh.send({ image: img });
    };
}

/* ============================================================
   4) تحليل Canvas (من الكاميرا أو ملف)
============================================================ */

function analyzeCanvas(canvas, callback) {
    _callback = callback;
    faceMesh.send({ image: canvas });
}

/* ============================================================
   5) مقارنة الملامح
============================================================ */

function compareFaces(liveLandmarks) {
    const result = document.getElementById("result");

    if (!result) return;

    if (!originalFace) {
        result.textContent = "❌ فشل استخراج الوجه من الصورة الأصلية";
        result.style.color = "red";
        return;
    }

    if (!liveLandmarks) {
        result.textContent = "❌ لم يتم العثور على وجه في الصورة الجديدة";
        result.style.color = "red";
        return;
    }

    let diff = 0;

    for (let i = 0; i < originalFace.length; i++) {
        diff += Math.abs(originalFace[i].x - liveLandmarks[i].x);
        diff += Math.abs(originalFace[i].y - liveLandmarks[i].y);
        diff += Math.abs(originalFace[i].z - liveLandmarks[i].z);
    }

    const score = diff / originalFace.length;

    if (score < 0.0035) {
        result.textContent = "✔ متطابق";
        result.style.color = "green";
    } else {
        result.textContent = "✖ غير متطابق";
        result.style.color = "red";
    }
}

/* ============================================================
   6) تفعيل زر ai-btn (إصلاح المشكلة)
============================================================ */

document.addEventListener("click", (e) => {
    let btn = e.target;

    if (btn.classList.contains("ai-btn") || btn.closest(".ai-btn")) {
        openAIModal();
    }
});

/* ============================================================
   7) فتح وإغلاق المودال
============================================================ */

function openAIModal() {
    const modal = document.getElementById("ai-modal");
    const result = document.getElementById("result");

    if (!modal) return;

    modal.style.display = "flex";

    if (result) result.textContent = "";

    extractOriginalFace();
}

function closeAIModal() {
    const modal = document.getElementById("ai-modal");
    if (modal) modal.style.display = "none";
}

/* ============================================================
   8) استخراج الوجه من الصورة الأصلية
============================================================ */

function extractOriginalFace() {
    const img = document.querySelector(".image-card img");
    if (!img) return;

    analyzeImage(img.src, (landmarks) => {
        originalFace = landmarks;
    });
}

/* ============================================================
   9) تشغيل الكاميرا
============================================================ */

function openCamera() {
    const video = document.getElementById("camera");
    const captureBtn = document.getElementById("capture-btn");

    if (!video || !captureBtn) return;

    video.style.display = "block";
    captureBtn.style.display = "block";

    navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((err) => {
            console.error("Camera error:", err);
        });
}

/* ============================================================
   10) التقاط صورة من الكاميرا
============================================================ */

function capturePhoto() {
    const video = document.getElementById("camera");
    const canvas = document.getElementById("canvas");

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    analyzeCanvas(canvas, compareFaces);
}

/* ============================================================
   11) رفع صورة من الجهاز
============================================================ */

const uploadInput = document.getElementById("upload-image");

if (uploadInput) {
    uploadInput.addEventListener("change", function () {
        const file = this.files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = document.getElementById("canvas");
            if (!canvas) return;

            canvas.width = img.width;
            canvas.height = img.height;

            canvas.getContext("2d").drawImage(img, 0, 0);

            analyzeCanvas(canvas, compareFaces);
        };
    });
}
