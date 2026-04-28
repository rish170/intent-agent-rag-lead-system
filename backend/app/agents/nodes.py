import os
import json
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from langchain_openai import ChatOpenAI
from app.agents.state import AgentState
from app.rag.document_store import rag_store
from app.agents.tools import capture_lead
from dotenv import load_dotenv

dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_dotenv(dotenv_path)

# Initialize primary OpenRouter model (Gemma 3 12B - confirmed working by user)
llm_primary = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "dummy"),
    model=os.getenv("MODEL_NAME", "google/gemma-3-12b-it:free"),
    max_retries=1
)

# Initialize fallback models in case the primary one is rate-limited
llm_fallback_1 = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "dummy"),
    model="nvidia/nemotron-nano-9b-v2:free",
    max_retries=1
)

llm_fallback_2 = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "dummy"),
    model="meta-llama/llama-3.3-70b-instruct:free",
    max_retries=1
)

llm_fallback_3 = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY", "dummy"),
    model="meta-llama/llama-3.2-3b-instruct:free",
    max_retries=1
)

llm = llm_primary.with_fallbacks([llm_fallback_1, llm_fallback_2, llm_fallback_3])

def intent_node(state: AgentState) -> dict:
    """Detects the user intent from the latest message."""
    messages = state["messages"]
    latest_message = messages[-1].content
    
    # Prompt for intent detection
    prompt = f"""
    Analyze the user's latest message and categorize it into exactly ONE of the following intents:
    1. greeting (e.g. hello, hi)
    2. product_inquiry (e.g. pricing, features, plans)
    3. technical_query (e.g. how it works, integrations)
    4. high_intent (e.g. ready to purchase, subscribe, sign up, give info)
    5. support_query (e.g. issues, troubleshooting)
    6. fallback (anything else)
    
    If the user is giving their name/email/platform, it is 'high_intent'.
    
    User Message: "{latest_message}"
    
    Output ONLY the intent name in lowercase.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    intent = response.content.strip().lower()
    
    # Simple stickiness check: if they were in high_intent and are giving details, keep it.
    if state.get("intent") == "high_intent" and not state.get("lead_captured"):
        intent = "high_intent"
        
    return {"intent": intent}

def rag_node(state: AgentState) -> dict:
    """Retrieves context for product and technical queries."""
    intent = state.get("intent")
    
    if intent in ["product_inquiry", "technical_query", "support_query"]:
        latest_message = state["messages"][-1].content
        context = rag_store.retrieve(latest_message)
        return {"retrieved_docs": context}
        
    return {"retrieved_docs": ""}

def lead_node(state: AgentState) -> dict:
    """Extracts lead info and captures it if high intent is met."""
    if state.get("intent") == "high_intent" and not state.get("lead_captured"):
        messages = state["messages"]
        conversation = "\n".join([f"{m.type}: {m.content}" for m in messages[-4:]])
        
        prompt = f"""
        Extract lead details from the conversation. 
        If present, extract 'name', 'email', and 'platform' (e.g. Web, Mobile, Desktop).
        If any are missing, return null for them.
        
        Conversation:
        {conversation}
        
        Return exactly as valid JSON:
        {{"name": "...", "email": "...", "platform": "..."}}
        """
        response = llm.invoke([HumanMessage(content=prompt)])
        
        try:
            # Clean possible markdown block
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            
            extracted = json.loads(content)
            
            # Merge with existing lead data
            current_lead = state.get("lead_data") or {}
            for k, v in extracted.items():
                if v and v != "null" and k not in current_lead:
                    current_lead[k] = v
                    
            state["lead_data"] = current_lead
            
            # If we have all required fields, capture
            if current_lead.get("name") and current_lead.get("email"):
                platform = current_lead.get("platform") or "Web"
                res = capture_lead(current_lead["name"], current_lead["email"], platform)
                if res["status"] == "success":
                    return {"lead_data": current_lead, "lead_captured": True}
                    
            return {"lead_data": current_lead}
        except json.JSONDecodeError:
            pass
            
    return {}

def response_node(state: AgentState) -> dict:
    """Generates the final response based on intent and context."""
    intent = state.get("intent")
    context = state.get("retrieved_docs")
    lead_data = state.get("lead_data", {})
    
    system_prompt = "You are a helpful AI assistant for Adobe Creative Cloud. Structure your response with bold headings and clean bulleted lists where appropriate."
    
    if intent == "high_intent" and not state.get("lead_captured"):
        missing = []
        if not lead_data.get("name"): missing.append("name")
        if not lead_data.get("email"): missing.append("email")
        
        system_prompt += f"\nThe user wants to sign up or purchase. Ask them for their missing details politely: {', '.join(missing)}."
    elif intent == "high_intent" and state.get("lead_captured"):
        system_prompt += "\nThe lead has been captured. Thank them for their info and tell them a representative will reach out."
    elif context:
        system_prompt += f"\nAnswer the user's question strictly using the following retrieved context. Do not hallucinate.\n\nContext: {context}"
    elif intent == "greeting":
        system_prompt += "\nGreet the user politely and ask how you can help them with Adobe Creative Cloud."
    else:
        system_prompt += "\nPolitely let the user know you can only assist with Adobe Creative Cloud products and subscriptions."
        
    messages = [SystemMessage(content=system_prompt)] + state["messages"]
    
    response = llm.invoke(messages)
    return {"messages": [response]}
