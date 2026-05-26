from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas, utils


def _build_result_rows(db: Session, election_id: int):
    rows = (
        db.query(
            models.Vote.post_id,
            models.Post.name.label("post_name"),
            models.Vote.candidate_id,
            models.Vote.is_nota,
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
            models.Vote.is_nota,
            models.User.name,
        )
        .all()
    )
    return [
        {
            "post_id": row.post_id,
            "post_name": row.post_name,
            "candidate_id": row.candidate_id,
            "candidate_name": "NOTA" if row.is_nota else row.candidate_name,
            "is_nota": row.is_nota,
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

    election = db.query(models.Election).filter(models.Election.id == data.election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = utils.current_election_time()
    if now < election.voting_start:
        raise HTTPException(status_code=400, detail="Voting has not started")
    if now > election.voting_end:
        raise HTTPException(status_code=400, detail="Voting has ended")
    if not election.candidates_visible:
        raise HTTPException(status_code=403, detail="Candidate list is not published yet")
    if len(data.votes) == 0:
        raise HTTPException(status_code=400, detail="No votes submitted")

    post_ids = [vote.post_id for vote in data.votes]
    if len(post_ids) != len(set(post_ids)):
        raise HTTPException(status_code=400, detail="Duplicate post vote found")

    for vote_item in data.votes:
        post = db.query(models.Post).filter(
            models.Post.id == vote_item.post_id,
            models.Post.election_id == data.election_id,
        ).first()
        if not post:
            raise HTTPException(status_code=400, detail=f"Invalid post id {vote_item.post_id}")
        if vote_item.is_nota:
            continue

        candidate = db.query(models.Candidate).filter(
            models.Candidate.id == vote_item.candidate_id,
            models.Candidate.election_id == data.election_id,
        ).first()
        if not candidate:
            raise HTTPException(status_code=400, detail=f"Invalid candidate id {vote_item.candidate_id}")

        status_filter = models.CandidatePost.status == "approved"
        if candidate.status == "approved":
            status_filter = or_(models.CandidatePost.status == "approved", models.CandidatePost.status.is_(None))

        candidate_post = db.query(models.CandidatePost).filter(
            models.CandidatePost.candidate_id == vote_item.candidate_id,
            models.CandidatePost.post_id == vote_item.post_id,
            status_filter,
        ).first()
        if not candidate_post:
            raise HTTPException(status_code=400, detail="Candidate is not approved for the selected post")

    try:
        for vote_item in data.votes:
            db.add(
                models.Vote(
                    voter_id=current_user.id,
                    election_id=data.election_id,
                    post_id=vote_item.post_id,
                    candidate_id=vote_item.candidate_id,
                    is_nota=vote_item.is_nota,
                )
            )
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="You have already voted for one or more selected posts",
        )

    return {"message": "Votes submitted successfully. You cannot change them now."}


def admin_live_results(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")
    return _build_result_rows(db, election_id)


def public_results(db: Session, election_id: int):
    election = db.query(models.Election).filter(models.Election.id == election_id).first()
    if not election:
        raise HTTPException(status_code=404, detail="Election not found")

    now = utils.current_election_time()
    if not election.result_visible or now < election.voting_end:
        raise HTTPException(status_code=403, detail="Result not published yet")

    result_rows = _build_result_rows(db, election_id)
    return {"mode": "final", "results": result_rows, "winners": _build_winner_rows(result_rows)}
