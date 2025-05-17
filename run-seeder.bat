@echo off
echo Starting MongoDB, seeder, web application, and ngrok containers...
docker-compose up --build -d

echo Showing seeder logs...
docker logs -f techstore-seeder

echo Web application is running at: http://localhost:3000

echo Waiting for ngrok to establish the tunnel...
timeout /t 5 /nobreak > nul

echo Public ngrok URL (check http://localhost:4040 in your browser to view it)
echo Ngrok dashboard available at: http://localhost:4040

echo.
echo To stop all containers, run: docker-compose down