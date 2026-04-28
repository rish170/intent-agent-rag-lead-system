def capture_lead(name: str, email: str, platform: str) -> dict:
    """Captures lead data and stores it."""
    from app.db.session import SessionLocal
    from app.db.models import Lead

    db = SessionLocal()
    try:
        new_lead = Lead(name=name, email=email, platform=platform)
        db.add(new_lead)
        db.commit()
        db.refresh(new_lead)
        return {"status": "success", "id": new_lead.id, "message": f"Lead {name} captured."}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()
