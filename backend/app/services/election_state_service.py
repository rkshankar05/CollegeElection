from enum import Enum

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models


class ElectionState(str, Enum):
    DRAFT = "DRAFT"
    APPLICATION_OPEN = "APPLICATION_OPEN"
    APPLICATION_CLOSED = "APPLICATION_CLOSED"
    VOTING_OPEN = "VOTING_OPEN"
    VOTING_CLOSED = "VOTING_CLOSED"
    RESULT_PUBLISHED = "RESULT_PUBLISHED"
    ARCHIVED = "ARCHIVED"


ALLOWED_TRANSITIONS = {
    ElectionState.DRAFT: ElectionState.APPLICATION_OPEN,
    ElectionState.APPLICATION_OPEN: ElectionState.APPLICATION_CLOSED,
    ElectionState.APPLICATION_CLOSED: ElectionState.VOTING_OPEN,
    ElectionState.VOTING_OPEN: ElectionState.VOTING_CLOSED,
    ElectionState.VOTING_CLOSED: ElectionState.RESULT_PUBLISHED,
    ElectionState.RESULT_PUBLISHED: ElectionState.ARCHIVED,
}

STATE_ORDER = list(ElectionState)

LEGACY_STATE_MAP = {
    None: ElectionState.DRAFT,
    "draft": ElectionState.DRAFT,
    "active": ElectionState.VOTING_OPEN,
    "ended": ElectionState.VOTING_CLOSED,
}


def get_state(election: models.Election) -> ElectionState:
    raw_state = election.status
    if raw_state in LEGACY_STATE_MAP:
        return LEGACY_STATE_MAP[raw_state]
    try:
        return ElectionState(raw_state)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid election state: {raw_state}")


def assert_state(election: models.Election, expected: ElectionState, detail: str):
    if get_state(election) != expected:
        raise HTTPException(status_code=400, detail=detail)


def assert_not_started_voting(election: models.Election, detail: str):
    current_index = STATE_ORDER.index(get_state(election))
    voting_index = STATE_ORDER.index(ElectionState.VOTING_OPEN)
    if current_index >= voting_index:
        raise HTTPException(status_code=400, detail=detail)


def transition_election(db: Session, election: models.Election, next_state: ElectionState | str):
    next_state = ElectionState(next_state)
    current_state = get_state(election)
    allowed_next = ALLOWED_TRANSITIONS.get(current_state)

    if allowed_next != next_state:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid election transition: {current_state.value} -> {next_state.value}",
        )

    election.status = next_state.value
    if next_state == ElectionState.RESULT_PUBLISHED:
        election.result_visible = True
    if next_state == ElectionState.ARCHIVED:
        election.result_locked = True

    db.commit()
    db.refresh(election)
    return election


def open_applications(db: Session, election: models.Election):
    return transition_election(db, election, ElectionState.APPLICATION_OPEN)


def close_applications(db: Session, election: models.Election):
    return transition_election(db, election, ElectionState.APPLICATION_CLOSED)


def open_voting(db: Session, election: models.Election):
    return transition_election(db, election, ElectionState.VOTING_OPEN)


def close_voting(db: Session, election: models.Election):
    return transition_election(db, election, ElectionState.VOTING_CLOSED)


def publish_results(db: Session, election: models.Election):
    return transition_election(db, election, ElectionState.RESULT_PUBLISHED)


def archive(db: Session, election: models.Election):
    return transition_election(db, election, ElectionState.ARCHIVED)
