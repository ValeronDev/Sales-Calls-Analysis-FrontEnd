from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from typing import List, Optional
import uuid
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
import json

# Load environment variables
load_dotenv()

app = FastAPI(title="Sales Call Review API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/sales_call_review")
client = MongoClient(MONGO_URL)
db = client.sales_call_review

# Collections
users_collection = db.users
calls_collection = db.call_analyses
chats_collection = db.chats

# Authentication setup
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-key")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic models
class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str
    rep_name: str

class CallAnalysisReceive(BaseModel):
    call_id: str
    rep_id: str
    rep_name: str
    call_title: str
    call_date: str
    transcript_url: str
    analysis: dict

class CallAnalysisResponse(BaseModel):
    id: str
    call_id: str
    rep_id: str
    rep_name: str
    call_title: str
    call_date: str
    transcript_url: str
    analysis: dict
    created_at: str

class ChatMessage(BaseModel):
    message: str
    call_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    timestamp: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        user = users_collection.find_one({"username": username})
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

# Initialize default users
def init_default_users():
    # Check if users exist
    if users_collection.count_documents({}) == 0:
        default_users = [
            {
                "id": str(uuid.uuid4()),
                "username": "jane.doe",
                "password": get_password_hash("password123"),
                "role": "rep",
                "rep_name": "Jane Doe",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "username": "john.smith",
                "password": get_password_hash("password123"),
                "role": "rep", 
                "rep_name": "John Smith",
                "created_at": datetime.utcnow().isoformat()
            },
            {
                "id": str(uuid.uuid4()),
                "username": "manager",
                "password": get_password_hash("admin123"),
                "role": "manager",
                "rep_name": "Sales Manager",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        users_collection.insert_many(default_users)
        print("Default users created")

# API Routes
@app.on_event("startup")
async def startup_event():
    init_default_users()

@app.get("/")
async def root():
    return {"message": "Sales Call Review API is running"}

@app.post("/api/auth/login")
async def login(user_data: UserLogin):
    user = users_collection.find_one({"username": user_data.username})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "rep_name": user["rep_name"]
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "username": current_user["username"],
        "role": current_user["role"],
        "rep_name": current_user["rep_name"]
    }

@app.post("/api/webhook/call-analysis")
async def receive_call_analysis(call_data: CallAnalysisReceive):
    """Webhook endpoint for n8n to send call analysis data"""
    try:
        # Create call analysis document
        call_doc = {
            "id": str(uuid.uuid4()),
            "call_id": call_data.call_id,
            "rep_id": call_data.rep_id,
            "rep_name": call_data.rep_name,
            "call_title": call_data.call_title,
            "call_date": call_data.call_date,
            "transcript_url": call_data.transcript_url,
            "analysis": call_data.analysis,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into database
        result = calls_collection.insert_one(call_doc)
        
        return {
            "message": "Call analysis received successfully",
            "id": call_doc["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing call analysis: {str(e)}")

@app.get("/api/calls")
async def get_calls(
    rep_id: Optional[str] = None,
    limit: int = 20,
    skip: int = 0,
    current_user = Depends(get_current_user)
):
    """Get call analyses with filtering"""
    query = {}
    
    # If user is a rep, only show their calls
    if current_user["role"] == "rep":
        query["rep_id"] = current_user["id"]
    elif rep_id:  # Manager can filter by rep_id
        query["rep_id"] = rep_id
    
    calls = list(calls_collection.find(query).sort("call_date", -1).skip(skip).limit(limit))
    
    # Convert ObjectId to string for JSON serialization
    for call in calls:
        call["_id"] = str(call["_id"])
    
    return calls

@app.get("/api/calls/{call_id}")
async def get_call_detail(call_id: str, current_user = Depends(get_current_user)):
    """Get detailed call analysis"""
    call = calls_collection.find_one({"id": call_id})
    
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    # Check if user has access to this call
    if current_user["role"] == "rep" and call["rep_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    call["_id"] = str(call["_id"])
    return call

@app.get("/api/dashboard/manager/analytics")
async def get_manager_analytics(current_user = Depends(get_current_user)):
    """Get analytics data for manager dashboard"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")
    
    # Get all calls for analytics
    calls = list(calls_collection.find())
    
    # Calculate analytics
    total_calls = len(calls)
    reps = list(set(call["rep_name"] for call in calls))
    
    # Common objections
    all_objections = []
    for call in calls:
        if "key_objections" in call.get("analysis", {}):
            all_objections.extend(call["analysis"]["key_objections"])
    
    # Count objections
    objection_counts = {}
    for obj in all_objections:
        objection_counts[obj] = objection_counts.get(obj, 0) + 1
    
    # Sort by frequency
    common_objections = sorted(objection_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_calls": total_calls,
        "total_reps": len(reps),
        "rep_names": reps,
        "common_objections": [{"objection": obj, "count": count} for obj, count in common_objections],
        "recent_calls": len([call for call in calls if datetime.fromisoformat(call["call_date"].replace('Z', '+00:00')) > datetime.now().replace(tzinfo=None) - timedelta(days=7)])
    }

@app.get("/api/reps")
async def get_reps(current_user = Depends(get_current_user)):
    """Get list of sales reps for manager filtering"""
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Manager access required")
    
    reps = list(users_collection.find({"role": "rep"}, {"id": 1, "rep_name": 1, "username": 1}))
    for rep in reps:
        rep["_id"] = str(rep["_id"])
    
    return reps

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)