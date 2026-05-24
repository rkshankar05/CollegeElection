from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

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


from fastapi.security import OAuth2PasswordRequestForm


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
        data={"user_id": user.id}
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