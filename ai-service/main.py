# ai-service/main.py
import io
import os
import logging
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from PIL import Image
from ultralytics import YOLO

LOGGER = logging.getLogger("uvicorn.error")

app = FastAPI(title="AI Verification Service", version="1.0.0")
security = HTTPBearer(auto_error=False)

# Allow backend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:1200",
        "http://192.168.10.155:1200",
        "https://*.vercel.app",
        "https://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MODEL_PATH = os.environ.get("MODEL_PATH", "models/best.pt")
CONF_THRESHOLD = float(os.environ.get("CONF_THRESHOLD", "0.6"))
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")

# Authentication dependency
async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not INTERNAL_API_KEY:
        # If no API key is set, allow requests (for development)
        return True
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if credentials.credentials != INTERNAL_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    return True

# Load model with fallback to pre-trained
try:
    if os.path.exists(MODEL_PATH):
        LOGGER.info(f"Loading custom model from {MODEL_PATH}")
        model = YOLO(MODEL_PATH)
        LOGGER.info(f"Custom model loaded from {MODEL_PATH}")
    elif os.path.exists("models/best.pt"):
        LOGGER.info("Loading best.pt model from models directory...")
        model = YOLO('models/best.pt')
        LOGGER.info("best.pt model loaded successfully!")
    else:
        LOGGER.info("Loading pre-trained YOLOv8n model (will download ~6MB on first run)...")
        model = YOLO('yolov8n.pt')  # Auto-downloads pre-trained model
        LOGGER.info("Pre-trained YOLOv8n model loaded successfully!")
except Exception as e:
    LOGGER.exception("Failed to load model")
    # Create a mock model for testing
    model = None
    LOGGER.warning("Using mock responses - no model available")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests for debugging."""
    LOGGER.info(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    LOGGER.info(f"Response status: {response.status_code}")
    return response

@app.get("/health")
async def health():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "ai-verification",
        "version": "1.0.0",
        "model_loaded": model is not None
    }

@app.get("/health/detailed")
async def health_detailed():
    """Detailed health check with model information."""
    import psutil
    import torch
    
    return {
        "status": "healthy",
        "service": "ai-verification",
        "version": "1.0.0",
        "model": {
            "path": MODEL_PATH,
            "loaded": model is not None,
            "confidence_threshold": CONF_THRESHOLD
        },
        "system": {
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0
        }
    }

@app.get("/ready")
async def ready():
    """Readiness probe - check if service can handle requests."""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "status": "ready",
        "model_loaded": True
    }

@app.get("/live")
async def live():
    """Liveness probe - basic service availability."""
    return {
        "status": "alive",
        "pid": os.getpid()
    }

@app.post("/verify")
async def verify_image(file: UploadFile = File(...), authenticated: bool = Depends(verify_api_key)):
    """Accept image upload, run YOLO inference, return verification JSON."""
    LOGGER.info(f"🟡 [AI-SERVICE] Verify endpoint hit")
    LOGGER.info(f"🟡 [AI-SERVICE] File received: {file.filename if file else 'None'}")
    LOGGER.info(f"🟡 [AI-SERVICE] Content type: {file.content_type if file else 'None'}")
    
    if not file.content_type.startswith("image/"):
        LOGGER.error(f"❌ [AI-SERVICE] Invalid content type: {file.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content)).convert("RGB")
        LOGGER.info(f"🟡 [AI-SERVICE] Processing image: {file.filename}, size: {img.size}")
    except Exception as e:
        LOGGER.error(f"❌ [AI-SERVICE] Invalid image processing: {e}")
        raise HTTPException(status_code=400, detail="Invalid image")

    # Handle case where no model is available
    if model is None:
        LOGGER.warning("⚠️ [AI-SERVICE] No model available - returning mock response")
        return JSONResponse({
            "verified": True,
            "label": "mock_pothole",
            "confidence": 0.85,
            "bbox": [50, 50, 200, 200],
            "detections_count": 1,
            "threshold_used": CONF_THRESHOLD,
            "note": "Mock response - model not loaded"
        })

    try:
        LOGGER.info("🔄 [AI-SERVICE] Running model inference...")
        # Run inference (returns a Results object)
        results = model(img)  # ultralytics supports PIL image input
        # Use first result (single image)
        res = results[0]

        # Extract detections
        boxes = res.boxes  # Boxes object
        confs = boxes.conf.tolist() if boxes.conf is not None else []
        cls_idxs = boxes.cls.tolist() if boxes.cls is not None else []
        names = res.names  # dict idx->label

        LOGGER.info(f"🔄 [AI-SERVICE] Model detected {len(confs)} objects")

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

        result = {
            "verified": verified,
            "label": top_label,
            "confidence": round(top_conf, 4),
            "bbox": bbox,
            "detections_count": len(confs),
            "threshold_used": CONF_THRESHOLD
        }
        
        LOGGER.info(f"✅ [AI-SERVICE] Verification result: {result}")
        return JSONResponse(result)
        
    except Exception as e:
        LOGGER.error(f"❌ [AI-SERVICE] Model inference error: {e}")
        raise HTTPException(status_code=500, detail="Model inference failed")
