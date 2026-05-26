from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas, oauth2
from app.database import get_db
from app.services import elections_service


router = APIRouter(
    prefix="/elections",
    tags=["Elections"]
)


@router.get("/", response_model=list[schemas.ElectionOut])
def get_all_elections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return elections_service.get_all_elections(db)


@router.get("/{election_id}", response_model=schemas.ElectionOut)
def get_single_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return elections_service.get_single_election(db, election_id)


@router.get("/{election_id}/posts", response_model=list[schemas.PostOut])
def get_election_posts(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return elections_service.get_election_posts(db, election_id)


@router.get("/{election_id}/published-candidates")
def get_published_candidates(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return elections_service.get_published_candidates(db, election_id)
