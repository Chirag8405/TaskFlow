#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Real-Time Task Manager - Development Setup    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Function to cleanup processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    
    # Kill server processes
    if pgrep -f "node.*server" > /dev/null 2>&1; then
        echo -e "${RED}🔪 Stopping backend server...${NC}"
        pkill -f "node.*server"
    fi
    
    # Kill vite processes
    if pgrep -f "vite" > /dev/null 2>&1; then
        echo -e "${RED}🔪 Stopping frontend server...${NC}"
        pkill -f "vite"
    fi
    
    # Kill port 5000
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        lsof -Pi :5000 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    
    # Kill port 5173
    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        lsof -Pi :5173 -sTCP:LISTEN -t | xargs kill -9 2>/dev/null
    fi
    
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Trap CTRL+C and call cleanup
trap cleanup INT TERM

# Step 1: Clean up any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
cleanup

echo -e "\n${BLUE}📦 Checking dependencies...${NC}"

# Check if node_modules exist
if [ ! -d "server/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Server dependencies not found. Installing...${NC}"
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Client dependencies not found. Installing...${NC}"
    cd client && npm install && cd ..
fi

echo -e "${GREEN}✅ Dependencies ready${NC}\n"

# Step 2: Start MongoDB (if using local)
echo -e "${BLUE}🍃 Checking MongoDB...${NC}"
if command -v mongod &> /dev/null; then
    if ! pgrep -x "mongod" > /dev/null; then
        echo -e "${YELLOW}⚠️  MongoDB not running. Start it with: sudo systemctl start mongod${NC}"
    else
        echo -e "${GREEN}✅ MongoDB is running${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  MongoDB not found locally (using MongoDB Atlas?)${NC}"
fi

echo ""

# Step 3: Start Backend Server
echo -e "${GREEN}🚀 Starting Backend Server (Port 5000)...${NC}"
cd server
npm run dev > ../server.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ps -p $BACKEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Backend server started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend server failed to start. Check server.log${NC}"
    exit 1
fi

echo ""

# Step 4: Start Frontend Server
echo -e "${GREEN}🎨 Starting Frontend Server (Port 5173)...${NC}"
cd client
npm run dev > ../client.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${GREEN}✅ Frontend server started (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start. Check client.log${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            🎉 All Systems Running! 🎉            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}🌐 Frontend:${NC}  http://localhost:5173"
echo -e "${GREEN}🔌 Backend:${NC}   http://localhost:5000"
echo -e "${GREEN}📊 API Docs:${NC}  http://localhost:5000/api"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "   Backend:  tail -f server.log"
echo -e "   Frontend: tail -f client.log"
echo ""
echo -e "${RED}Press CTRL+C to stop all servers${NC}"
echo ""

# Keep script running and show combined logs
tail -f server.log client.log
