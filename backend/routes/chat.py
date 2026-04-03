from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class ChatCreate(BaseModel):
    title: Optional[str] = None
    content: str


class ChatUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class Chat(BaseModel):
    id: str
    title: Optional[str] = None
    content: str


# In-memory storage (replace with database in production)
chats_db = {}

# this one wont be used much since we are planning on letting next creating and routing to the new chat instead of having to communicate with backend since db is shared
@router.post('/', response_model=Chat, status_code=201)
async def create_chat(chat: ChatCreate):
    """Create a new chat"""
    import uuid
    chat_id = str(uuid.uuid4())
    new_chat = Chat(id=chat_id, title=chat.title, content=chat.content)
    chats_db[chat_id] = new_chat
    return new_chat


@router.get('/{id}', response_model=Chat)
async def get_chat(id: str):
    """Get a chat by ID"""
    if id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chats_db[id]


@router.put('/{id}', response_model=Chat)
async def update_chat(id: str, chat: ChatUpdate):
    """Update a chat by ID"""
    if id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    existing_chat = chats_db[id]
    update_data = chat.model_dump(exclude_unset=True)
    
    updated_chat = existing_chat.model_copy(update=update_data)
    chats_db[id] = updated_chat
    return updated_chat


@router.delete('/{id}', status_code=204)
async def delete_chat(id: str):
    """Delete a chat by ID"""
    if id not in chats_db:
        raise HTTPException(status_code=404, detail="Chat not found")
    del chats_db[id]
    return None