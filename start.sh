#!/bin/bash

echo "Starting docker-compose..."
if [ "$1" == "--dev" ];
  then echo "Starting dev version of the app..."
       docker-compose -f docker-compose.dev.yml down --remove-orphans && docker-compose -f docker-compose.dev.yml up -d --build
  else docker-compose down && docker-compose up -d --build
fi
echo "App is running!"
echo "Type 'docker-compose logs <container_name>' to see logs"
