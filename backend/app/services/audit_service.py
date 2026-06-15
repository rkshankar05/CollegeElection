from sqlalchemy.orm import Session

from app import models


def log_action(
    db: Session,
    action: str,
    actor_id: int | None = None,
    resource_type: str | None = None,
    resource_id: int | None = None,
    details: str | None = None,
):
    audit_log = models.AuditLog(
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
    )
    db.add(audit_log)
    return audit_log
