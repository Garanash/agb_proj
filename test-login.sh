#!/bin/bash

cd backend
export $(cat ../config/env/local.env | grep -v '^#' | xargs)
python3 -c "
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print('Testing login endpoint...')
response = client.post('/api/v1/auth/login', json={'username': 'admin', 'password': 'admin123'})
print(f'Status: {response.status_code}')
print(f'Response: {response.json()}')
"

