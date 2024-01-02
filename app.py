import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

# Environment variable for OpenAI API key
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'  # You can choose different engines

def query_openai_api(prompt):
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-3.5-turbo",  # Example model
        "messages": [{"role": "user", "content": prompt}]
    }
    response = requests.post(OPENAI_API_URL, headers=headers, json=data)
    
    return response.json()

@app.route('/generate-question', methods=['POST'])
def generate_question():
    data = request.json
    prompt = data['prompt']
    response = query_openai_api(prompt)
    print(response)
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Specify a port if needed