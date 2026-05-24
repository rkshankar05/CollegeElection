from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, oauth2
from app.database import get_db


router = APIRouter(
    prefix="/elections",
    tags=["Elections"]
)


@router.get("/", response_model=list[schemas.ElectionOut])
def get_all_elections(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    elections = db.query(models.Election).order_by(
        models.Election.year.desc()
    ).all()

    return elections


@router.get("/{election_id}", response_model=schemas.ElectionOut)
def get_single_election(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    election = db.query(models.Election).filter(
        models.Election.id == election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    return election


@router.get("/{election_id}/posts", response_model=list[schemas.PostOut])
def get_election_posts(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    election = db.query(models.Election).filter(
        models.Election.id == election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    posts = db.query(models.Post).filter(
        models.Post.election_id == election_id
    ).order_by(models.Post.display_order.asc()).all()

    return posts


@router.get("/{election_id}/published-candidates")
def get_published_candidates_by_post(
    election_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    election = db.query(models.Election).filter(
        models.Election.id == election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    if not election.candidates_visible:
        raise HTTPException(
            status_code=403,
            detail="Candidate list is not published yet"
        )

    posts = db.query(models.Post).filter(
        models.Post.election_id == election_id
    ).order_by(models.Post.display_order.asc()).all()

    response = []

    for post in posts:
        candidate_posts = (
            db.query(models.CandidatePost)
            .join(models.Candidate)
            .join(models.User, models.User.id == models.Candidate.user_id)
            .filter(
                models.CandidatePost.post_id == post.id,
                models.Candidate.election_id == election_id,
                models.Candidate.status == "approved"
            )
            .order_by(models.Candidate.applied_at.asc())
            .limit(5)
            .all()
        )

        candidates = []

        for cp in candidate_posts:
            candidates.append({
                "candidate_id": cp.candidate.id,
                "name": cp.candidate.user.name,
                "applied_at": cp.candidate.applied_at
            })

        response.append({
            "post_id": post.id,
            "post_name": post.name,
            "candidates": candidates
        })

    return response