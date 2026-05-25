from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas, oauth2
from app.database import get_db


router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"]
)


@router.get("/my-applications")
def get_my_applications(
    db: Session = Depends(get_db),
    current_user=Depends(oauth2.get_current_user)
):
    rows = (
        db.query(
            models.Candidate.id,
            models.User.name,
            models.Election.title,
            models.Post.name,
            models.Candidate.status,
            models.Candidate.applied_at,
            models.Candidate.reviewed_at,
            models.Candidate.rejection_reason
        )
        .select_from(models.Candidate)
        .join(models.User, models.User.id == models.Candidate.user_id)
        .join(
            models.CandidatePost,
            models.CandidatePost.candidate_id == models.Candidate.id
        )
        .join(models.Post, models.Post.id == models.CandidatePost.post_id)
        .join(models.Election, models.Election.id == models.Candidate.election_id)
        .filter(models.Candidate.user_id == current_user.id)
        .all()
    )

    applications = {}

    for r in rows:
        candidate_id = r[0]

        if candidate_id not in applications:
            applications[candidate_id] = {
                "candidate_name": r[1],
                "election": r[2],
                "post": [],
                "status": r[4],
                "applied_at": r[5],
                "reviewed_at": r[6],
                "rejection_reason": r[7]
            }

        applications[candidate_id]["post"].append(r[3])

    return list(applications.values())


@router.post("/apply")
def apply_for_candidate(
    data: schemas.CandidateApply,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=403,
            detail="Only students can apply"
        )

    if len(data.post_ids) == 0:
        raise HTTPException(
            status_code=400,
            detail="Select at least one post"
        )

    if len(data.post_ids) > 2:
        raise HTTPException(
            status_code=400,
            detail="You can apply for maximum 2 posts"
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

    if now < election.application_start:
        raise HTTPException(
            status_code=400,
            detail="Candidate application has not started"
        )

    if now > election.application_deadline:
        raise HTTPException(
            status_code=400,
            detail="Candidate application deadline passed"
        )

    student = db.query(models.Student).filter(
        models.Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=403,
            detail="Student profile not found"
        )

    if student.has_active_backlog:
        raise HTTPException(
            status_code=403,
            detail="Students with active backlog cannot apply"
        )

    if student.candidate_blocked:
        raise HTTPException(
            status_code=403,
            detail=student.block_reason or "You are blocked by administration"
        )

    existing_application = db.query(models.Candidate).filter(
        models.Candidate.user_id == current_user.id,
        models.Candidate.election_id == data.election_id
    ).first()

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied for this election"
        )

    posts = db.query(models.Post).filter(
        models.Post.id.in_(data.post_ids),
        models.Post.election_id == data.election_id
    ).all()

    if len(posts) != len(set(data.post_ids)):
        raise HTTPException(
            status_code=400,
            detail="Invalid post selected"
        )

    candidate = models.Candidate(
        user_id=current_user.id,
        election_id=data.election_id,
        status="pending"
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    for post_id in set(data.post_ids):
        candidate_post = models.CandidatePost(
            candidate_id=candidate.id,
            post_id=post_id
        )
        db.add(candidate_post)

    db.commit()

    return {
        "message": "Candidate application submitted successfully",
        "candidate_id": candidate.id
    }


@router.get("/admin/all")
def get_all_candidate_applications(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    candidates = db.query(models.Candidate).filter(
        models.Candidate.election_id == election_id
    ).order_by(models.Candidate.applied_at.asc()).all()

    return candidates


@router.patch("/admin/{candidate_id}/review")
def review_candidate(
    candidate_id: int,
    data: schemas.CandidateReview,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    if data.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected"
        )

    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == candidate_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    if candidate.status != "pending":
        raise HTTPException(
            status_code=400,
            detail="Candidate already reviewed"
        )

    candidate_posts = db.query(models.CandidatePost).filter(
        models.CandidatePost.candidate_id == candidate.id
    ).all()

    if not candidate_posts:
        raise HTTPException(
            status_code=400,
            detail="Candidate has no selected post"
        )

    if data.status == "approved":
        available_posts = []

        for cp in candidate_posts:
            approved_count = (
                db.query(models.CandidatePost)
                .join(models.Candidate)
                .filter(
                    models.CandidatePost.post_id == cp.post_id,
                    models.Candidate.status == "approved"
                )
                .count()
            )

            if approved_count < 5:
                available_posts.append(cp.post_id)

        if not available_posts:
            raise HTTPException(
                status_code=400,
                detail="All selected posts already have 5 approved candidates"
            )

        candidate.status = "approved"
        candidate.reviewed_at = datetime.utcnow()
        candidate.rejection_reason = None

    else:
        candidate.status = "rejected"
        candidate.reviewed_at = datetime.utcnow()
        candidate.rejection_reason = data.rejection_reason or "Rejected by admin"

    db.commit()
    db.refresh(candidate)

    return {
        "message": f"Candidate {candidate.status} successfully",
        "candidate_id": candidate.id,
        "status": candidate.status
    }


@router.get("/election/{election_id}/public")
def get_public_candidates(
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

    rows = (
        db.query(
            models.User.name,
            models.User.email,
            models.Post.name
        )
        .select_from(models.Candidate)
        .join(models.User, models.User.id == models.Candidate.user_id)
        .join(
            models.CandidatePost,
            models.CandidatePost.candidate_id == models.Candidate.id
        )
        .join(models.Post, models.Post.id == models.CandidatePost.post_id)
        .filter(
            models.Candidate.election_id == election_id,
            models.Candidate.status == "approved"
        )
        .order_by(
            models.Post.display_order.asc(),
            models.User.name.asc()
        )
        .all()
    )

    return [
        {
            "name": name,
            "email": email,
            "post_name": post_name
        }
        for name, email, post_name in rows
    ]

