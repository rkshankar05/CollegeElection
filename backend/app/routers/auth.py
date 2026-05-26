from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from fastapi.security import OAuth2PasswordRequestForm
from .. import models, schemas, utils, oauth2
from app.database import get_db


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)
@router.post("/create-admin", response_model=schemas.UserOut)
def create_admin(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password=utils.hash_password(user_data.password),
        role="admin",
        is_verified=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/register", response_model=schemas.UserOut)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # 1. Check if roll number exists in official student list
    student = db.query(models.Student).filter(
        models.Student.roll_number == user_data.roll_number,
        models.Student.college_email == user_data.email
    ).first()

    if not student:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not in official college student list"
        )

    # 2. Check if already registered
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # 3. Create user
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        password=utils.hash_password(user_data.password),
        role="student",
        is_verified=True
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Link student record with user
    student.user_id = new_user.id
    db.commit()

    return new_user


@router.post("/login", response_model=schemas.Token)
def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(
        models.User.email == user_credentials.username
    ).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid email or password"
        )

    if not utils.verify_password(
        user_credentials.password,
        user.password
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid email or password"
        )

    access_token = oauth2.create_access_token(
        data={
            "user_id": user.id,
            "role": user.role
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }




@router.get("/me", response_model=schemas.UserOut)
def get_me(
    current_user: models.User = Depends(oauth2.get_current_user)
):
    return current_user


@router.get("/profile", response_model=schemas.UserProfileOut)
def get_profile(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(oauth2.get_current_user)
):
    student = db.query(models.Student).filter(
        models.Student.user_id == current_user.id
    ).first()

    profile = {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "roll_number": student.roll_number if student else None,
        "college_email": student.college_email if student else None,
        "has_active_backlog": student.has_active_backlog if student else None,
        "candidate_blocked": student.candidate_blocked if student else None,
        "block_reason": student.block_reason if student else None,
        "active_posts": [],
    }

    if current_user.role != "student":
        return profile

    now = utils.current_election_time()
    elections = db.query(models.Election).order_by(
        models.Election.voting_start.asc()
    ).all()

    election_sequence = {
        election.id: index for index, election in enumerate(elections)
    }

    vote_totals = (
        db.query(
            models.Vote.election_id,
            models.Vote.post_id,
            models.Vote.candidate_id,
            func.count(models.Vote.id).label("total_votes"),
            models.Post.name.label("post_name"),
            models.Election.title.label("election_title"),
            models.Election.year.label("election_year"),
            models.Election.voting_end.label("election_voting_end"),
            models.Candidate.user_id.label("candidate_user_id"),
        )
        .join(models.Candidate, models.Candidate.id == models.Vote.candidate_id)
        .join(models.Post, models.Post.id == models.Vote.post_id)
        .join(models.Election, models.Election.id == models.Vote.election_id)
        .filter(
            models.Election.result_visible == True,
            models.Election.voting_end <= now
        )
        .group_by(
            models.Vote.election_id,
            models.Vote.post_id,
            models.Vote.candidate_id,
            models.Post.name,
            models.Election.title,
            models.Election.year,
            models.Election.voting_end,
            models.Candidate.user_id,
        )
        .all()
    )

    winning_vote_counts = {}
    winning_vote_occurrences = {}

    for row in vote_totals:
        key = (row.election_id, row.post_id)
        if key not in winning_vote_counts or row.total_votes > winning_vote_counts[key]:
            winning_vote_counts[key] = row.total_votes
            winning_vote_occurrences[key] = 1
        elif row.total_votes == winning_vote_counts[key]:
            winning_vote_occurrences[key] = winning_vote_occurrences.get(key, 0) + 1

    active_posts = []

    for row in vote_totals:
        if row.candidate_user_id != current_user.id:
            continue

        key = (row.election_id, row.post_id)

        if row.total_votes != winning_vote_counts.get(key):
            continue

        if winning_vote_occurrences.get(key, 0) != 1:
            continue

        current_election_index = election_sequence.get(row.election_id)
        next_election = None

        if current_election_index is not None and current_election_index + 1 < len(elections):
            next_election = elections[current_election_index + 1]

        if next_election and now >= next_election.voting_end:
            continue

        active_posts.append(
            {
                "election_id": row.election_id,
                "election_title": row.election_title,
                "election_year": row.election_year,
                "post_id": row.post_id,
                "post_name": row.post_name,
                "total_votes": row.total_votes,
            }
        )

    profile["active_posts"] = active_posts

    return profile
