#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PORT=5000

echo -e "${YELLOW}🔍 Checking for processes on port ${PORT}...${NC}"

# Find and kill processes using port 5000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Found process using port ${PORT}${NC}"
    PIDS=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    echo -e "${RED}🔪 Killing process(es): ${PIDS}${NC}"
    kill -9 $PIDS 2>/dev/null
    sleep 1
    echo -e "${GREEN}✅ Port ${PORT} is now free${NC}"
else
    echo -e "${GREEN}✅ Port ${PORT} is available${NC}"
fi

# Also kill any lingering node server processes
if pgrep -f "node.*server" > /dev/null 2>&1; then
    echo -e "${YELLOW}🔪 Killing lingering node server processes...${NC}"
    pkill -f "node.*server"
    sleep 1
fi

echo -e "${GREEN}🚀 Starting server on port ${PORT}...${NC}"
nodemon server.js
