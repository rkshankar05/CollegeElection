
from fastapi import FastAPI
app = FastAPI(title="College Voting System")

@app.get("/")
def home():
    return {"message":"Voting System API"}
