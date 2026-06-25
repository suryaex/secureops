"""In-app update endpoints (controller only).

GET  /api/update/check   — any authenticated user may check.
GET  /api/update/status  — progress reported by scripts/self-update.sh.
POST /api/update/apply   — admin only; triggers pull + rebuild + restart.
"""
from fastapi import APIRouter, Depends

from auth import get_current_user, require_admin
import updater

router = APIRouter()


@router.get("/check")
def update_check(current=Depends(get_current_user)):
    return updater.check()


@router.get("/status")
def update_status(current=Depends(get_current_user)):
    return updater.status()


@router.post("/apply")
def update_apply(current=Depends(require_admin)):
    return updater.apply()
