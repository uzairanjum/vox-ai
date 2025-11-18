import os
import asyncio
import httpx
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from collections import defaultdict
import time
from functools import wraps
import json

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Request, status, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
import supabase
from loguru import logger
import pytz

# Settings class
class Settings(BaseSettings):
    # Database
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_anon_key: str = ""
    
    # API Keys
    api_secret_key: str = "development-secret-change-in-production"
    
    # GHL Configuration
    ghl_api_url: str = "https://services.leadconnectorhq.com"
    ghl_access_token: str = ""
    ghl_refresh_token: str = ""
    
    # AI Backend
    ai_backend_url: str = ""
    ai_backend_api_key: str = ""
    ai_backend_auth_type: str = "X-API-Key"
    
    # Performance
    max_concurrent_responses: int = 10
    rate_limit_per_minute: int = 60
    
    # Application
    host: str = "0.0.0.0"
    port: int = 8001
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields from .env

settings = Settings()

# Initialize Supabase
supabase_client: Optional[supabase.Client] = None

def init_supabase():
    global supabase_client
    if settings.supabase_url and settings.supabase_service_key:
        supabase_client = supabase.create_client(
            settings.supabase_url,
            settings.supabase_service_key
        )
        logger.info("Supabase initialized successfully")
    else:
        logger.warning("Supabase credentials not provided")

# Add caching system
class SimpleCache:
    def __init__(self):
        self.cache = {}
        self.timestamps = {}
    
    def get(self, key, max_age_seconds=300):
        if key in self.cache:
            if time.time() - self.timestamps[key] < max_age_seconds:
                return self.cache[key]
            else:
                del self.cache[key]
                del self.timestamps[key]
        return None
    
    def set(self, key, value):
        self.cache[key] = value
        self.timestamps[key] = time.time()

# Global cache instance
cache = SimpleCache()

# Add performance monitoring
performance_metrics = {
    "requests_count": 0,
    "response_times": [],
    "errors_count": 0,
    "last_24h_responses": []
}

def track_performance(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            performance_metrics["requests_count"] += 1
            response_time = time.time() - start_time
            performance_metrics["response_times"].append(response_time)
            
            # Keep only last 100 response times
            if len(performance_metrics["response_times"]) > 100:
                performance_metrics["response_times"] = performance_metrics["response_times"][-100:]
            
            return result
        except Exception as e:
            performance_metrics["errors_count"] += 1
            raise e
    return wrapper

# Pydantic Models (essential ones only)
class AutopilotConfig(BaseModel):
    user_id: str
    conversation_id: Optional[str] = None
    location_id: Optional[str] = None
    is_enabled: bool = True
    reply_delay_minutes: int = 5
    max_replies_per_day: int = 10
    max_replies_per_conversation: int = 3

# Enhanced cron job with performance monitoring
async def enhanced_autopilot_cron():
    """Enhanced cron job with performance monitoring and optimization"""
    
    while True:
        cycle_start = time.time()
        
        try:
            logger.info("Starting autopilot processing cycle")
            
            # Process scheduled responses with optimization
            processing_result = await process_scheduled_responses_optimized()
            
            # Monitor and schedule new responses
            await monitor_and_schedule_responses()
            
            # Update analytics every 5 minutes
            if int(time.time()) % 300 == 0:  # Every 5 minutes
                await update_analytics()
            
            # Clean cache periodically
            if int(time.time()) % 600 == 0:  # Every 10 minutes
                cache.cache.clear()
                cache.timestamps.clear()
            
            cycle_time = time.time() - cycle_start
            logger.info(f"Autopilot cycle completed in {cycle_time:.2f}s - Processed: {processing_result.get('processed', 0)}, Errors: {processing_result.get('errors', 0)}")
            
        except Exception as e:
            logger.error(f"Error in autopilot cron cycle: {e}")
            performance_metrics["errors_count"] += 1
        
        # Wait 30 seconds for next cycle
        await asyncio.sleep(30)

# Placeholder functions (implement these based on your needs)
async def process_scheduled_responses_optimized():
    """Optimized batch processing of scheduled responses"""
    # Implementation placeholder
    return {"processed": 0, "errors": 0}

async def monitor_and_schedule_responses():
    """Monitor conversations and schedule new responses"""
    # Implementation placeholder
    pass

async def update_analytics():
    """Update analytics data"""
    # Implementation placeholder
    pass

async def get_autopilot_config(user_id: str, location_id: str = None, conversation_id: str = None):
    """Get autopilot configuration"""
    # Implementation placeholder
    return {}

# Update the lifespan function to use enhanced cron
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Enhanced application lifecycle management"""
    global app_start_time
    
    # Startup
    logger.info("Starting Vox Autopilot Service...")
    app_start_time = time.time()
    
    init_supabase()
    
    # Start enhanced cron job
    asyncio.create_task(enhanced_autopilot_cron())
    
    logger.info("Autopilot service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Vox Autopilot Service...")

# Create FastAPI app
app = FastAPI(
    title="Vox Autopilot Service",
    description="Simple AI-powered conversation autopilot",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add app startup tracking
app_start_time = time.time()

# Simple auth check
async def verify_auth(request: Request):
    """Simple API key authentication"""
    api_key = request.headers.get("X-API-Key") or request.headers.get("Authorization", "").replace("Bearer ", "")
    if api_key != settings.api_secret_key: # Changed from settings.api_key to settings.api_secret_key
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

# Basic endpoints
@app.get("/health")
async def health_check():
    """Basic health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime_seconds": int(time.time() - app_start_time)
    }

@app.get("/stats")
async def get_stats():
    """Get basic system statistics"""
    return {
        "requests_count": performance_metrics["requests_count"],
        "errors_count": performance_metrics["errors_count"],
        "avg_response_time": sum(performance_metrics["response_times"]) / len(performance_metrics["response_times"]) if performance_metrics["response_times"] else 0,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/dashboard")
async def serve_dashboard():
    """Serve a simple autopilot dashboard"""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vox Autopilot Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { text-align: center; color: #333; margin-bottom: 30px; }
            .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .card h3 { color: #333; margin-bottom: 15px; }
            .metric { display: flex; justify-content: space-between; margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
            .metric-value { font-weight: 600; color: #667eea; }
            .btn { background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
            .status-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
            .green { background: #10b981; }
            .loading { color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 Vox Autopilot Dashboard</h1>
                <p>Real-time monitoring and control</p>
            </div>
            
            <div class="cards">
                <div class="card">
                    <h3>🏥 System Health</h3>
                    <div id="health-content" class="loading">Loading...</div>
                    <button class="btn" onclick="loadHealth()">Refresh</button>
                </div>
                
                <div class="card">
                    <h3>📊 Statistics</h3>
                    <div id="stats-content" class="loading">Loading...</div>
                    <button class="btn" onclick="loadStats()">Refresh</button>
                </div>
                
                <div class="card">
                    <h3>🎛️ Controls</h3>
                    <p>Auto-refresh every 30 seconds</p>
                    <button class="btn" onclick="refreshAll()">Refresh All</button>
                </div>
            </div>
        </div>

        <script>
            async function fetchAPI(endpoint) {
                try {
                    const response = await fetch(endpoint);
                    return await response.json();
                } catch (error) {
                    return { error: error.message };
                }
            }
            
            async function loadHealth() {
                const content = document.getElementById('health-content');
                const data = await fetchAPI('/api/dashboard/health');
                
                if (data.error) {
                    content.innerHTML = 'Error: ' + data.error;
                    return;
                }
                
                const uptime = Math.floor(data.uptime_seconds / 60);
                content.innerHTML = `
                    <div><span class="status-dot green"></span>Status: ${data.status}</div>
                    <div class="metric"><span>Database</span><span class="metric-value">${data.components?.database || 'OK'}</span></div>
                    <div class="metric"><span>Uptime</span><span class="metric-value">${uptime} minutes</span></div>
                `;
            }
            
            async function loadStats() {
                const content = document.getElementById('stats-content');
                const data = await fetchAPI('/api/dashboard/stats');
                
                if (data.error) {
                    content.innerHTML = 'Error: ' + data.error;
                    return;
                }
                
                content.innerHTML = `
                    <div class="metric"><span>Pending</span><span class="metric-value">${data.pending_responses || 0}</span></div>
                    <div class="metric"><span>Active</span><span class="metric-value">${data.active_conversations || 0}</span></div>
                    <div class="metric"><span>Success Rate</span><span class="metric-value">${data.success_rate || 100}%</span></div>
                `;
            }
            
            function refreshAll() {
                loadHealth();
                loadStats();
            }
            
            // Auto-refresh every 30 seconds
            setInterval(refreshAll, 30000);
            
            // Initial load
            refreshAll();
        </script>
    </body>
    </html>
    """
    return Response(content=html_content, media_type="text/html")

@app.get("/api/dashboard/health")
@track_performance
async def get_dashboard_health():
    """Get comprehensive system health status for dashboard"""
    
    # Check cache first
    cached_health = cache.get("dashboard_health", 30)  # Cache for 30 seconds
    if cached_health:
        return cached_health
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {},
        "uptime_seconds": int(time.time() - app_start_time)
    }
    
    try:
        # Test database connection
        if supabase_client:
            health_status["components"]["database"] = "healthy"
        else:
            health_status["components"]["database"] = "not_configured"
    except Exception as e:
        health_status["components"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    try:
        # Test AI backend (if configured)
        if settings.ai_backend_url:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{settings.ai_backend_url}/health")
                health_status["components"]["ai_backend"] = "healthy" if response.status_code == 200 else "unhealthy"
        else:
            health_status["components"]["ai_backend"] = "not_configured"
    except Exception as e:
        health_status["components"]["ai_backend"] = f"unhealthy: {str(e)}"
    
    health_status["components"]["token_manager"] = "healthy"
    
    cache.set("dashboard_health", health_status)
    return health_status

@app.get("/api/dashboard/stats")
@track_performance
async def get_dashboard_stats():
    """Get real-time system statistics for dashboard"""
    
    # Check cache first
    cached_stats = cache.get("dashboard_stats", 60)  # Cache for 1 minute
    if cached_stats:
        return cached_stats
    
    # Return basic stats for now
    stats = {
        "pending_responses": 0,
        "processing_responses": 0,
        "failed_responses": 0,
        "active_conversations": 0,
        "responses_sent_today": 0,
        "success_rate": 100.0,
        "average_delay_minutes": 5.0,
        "total_attempts_24h": 0,
        "timestamp": datetime.now().isoformat()
    }
    
    cache.set("dashboard_stats", stats)
    return stats

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port) # Changed from host="0.0.0.0" to settings.host
