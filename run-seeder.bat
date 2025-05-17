@echo off
echo Stopping current techstore containers...
docker-compose down

echo Rebuilding and starting all services...
docker-compose up -d --build

echo Waiting for database seeding to complete...
docker logs -f techstore-seeder

echo Web application is now running at:
echo http://localhost:3000

echo Database is available at:
echo mongodb://localhost:27017/techstore

echo To check web application logs:
echo docker logs -f techstore-web