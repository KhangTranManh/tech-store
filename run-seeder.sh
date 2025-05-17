#!/bin/bash

# This script will set up and run the database seeder using Docker

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "❌ Error: Docker and Docker Compose are required to run this script"
    echo "Please install Docker and Docker Compose first"
    exit 1
fi

# Create necessary directory structure if it doesn't exist
mkdir -p db
mkdir -p models
mkdir -p mongodb_export

# Check if seedDatabase.js exists in the db directory
if [ ! -f "db/seedDatabase.js" ]; then
    echo "❌ Error: db/seedDatabase.js not found"
    echo "Please make sure your seed script is in the db directory"
    exit 1
fi

# Rename Dockerfile.seed to Dockerfile.seed if it doesn't exist
if [ ! -f "Dockerfile.seed" ] && [ -f "dockerfile-seed" ]; then
    mv dockerfile-seed Dockerfile.seed
fi

# Build and start the Docker containers
echo "🚀 Starting database and seeder containers..."
docker-compose up --build -d

# Follow the logs of the seeder service
echo "📋 Showing seeder logs..."
docker logs -f techstore-seeder

# Check if seeder exited with success
SEEDER_EXIT_CODE=$(docker inspect techstore-seeder --format='{{.State.ExitCode}}')

if [ "$SEEDER_EXIT_CODE" = "0" ]; then
  echo "✅ Database seeding completed successfully!"
  echo "📊 MongoDB is now running with seeded data"
  echo "🔌 MongoDB connection: mongodb://localhost:27017/techstore"
else
  echo "❌ Database seeding failed with exit code $SEEDER_EXIT_CODE"
  echo "Check the logs above for details"
fi

# Keep MongoDB running
echo ""
echo "The MongoDB container is still running."
echo "To stop it, run: docker-compose down"
echo "To view data in MongoDB, you can use MongoDB Compass with:"
echo "mongodb://localhost:27017/techstore"