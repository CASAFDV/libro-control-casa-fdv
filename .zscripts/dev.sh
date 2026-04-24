#!/bin/bash
cd /home/z/my-project

# Start the production server
echo "Starting production server..."
NODE_ENV=production node .next/standalone/server.js &
SERVER_PID=$!

# Wait for server to be ready
for i in $(seq 1 30); do
  if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "Server is ready on port 3000"
    break
  fi
  sleep 1
done

# Keep the script running
wait $SERVER_PID
