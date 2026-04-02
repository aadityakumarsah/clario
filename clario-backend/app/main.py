from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.prisma import connect_db, disconnect_db
from app.routers.auth import auth_router
from app.routers.settings import settings_router
from app.routers.sessions import sessions_router
from app.routers.websocket import websocket_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(sessions_router)
app.include_router(websocket_router)

@app.get("/", tags=['Root'])
def read_root():
    return {"message": "Clario Backend!"}



