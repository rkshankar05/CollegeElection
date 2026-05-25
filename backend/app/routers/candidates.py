from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import and_, or_
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
            models.Candidate.applied_at,
            models.CandidatePost.id,
            models.Post.name,
            models.CandidatePost.status,
            models.CandidatePost.reviewed_at,
            models.CandidatePost.rejection_reason
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
                "id": candidate_id,
                "candidate_name": r[1],
                "election": r[2],
                "post": [],
                "posts": [],
                "applied_at": r[3],
            }

        applications[candidate_id]["post"].append(r[5])
        applications[candidate_id]["posts"].append(
            {
                "candidate_post_id": r[4],
                "post_name": r[5],
                "status": r[6],
                "reviewed_at": r[7],
                "rejection_reason": r[8],
            }
        )

    for application in applications.values():
        statuses = {post["status"] for post in application["posts"]}
        application["status"] = statuses.pop() if len(statuses) == 1 else "mixed"
        reviewed_at_values = [
            post["reviewed_at"] for post in application["posts"] if post["reviewed_at"]
        ]
        application["reviewed_at"] = max(reviewed_at_values) if reviewed_at_values else None
        application["rejection_reason"] = None

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
        election_id=data.election_id
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    for post_id in set(data.post_ids):
        candidate_post = models.CandidatePost(
            candidate_id=candidate.id,
            post_id=post_id,
            status="pending"
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
    rows = (
        db.query(
            models.CandidatePost.id.label("candidate_post_id"),
            models.Candidate.id.label("candidate_id"),
            models.Candidate.user_id,
            models.Candidate.election_id,
            models.Candidate.applied_at,
            models.Post.id.label("post_id"),
            models.Post.name.label("post_name"),
            models.CandidatePost.status,
            models.CandidatePost.reviewed_at,
            models.CandidatePost.rejection_reason,
        )
        .join(models.Candidate, models.Candidate.id == models.CandidatePost.candidate_id)
        .join(models.Post, models.Post.id == models.CandidatePost.post_id)
        .filter(models.Candidate.election_id == election_id)
        .order_by(models.Candidate.applied_at.asc(), models.Post.display_order.asc())
        .all()
    )

    return [row._asdict() for row in rows]


@router.patch("/admin/{candidate_post_id}/review")
def review_candidate(
    candidate_post_id: int,
    data: schemas.CandidateReview,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    if data.status not in ["approved", "rejected"]:
        raise HTTPException(
            status_code=400,
            detail="Status must be approved or rejected"
        )

    candidate_post = db.query(models.CandidatePost).filter(
        models.CandidatePost.id == candidate_post_id
    ).first()

    if not candidate_post:
        raise HTTPException(
            status_code=404,
            detail="Candidate post not found"
        )

    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == candidate_post.candidate_id
    ).first()

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    election = db.query(models.Election).filter(
        models.Election.id == candidate.election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    if datetime.utcnow() >= election.voting_start:
        raise HTTPException(
            status_code=400,
            detail="Candidate review is closed because voting has started"
        )

    if candidate_post.status == data.status:
        if data.status == "rejected" and data.rejection_reason:
            candidate_post.rejection_reason = data.rejection_reason
            candidate_post.reviewed_at = datetime.utcnow()
            db.commit()
            db.refresh(candidate_post)

        return {
            "message": f"Candidate post already {candidate_post.status}",
            "candidate_post_id": candidate_post.id,
            "status": candidate_post.status
        }

    if data.status == "approved":
        approved_count = (
            db.query(models.CandidatePost)
            .join(models.Candidate, models.Candidate.id == models.CandidatePost.candidate_id)
            .filter(
                models.CandidatePost.post_id == candidate_post.post_id,
                models.CandidatePost.id != candidate_post.id,
                or_(
                    models.CandidatePost.status == "approved",
                    and_(
                        models.CandidatePost.status.is_(None),
                        models.Candidate.status == "approved",
                    ),
                )
            )
            .count()
        )

        if approved_count >= 5:
            raise HTTPException(
                status_code=400,
                detail="This post already has 5 approved candidates"
            )

        candidate_post.status = "approved"
        candidate_post.reviewed_at = datetime.utcnow()
        candidate_post.rejection_reason = None

    else:
        candidate_post.status = "rejected"
        candidate_post.reviewed_at = datetime.utcnow()
        candidate_post.rejection_reason = data.rejection_reason or "Rejected by admin"

    db.commit()
    db.refresh(candidate_post)

    return {
        "message": f"Candidate post {candidate_post.status} successfully",
        "candidate_post_id": candidate_post.id,
        "status": candidate_post.status
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
            models.Candidate.id.label("candidate_id"),
            models.CandidatePost.id.label("candidate_post_id"),
            models.Post.id.label("post_id"),
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
            or_(
                models.CandidatePost.status == "approved",
                and_(
                    models.CandidatePost.status.is_(None),
                    models.Candidate.status == "approved",
                ),
            )
        )
        .order_by(
            models.Post.display_order.asc(),
            models.User.name.asc()
        )
        .all()
    )

    return [
        {
            "candidate_id": candidate_id,
            "candidate_post_id": candidate_post_id,
            "post_id": post_id,
            "name": name,
            "email": email,
            "post_name": post_name
        }
        for candidate_id, candidate_post_id, post_id, name, email, post_name in rows
    ]
