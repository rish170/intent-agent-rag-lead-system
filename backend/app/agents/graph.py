from langgraph.graph import StateGraph, END
from app.agents.state import AgentState
from app.agents.nodes import intent_node, rag_node, lead_node, response_node

def build_graph():
    workflow = StateGraph(AgentState)
    
    # Add nodes
    workflow.add_node("intent", intent_node)
    workflow.add_node("rag", rag_node)
    workflow.add_node("lead", lead_node)
    workflow.add_node("response", response_node)
    
    # Edges
    workflow.set_entry_point("intent")
    workflow.add_edge("intent", "rag")
    workflow.add_edge("rag", "lead")
    workflow.add_edge("lead", "response")
    workflow.add_edge("response", END)
    
    return workflow.compile()

# Singleton graph app
agent_app = build_graph()
