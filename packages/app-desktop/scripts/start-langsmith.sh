#!/bin/bash

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker first."
    exit 1
fi

# Create a network for LangSmith
docker network create langsmith 2>/dev/null || true

# Start LangSmith
docker run -d \
    --name langsmith \
    --network langsmith \
    -p 1984:1984 \
    -e LANGCHAIN_ENV=local_deployment \
    -e LANGSMITH_LICENSE_KEY=not-needed-for-local \
    ghcr.io/langchain-ai/langsmith:latest

echo "LangSmith is now running at http://localhost:1984"
echo ""
echo "Add the following to your .env file:"
echo ""
echo "# LangSmith Configuration"
echo "LANGCHAIN_ENDPOINT=http://localhost:1984"
echo "LANGCHAIN_API_KEY=not-needed-for-local"
echo "LANGCHAIN_PROJECT=joplin-chat"
echo ""
echo "# LLM Configuration"
echo "LANGCHAIN_MODEL=gpt-3.5-turbo        # The model to use for chat"
echo "LANGCHAIN_TEMPERATURE=0.7           # Controls randomness (0.0-1.0)"
echo "LANGCHAIN_MAX_TOKENS=1000           # Maximum tokens per response"
