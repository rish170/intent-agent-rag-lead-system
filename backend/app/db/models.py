from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.db.session import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    platform = Column(String) # E.g., 'Web', 'Mobile'
    timestamp = Column(DateTime, default=datetime.utcnow)
