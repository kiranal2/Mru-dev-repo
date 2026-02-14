#!/bin/bash

# ============================================
# Docker Commands for Meeru Frontend
# ============================================

echo "=== Docker Commands for Meeru Frontend ==="
echo ""

# 1. BUILD THE DOCKER IMAGE
echo "1. BUILD IMAGE:"
echo "   docker build -t meeru-frontend:latest ."
echo ""

# 2. RUN THE CONTAINER
echo "2. RUN CONTAINER (detached mode):"
echo "   docker run -d -p 3000:3000 --name meeru-frontend meeru-frontend:latest"
echo ""

# 3. RUN WITH ENVIRONMENT VARIABLES (if needed)
echo "3. RUN WITH ENV VARIABLES:"
echo "   docker run -d -p 3000:3000 \\"
echo "     -e API_BASE_URL='http://your-api-url' \\"
echo "     --name meeru-frontend meeru-frontend:latest"
echo ""

# 4. CHECK CONTAINER STATUS
echo "4. CHECK CONTAINER STATUS:"
echo "   docker ps --filter 'name=meeru-frontend'"
echo "   docker ps -a --filter 'name=meeru-frontend'"
echo ""

# 5. VIEW CONTAINER LOGS
echo "5. VIEW LOGS:"
echo "   docker logs meeru-frontend"
echo "   docker logs -f meeru-frontend          # Follow logs (live)"
echo "   docker logs --tail 50 meeru-frontend  # Last 50 lines"
echo ""

# 6. HEALTH CHECK COMMANDS
echo "6. HEALTH CHECK:"
echo "   # Check container health status"
echo "   docker inspect --format='{{.State.Health.Status}}' meeru-frontend"
echo ""
echo "   # Test health endpoint from host"
echo "   curl -v http://localhost:3000/health"
echo "   curl -4 http://127.0.0.1:3000/health"
echo ""
echo "   # Test health endpoint from inside container"
echo "   docker exec meeru-frontend curl -f http://localhost:3000/health"
echo ""

# 7. TEST APPLICATION ENDPOINTS
echo "7. TEST APPLICATION:"
echo "   # Health endpoint"
echo "   curl http://localhost:3000/health"
echo ""
echo "   # Root endpoint"
echo "   curl -I http://localhost:3000/"
echo ""
echo "   # Open in browser"
echo "   open http://localhost:3000"
echo ""

# 8. INSPECT CONTAINER
echo "8. INSPECT CONTAINER:"
echo "   # Container details"
echo "   docker inspect meeru-frontend"
echo ""
echo "   # Port mapping"
echo "   docker port meeru-frontend"
echo ""
echo "   # Container IP"
echo "   docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' meeru-frontend"
echo ""

# 9. EXECUTE COMMANDS INSIDE CONTAINER
echo "9. EXECUTE COMMANDS:"
echo "   # Open shell"
echo "   docker exec -it meeru-frontend sh"
echo ""
echo "   # Check environment variables"
echo "   docker exec meeru-frontend env | grep -E 'PORT|HOSTNAME|NODE_ENV'"
echo ""
echo "   # Check processes"
echo "   docker exec meeru-frontend ps aux"
echo ""
echo "   # Check listening ports"
echo "   docker exec meeru-frontend netstat -tlnp"
echo ""

# 10. STOP AND REMOVE CONTAINER
echo "10. STOP AND REMOVE:"
echo "    # Stop container"
echo "    docker stop meeru-frontend"
echo ""
echo "    # Remove container"
echo "    docker rm meeru-frontend"
echo ""
echo "    # Stop and remove in one command"
echo "    docker stop meeru-frontend && docker rm meeru-frontend"
echo ""

# 11. CLEANUP
echo "11. CLEANUP:"
echo "    # Remove image"
echo "    docker rmi meeru-frontend:latest"
echo ""
echo "    # Remove all stopped containers"
echo "    docker container prune"
echo ""
echo "    # Remove unused images"
echo "    docker image prune"
echo ""

# 12. RESTART CONTAINER
echo "12. RESTART:"
echo "    docker restart meeru-frontend"
echo ""

# 13. VIEW RESOURCE USAGE
echo "13. RESOURCE USAGE:"
echo "    docker stats meeru-frontend"
echo ""

echo "=== End of Commands ==="

