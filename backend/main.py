import os

from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from hindsight_client import Hindsight
from groq import Groq

load_dotenv()

app = FastAPI(title="Hindsight Support Agent")


# ==============================
# Hindsight Connection
# ==============================

hindsight = Hindsight(
    base_url=os.getenv("HINDSIGHT_BASE_URL"),
    api_key=os.getenv("HINDSIGHT_API_KEY")
)


# ==============================
# Groq Connection
# ==============================

groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


BANK_ID = "customer-support-agent"


# ==============================
# Request Model
# ==============================

class ChatRequest(BaseModel):
    customer_id: str
    message: str


# ==============================
# Home Route
# ==============================

@app.get("/")
def home():
    return {
        "message": "Hindsight Support Agent Backend is running!"
    }


# ==============================
# Chat Route
# ==============================

@app.post("/chat")
def chat(request: ChatRequest):

    # 1. Recall previous customer memories
    memory_result = hindsight.recall(
        bank_id=BANK_ID,
        query=f"Customer {request.customer_id}: {request.message}"
    )

    # 2. Get memory objects
    memories = memory_result.results

    # 3. Convert memories into text
    memory_text = "\n".join(
        [memory.text for memory in memories]
    )

    # 4. AI System Prompt
    system_prompt = f"""
You are a smart customer support agent.

Customer ID:
{request.customer_id}

Relevant memories from previous conversations:
{memory_text}

Use these memories to personalize your response.

Rules:
- Give a short and direct answer.
- Keep the response to 2-4 sentences maximum.
- Give only the most useful troubleshooting step.
- Do not give long explanations.
- Do not repeat unnecessary information.
- Do not invent customer history.
- If a previous solution failed, suggest a different solution.
- Be friendly and professional.
"""


    # 5. Ask Groq
    response = groq_client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": request.message
            }
        ],
        temperature=0.3
    )


    # 6. Get AI reply
    reply = response.choices[0].message.content


    # 7. Save conversation into Hindsight
    hindsight.retain(
        bank_id=BANK_ID,
        content=f"""
Customer {request.customer_id} said:
{request.message}

Support Agent replied:
{reply}
"""
    )


    # 8. Return response to mobile app
    return {
        "customer_id": request.customer_id,
        "reply": reply,
        "memories_used": [
            memory.text for memory in memories
        ]
    }