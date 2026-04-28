from typing import TypedDict, List, Optional
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]
    intent: Optional[str]
    retrieved_docs: Optional[str]
    lead_data: Optional[dict]
    lead_captured: bool
