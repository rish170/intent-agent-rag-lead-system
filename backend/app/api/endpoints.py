from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Lead
from app.agents.graph import agent_app
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str

class ChatResponse(BaseModel):
    response: str
    intent: str

# Memory store for simplicity (in production, use Redis or Postgres to store state)
SESSION_STATES = {}

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    state = SESSION_STATES.get(req.session_id, {
        "messages": [],
        "intent": None,
        "retrieved_docs": None,
        "lead_data": {},
        "lead_captured": False
    })
    
    state["messages"].append(HumanMessage(content=req.message))
    
    # Run graph
    try:
        new_state = agent_app.invoke(state)
        SESSION_STATES[req.session_id] = new_state
        
        last_message = new_state["messages"][-1].content
        return ChatResponse(
            response=last_message,
            intent=new_state.get("intent", "unknown")
        )
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "rate-limited" in error_msg.lower():
            error_response = "I'm currently receiving too many requests (OpenRouter free tier limit). Please try again in a few moments."
        elif "404" in error_msg:
            error_response = "The AI model is currently offline or unavailable on OpenRouter."
        else:
            error_response = f"An error occurred while connecting to the AI provider. Detail: {error_msg}"
            
        return ChatResponse(
            response=error_response,
            intent="error"
        )

class LeadCreate(BaseModel):
    name: str
    email: str
    platform: str

@router.post("/lead")
def create_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    new_lead = Lead(name=lead.name, email=lead.email, platform=lead.platform)
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return {"status": "success", "id": new_lead.id}

@router.get("/lead/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"id": lead.id, "name": lead.name, "email": lead.email, "platform": lead.platform}
