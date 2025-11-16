from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from strawberry.fastapi import GraphQLRouter
from app.schema import schema  # tu schema global
import uvicorn

app = FastAPI(title="Report Service (GraphQL)", version="1.0")

# Configuración CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://192.168.56.1:8080",
        "http://192.168.1.87:8080",
        "http://172.20.64.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graphql_app = GraphQLRouter(schema)
app.include_router(graphql_app, prefix="/graphql")

@app.get("/")
def home():
    return {"message": "GraphQL report service running 🚀"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    print("🚀 Iniciando servidor GraphQL en http://127.0.0.1:4000")
    print("📊 GraphiQL disponible en http://127.0.0.1:4000/graphql")
    uvicorn.run(app, host="127.0.0.1", port=4000)
