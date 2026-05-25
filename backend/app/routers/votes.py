from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app import models, schemas, oauth2
from app.database import get_db


router = APIRouter(
    prefix="/votes",
    tags=["Votes"]
)


@router.post("/submit")
def submit_votes(
    data: schemas.VoteSubmit,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can vote"
        )

    election = db.query(models.Election).filter(
        models.Election.id == data.election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    now = datetime.utcnow()

    if now < election.voting_start:
        raise HTTPException(
            status_code=400,
            detail="Voting has not started"
        )

    if now > election.voting_end:
        raise HTTPException(
            status_code=400,
            detail="Voting has ended"
        )

    if not election.candidates_visible:
        raise HTTPException(
            status_code=403,
            detail="Candidate list is not published yet"
        )

    if len(data.votes) == 0:
        raise HTTPException(
            status_code=400,
            detail="No votes submitted"
        )

    post_ids = [vote.post_id for vote in data.votes]

    if len(post_ids) != len(set(post_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate post vote found"
        )

    # Validate every vote before inserting
    for vote_item in data.votes:
        post = db.query(models.Post).filter(
            models.Post.id == vote_item.post_id,
            models.Post.election_id == data.election_id
        ).first()

        if not post:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid post id {vote_item.post_id}"
            )

        candidate = db.query(models.Candidate).filter(
            models.Candidate.id == vote_item.candidate_id,
            models.Candidate.election_id == data.election_id
        ).first()

        if not candidate:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid candidate id {vote_item.candidate_id}"
            )

        status_filter = models.CandidatePost.status == "approved"

        if candidate.status == "approved":
            status_filter = or_(
                models.CandidatePost.status == "approved",
                models.CandidatePost.status.is_(None),
            )

        candidate_post = db.query(models.CandidatePost).filter(
            models.CandidatePost.candidate_id == vote_item.candidate_id,
            models.CandidatePost.post_id == vote_item.post_id,
            status_filter
        ).first()

        if not candidate_post:
            raise HTTPException(
                status_code=400,
                detail="Candidate is not approved for the selected post"
            )

    # Insert all votes together
    try:
        for vote_item in data.votes:
            new_vote = models.Vote(
                voter_id=current_user.id,
                election_id=data.election_id,
                post_id=vote_item.post_id,
                candidate_id=vote_item.candidate_id
            )

            db.add(new_vote)

        db.commit()

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="You have already voted for one or more selected posts"
        )

    return {
        "message": "Votes submitted successfully. You cannot change them now."
    }


@router.get("/admin/live-results/{election_id}")
def admin_live_results(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    results = (
        db.query(
            models.Vote.post_id,
            models.Vote.candidate_id,
            models.User.name.label("candidate_name"),
            func.count(models.Vote.id).label("total_votes")
        )
        .join(models.Candidate, models.Candidate.id == models.Vote.candidate_id)
        .join(models.User, models.User.id == models.Candidate.user_id)
        .filter(models.Vote.election_id == election_id)
        .group_by(
            models.Vote.post_id,
            models.Vote.candidate_id,
            models.User.name
        )
        .all()
    )

    return results


@router.get("/results/{election_id}")
def public_results(
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

    if not election.result_visible:
        raise HTTPException(
            status_code=403,
            detail="Result not published yet"
        )

    if datetime.utcnow() < election.voting_end:
        raise HTTPException(
            status_code=403,
            detail="Results are available only after voting ends"
        )

    results = (
        db.query(
            models.Vote.post_id,
            models.Vote.candidate_id,
            models.User.name.label("candidate_name"),
            func.count(models.Vote.id).label("total_votes")
        )
        .join(models.Candidate, models.Candidate.id == models.Vote.candidate_id)
        .join(models.User, models.User.id == models.Candidate.user_id)
        .filter(models.Vote.election_id == election_id)
        .group_by(
            models.Vote.post_id,
            models.Vote.candidate_id,
            models.User.name
        )
        .all()
    )

    return results
