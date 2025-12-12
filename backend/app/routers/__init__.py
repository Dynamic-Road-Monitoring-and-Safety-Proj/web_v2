# Routers module
from . import upload, process, dashboard, air_quality
from . import tiles, events, uploads_s3

__all__ = [
    "upload",
    "process", 
    "dashboard",
    "air_quality",
    "tiles",
    "events",
    "uploads_s3"
]
