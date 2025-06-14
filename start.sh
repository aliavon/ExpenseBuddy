#!/bin/bash

echo "Starting docker-compose..."
if [ "$1" == "--dev" ];
  then echo "Starting dev version of the app..."
       docker-compose -f docker-compose.dev.yml down --remove-orphans && docker-compose -f docker-compose.dev.yml up -d --build
  else docker-compose down && docker-compose up -d --build
fi
echo ""
echo "🚀 App is running!"
echo ""

# Получаем IP адрес машины
MACHINE_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "📱 Access your app:"
echo "   • Main App:    http://$MACHINE_IP:8080"
echo "   • GraphQL:     http://$MACHINE_IP:8080/graphql"
echo "   • Direct Frontend: http://$MACHINE_IP:3000"
echo "   • Direct Backend:  http://$MACHINE_IP:8000/graphql"
echo ""
echo "💡 For mobile access, use the IP addresses above"
echo "💡 Type 'docker-compose logs <container_name>' to see logs"
echo ""
