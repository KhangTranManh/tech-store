@echo off
echo Stopping all containers...
docker-compose down

echo Rebuilding and starting containers...
docker-compose up --build -d

echo Waiting for containers to start...
timeout /t 10 /nobreak > nul

echo Checking container status:
docker ps -a

echo Checking if web container is running:
docker logs techstore-web --tail 20

echo Checking ngrok connection:
docker logs techstore-ngrok --tail 20

echo Your ngrok URL is:
docker exec techstore-ngrok ngrok api tunnels list | findstr public_url

echo.
echo If your web app isn't connecting properly, try testing:
echo   1. In your browser: http://localhost:3000
echo   2. From inside the web container: docker exec techstore-web curl http://localhost:3000
echo.
echo To see logs: 
echo   docker logs techstore-web
echo   docker logs techstore-ngrok