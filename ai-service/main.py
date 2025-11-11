# ai-service/main.py
import io
import os
import logging
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

LOGGER = logging.getLogger("uvicorn.error")

app = FastAPI(title="AI Verification Service")

# Allow Node backend origin (adjust in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change to your backend domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.environ.get("MODEL_PATH", "models/best.pt")
CONF_THRESHOLD = float(os.environ.get("CONF_THRESHOLD", "0.6"))  # default 0.6

# Load model once at startup
try:
    model = YOLO(MODEL_PATH)
    LOGGER.info(f"Loaded model from {MODEL_PATH}")
except Exception as e:
    LOGGER.exception("Failed to load model. Ensure MODEL_PATH is correct.")
    raise

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/verify")
async def verify_image(file: UploadFile = File(...)):
    """Accept image upload, run YOLO inference, return verification JSON."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image")

    # Run inference (returns a Results object)
    results = model(img)  # ultralytics supports PIL image input
    # Use first result (single image)
    res = results[0]

    # Extract detections
    boxes = res.boxes  # Boxes object
    confs = boxes.conf.tolist() if boxes.conf is not None else []
    cls_idxs = boxes.cls.tolist() if boxes.cls is not None else []
    names = res.names  # dict idx->label

    # If any detection passes threshold -> verified
    verified = False
    top_label = None
    top_conf = 0.0
    bbox = None

    for i, conf in enumerate(confs):
        if conf >= CONF_THRESHOLD:
            verified = True
            top_conf = float(conf)
            idx = int(cls_idxs[i])
            top_label = names.get(idx, str(idx))
            # boxes.xyxy gives Nx4 tensor (x1,y1,x2,y2) in pixels
            xyxy = boxes.xyxy[i].tolist()
            bbox = [float(v) for v in xyxy]
            break  # stop at first confident detection

    return JSONResponse({
        "verified": verified,
        "label": top_label,
        "confidence": round(top_conf, 4),
        "bbox": bbox
    })
