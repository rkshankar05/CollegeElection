from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app import models, oauth2, schemas
from app.database import get_db
from app.services import admin_service


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/students")
def add_student(
    roll_number: str,
    college_email: str,
    name: str,
    has_active_backlog: bool = False,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.add_student(db, roll_number, college_email, name, has_active_backlog)


@router.post("/students/upload-csv")
async def upload_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return await admin_service.upload_students_csv(db, file)


@router.post("/elections", response_model=schemas.ElectionOut)
def create_election(
    election_data: schemas.ElectionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.create_election(db, election_data, admin)


@router.patch("/elections/{election_id}", response_model=schemas.ElectionOut)
def update_election(
    election_id: int,
    election_data: schemas.ElectionCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.update_election(db, election_id, election_data)


@router.post("/posts", response_model=schemas.PostOut)
def create_post(
    post_data: schemas.PostCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.create_post(db, post_data)


@router.patch("/students/{student_id}/candidate-block")
def update_candidate_block(
    student_id: int,
    data: schemas.CandidateBlockUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.update_candidate_block(db, student_id, data)


@router.patch("/elections/{election_id}/publish-candidates")
def publish_candidates(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.publish_candidates(db, election_id)


@router.patch("/elections/{election_id}/publish-result")
def publish_result(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.publish_result(db, election_id)


@router.get("/students")
def get_all_students(
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.get_all_students(db)


@router.patch("/students/{student_id}")
def update_student(
    student_id: int,
    data: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.update_student(db, student_id, data)


@router.delete("/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.delete_student(db, student_id)


@router.delete("/elections/{election_id}")
def delete_election(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.delete_election(db, election_id)


@router.patch("/elections/{election_id}/unpublish-candidates")
def unpublish_candidates(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.unpublish_candidates(db, election_id)


@router.patch("/elections/{election_id}/unpublish-result")
def unpublish_result(
    election_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.unpublish_result(db, election_id)


@router.get("/candidates/applications")
def get_all_candidate_applications(
    db: Session = Depends(get_db),
    admin: models.User = Depends(oauth2.require_admin),
):
    return admin_service.get_all_candidate_applications(db)
