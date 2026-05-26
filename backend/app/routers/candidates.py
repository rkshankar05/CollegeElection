from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, oauth2, schemas
from app.database import get_db
from app.services import candidates_service


router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("/my-applications")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(oauth2.get_current_user),
):
    return candidates_service.get_my_applications(db, current_user)


@router.post("/apply")
def apply_for_candidate(
    data: schemas.CandidateApply,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    return candidates_service.apply_for_candidate(db, current_user, data)


@router.get("/admin/all")
def get_all_candidate_applications(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return candidates_service.get_all_candidate_applications_for_election(db, election_id)


@router.patch("/admin/{candidate_post_id}/review")
def review_candidate(
    candidate_post_id: int,
    data: schemas.CandidateReview,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return candidates_service.review_candidate(db, candidate_post_id, data)


@router.get("/election/{election_id}/public")
def get_public_candidates(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user),
):
    return candidates_service.get_public_candidates(db, election_id)
