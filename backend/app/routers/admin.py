from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas, oauth2
from app.database import get_db


router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.post("/students")
def add_student(
    roll_number: str,
    college_email: str,
    name: str,
    has_active_backlog: bool = False,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    existing = db.query(models.Student).filter(
        models.Student.roll_number == roll_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Student already exists"
        )

    student = models.Student(
        name=name,
        roll_number=roll_number,
        college_email=college_email,
        has_active_backlog=has_active_backlog
    )

    db.add(student)
    db.commit()
    db.refresh(student)

    return student


@router.post("/elections", response_model=schemas.ElectionOut)
def create_election(
    election_data: schemas.ElectionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    existing = db.query(models.Election).filter(
        models.Election.year == election_data.year
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Election already exists for this year"
        )

    election = models.Election(
        **election_data.model_dump(),
        created_by=admin.id
    )

    db.add(election)
    db.commit()
    db.refresh(election)

    return election


@router.post("/posts", response_model=schemas.PostOut)
def create_post(
    post_data: schemas.PostCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    election = db.query(models.Election).filter(
        models.Election.id == post_data.election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    post = models.Post(**post_data.model_dump())

    db.add(post)
    db.commit()
    db.refresh(post)

    return post


@router.patch("/students/{student_id}/candidate-block")
def update_candidate_block(
    student_id: int,
    data: schemas.CandidateBlockUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    student = db.query(models.Student).filter(
        models.Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    student.candidate_blocked = data.candidate_blocked
    student.block_reason = data.block_reason

    db.commit()
    db.refresh(student)

    return {
        "message": "Student candidate status updated",
        "candidate_blocked": student.candidate_blocked,
        "block_reason": student.block_reason
    }


@router.patch("/elections/{election_id}/publish-candidates")
def publish_candidates(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    election = db.query(models.Election).filter(
        models.Election.id == election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    election.candidates_visible = True

    db.commit()

    return {"message": "Candidate list published"}


@router.patch("/elections/{election_id}/publish-result")
def publish_result(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    election = db.query(models.Election).filter(
        models.Election.id == election_id
    ).first()

    if not election:
        raise HTTPException(
            status_code=404,
            detail="Election not found"
        )

    election.result_visible = True

    db.commit()

    return {"message": "Result published"}


@router.get("/students")
def get_all_students(
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    students = db.query(models.Student).order_by(
        models.Student.roll_number
    ).all()

    return [
        {
            "id": s.id,
            "name": s.user.name if s.user else "Not Registered",
            "registered": True if s.user else False,
            "user_id": s.user_id,
            "email": s.user.email if s.user else None,
            "college_email": s.college_email,
            "roll_number": s.roll_number,
            "role": s.user.role if s.user else None,
            "is_verified": s.user.is_verified if s.user else False,
            "has_active_backlog": s.has_active_backlog,
            "candidate_blocked": s.candidate_blocked,
            "block_reason": s.block_reason,
        }
        for s in students
    ]


@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    student = db.query(models.Student).filter(
        models.Student.id == student_id
    ).first()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    db.delete(student)
    db.commit()

    return {"message": "Student deleted successfully"}


@router.delete("/elections/{election_id}")
def delete_election(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    election = db.query(models.Election).filter(
        models.Election.id == election_id
    ).first()

    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    db.delete(election)
    db.commit()

    return {"message": "Election deleted successfully"}


@router.patch("/elections/{election_id}/unpublish-candidates")
def unpublish_candidates(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()

    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    election.candidates_published = False
    db.commit()

    return {"message": "Candidates unpublished successfully"}


@router.patch("/elections/{election_id}/unpublish-result")
def unpublish_result(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()

    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    election.result_published = False
    db.commit()

    return {"message": "Result unpublished successfully"}


@router.get("/candidates/applications")
def get_all_candidate_applications(
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin)
):
    rows = (
        db.query(
            models.Candidate,
            models.User,
            models.Student,
            models.Post
        )
        .join(models.User, models.User.id == models.Candidate.user_id)
        .join(models.Student, models.Student.user_id == models.User.id)
        .join(models.CandidatePost, models.CandidatePost.candidate_id == models.Candidate.id)
        .join(models.Post, models.Post.id == models.CandidatePost.post_id)
        .order_by(
            models.Post.display_order.asc(),
            models.Candidate.applied_at.asc()
        )
        .all()
    )

    result = {}

    for candidate, user, student, post in rows:
        if post.name not in result:
            result[post.name] = []

        result[post.name].append({
            "id": candidate.id,
            "candidate_name": user.name,
            "email": user.email,
            "roll_number": student.roll_number,
            "college_email": student.college_email,
            "post_name": post.name,
            "status": candidate.status,
            "applied_at": candidate.applied_at,
            "reviewed_at": candidate.reviewed_at,
            "rejection_reason": candidate.rejection_reason,
        })

    return result