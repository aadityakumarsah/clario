from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import websocket_router, auth_router, settings_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(settings_router)
app.include_router(websocket_router)

@app.get("/", tags=['Root'])
def read_root():
    return {"message": "Clario Backend!"}



