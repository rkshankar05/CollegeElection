from fastapi import HTTPException
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app import models


def get_all_elections(db: Session):
    return db.query(models.Election).order_by(models.Election.year.desc()).all()


def get_single_election(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    return election


def get_election_posts(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    return (
        db.query(models.Post)
        .filter(models.Post.election_id == election_id)
        .order_by(models.Post.display_order.asc())
        .all()
    )


def get_published_candidates(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    if not election.candidates_visible:
        raise HTTPException(status_code=403, detail="Candidate list is not published yet")

    rows = (
        db.query(
            models.Candidate.id.label("candidate_id"),
            models.CandidatePost.id.label("candidate_post_id"),
            models.Post.id.label("post_id"),
            models.User.name,
            models.User.email,
            models.Post.name,
        )
        .select_from(models.Candidate)
        .join(models.User, models.User.id == models.Candidate.user_id)
        .join(models.CandidatePost, models.CandidatePost.candidate_id == models.Candidate.id)
        .join(models.Post, models.Post.id == models.CandidatePost.post_id)
        .filter(
            models.Candidate.election_id == election_id,
            or_(
                models.CandidatePost.status == "approved",
                and_(
                    models.CandidatePost.status.is_(None),
                    models.Candidate.status == "approved",
                ),
            ),
        )
        .order_by(models.Post.display_order.asc(), models.User.name.asc())
        .all()
    )

    return [
        {
            "candidate_id": candidate_id,
            "candidate_post_id": candidate_post_id,
            "post_id": post_id,
            "name": name,
            "email": email,
            "post_name": post_name,
        }
        for candidate_id, candidate_post_id, post_id, name, email, post_name in rows
    ]
