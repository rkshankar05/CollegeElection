from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from fastapi.security import OAuth2PasswordRequestForm
from .. import models, schemas, oauth2
from app.database import get_db
from app.services import auth_service


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)
@router.post("/create-admin", response_model=schemas.UserOut)
def create_admin(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    return auth_service.create_admin(db, user_data)

@router.post("/register", response_model=schemas.UserOut)
def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    return auth_service.register(db, user_data)


@router.post("/login", response_model=schemas.Token)
def login(
    user_credentials: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    return auth_service.login(db, user_credentials)




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
    return auth_service.get_profile(db, current_user)
