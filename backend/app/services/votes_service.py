import secrets

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas
from app.repositories.vote_repo import VoteRepository
import app.services.audit_service as audit_service
import app.services.election_state_service as election_state_service


def _generate_receipt_code(vote_repo: VoteRepository) -> str:
    for _ in range(5):
        receipt_code = secrets.token_urlsafe(24)
        if not vote_repo.get_receipt_by_code(receipt_code):
            return receipt_code
    raise HTTPException(status_code=500, detail="Could not generate vote receipt")


def _build_result_rows(db: Session, election_id: int):
    rows = (
        db.query(
            models.Vote.post_id,
            models.Post.name.label("post_name"),
            models.Vote.candidate_id,
            models.User.name.label("candidate_name"),
            func.count(models.Vote.id).label("total_votes"),
        )
        .join(models.Post, models.Post.id == models.Vote.post_id)
        .outerjoin(models.Candidate, models.Candidate.id == models.Vote.candidate_id)
        .outerjoin(models.User, models.User.id == models.Candidate.user_id)
        .filter(models.Vote.election_id == election_id)
        .group_by(
            models.Vote.post_id,
            models.Post.name,
            models.Vote.candidate_id,
            models.User.name,
        )
        .all()
    )
    return [
        {
            "post_id": row.post_id,
            "post_name": row.post_name,
            "candidate_id": row.candidate_id,
            "candidate_name": "NOTA" if row.candidate_id is None else row.candidate_name,
            "is_nota": row.candidate_id is None,
            "total_votes": row.total_votes,
        }
        for row in rows
    ]


def _build_winner_rows(result_rows: list[dict]):
    winners_by_post = {}
    for row in result_rows:
        key = row["post_id"]
        winners_by_post.setdefault(
            key,
            {
                "post_id": row["post_id"],
                "post_name": row["post_name"],
                "nota_votes": 0,
                "best_candidate": None,
            },
        )
        current = winners_by_post[key]
        if row["is_nota"]:
            current["nota_votes"] = row["total_votes"]
            continue
        if current["best_candidate"] is None or row["total_votes"] > current["best_candidate"]["total_votes"]:
            current["best_candidate"] = row

    winners = []
    for item in winners_by_post.values():
        best_candidate = item["best_candidate"]
        nota_votes = item["nota_votes"]
        if best_candidate is None or nota_votes > best_candidate["total_votes"]:
            winners.append(
                {
                    "post_id": item["post_id"],
                    "post_name": item["post_name"],
                    "winner_name": "NOTA",
                    "is_nota": True,
                }
            )
        else:
            winners.append(
                {
                    "post_id": item["post_id"],
                    "post_name": item["post_name"],
                    "winner_name": best_candidate["candidate_name"],
                    "is_nota": False,
                }
            )
    return sorted(winners, key=lambda row: (row["post_name"] or "", row["post_id"]))


def submit_votes(db: Session, current_user: models.User, data: schemas.VoteSubmit):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can vote")

    vote_repo = VoteRepository(db)
    election = vote_repo.get_election(data.election_id)
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    election_state_service.assert_state(
        election,
        election_state_service.ElectionState.VOTING_OPEN,
        "Votes can be submitted only while voting is open",
    )
    if not election.candidates_visible:
        raise HTTPException(status_code=403, detail="Candidate list is not published yet")
    if len(data.votes) == 0:
        raise HTTPException(status_code=400, detail="No votes submitted")

    post_ids = [vote.post_id for vote in data.votes]
    if len(post_ids) != len(set(post_ids)):
        raise HTTPException(status_code=400, detail="Duplicate post vote found")

    for vote_item in data.votes:
        if not vote_repo.get_post_for_election(data.election_id, vote_item.post_id):
            raise HTTPException(status_code=400, detail=f"Invalid post id {vote_item.post_id}")

        if vote_repo.has_existing_vote(current_user.id, data.election_id, vote_item.post_id):
            raise HTTPException(
                status_code=400,
                detail="You have already voted for this election post",
            )

        if vote_item.is_nota:
            continue

        if not vote_repo.get_approved_candidate_for_vote(
            data.election_id,
            vote_item.post_id,
            vote_item.candidate_id,
        ):
            raise HTTPException(status_code=400, detail="Candidate is not approved for the selected post")

    try:
        receipts = []
        for vote_item in data.votes:
            vote_repo.add(
                models.Vote(
                    election_id=data.election_id,
                    post_id=vote_item.post_id,
                    candidate_id=None if vote_item.is_nota else vote_item.candidate_id,
                )
            )
            receipt = vote_repo.add_receipt(
                models.VoteReceipt(
                    voter_id=current_user.id,
                    election_id=data.election_id,
                    post_id=vote_item.post_id,
                    receipt_code=_generate_receipt_code(vote_repo),
                )
            )
            db.flush()
            audit_service.log_action(
                db,
                action="vote_submitted",
                actor_id=current_user.id,
                resource_type="vote_receipt",
                resource_id=receipt.id,
                details=f"election_id={data.election_id};post_id={vote_item.post_id}",
            )
            receipts.append(receipt)
        db.commit()
        for receipt in receipts:
            db.refresh(receipt)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="You have already voted for this election post",
        )

    return {
        "message": "Votes submitted successfully. Keep your receipt codes for verification.",
        "receipts": receipts,
    }


def admin_live_results(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    return _build_result_rows(db, election_id)


def public_results(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    if election_state_service.get_state(election) not in {
        election_state_service.ElectionState.RESULT_PUBLISHED,
        election_state_service.ElectionState.ARCHIVED,
    } or not election.result_visible:
        raise HTTPException(status_code=403, detail="Result not published yet")

    result_rows = _build_result_rows(db, election_id)
    return {"mode": "final", "results": result_rows, "winners": _build_winner_rows(result_rows)}
