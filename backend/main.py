from fastapi import FastAPI
from routes.chat import router as chat_router

app = FastAPI()

app.include_router(chat_router, prefix="/chats", tags=["chats"])


@app.get("/")
async def root():
    return {"message": "Hello World"}