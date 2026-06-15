from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, oauth2, schemas
from app.database import get_db
from app.services import votes_service


router = APIRouter(prefix="/votes", tags=["Votes"])


@router.post("/submit", response_model=schemas.VoteSubmitOut)
def submit_votes(
    data: schemas.VoteSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    return votes_service.submit_votes(db, current_user, data)


@router.get("/admin/live-results/{election_id}")
def admin_live_results(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return votes_service.admin_live_results(db, election_id)


@router.get("/results/{election_id}")
def public_results(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    return votes_service.public_results(db, election_id)
