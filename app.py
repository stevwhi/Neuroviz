import os
import sqlite3
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

def init_db():
    conn = sqlite3.connect('responses.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS api_responses (
            id INTEGER PRIMARY KEY,
            prompt TEXT,
            response TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    ''')
    conn.commit()
    conn.close()

def store_response(prompt, response):
    conn = sqlite3.connect('responses.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO api_responses (prompt, response) VALUES (?, ?)', (prompt, response))
    conn.commit()
    conn.close()

def fetch_response():
    conn = sqlite3.connect('responses.db')
    cursor = conn.cursor()
    cursor.execute('SELECT response FROM api_responses ORDER BY RANDOM() LIMIT 1')
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

@app.route('/generate-question', methods=['POST'])
def generate_question():
    try:
        data = request.json
        prompt = data['prompt']
        
        # Check for offline mode
        offline_mode = data.get('offline_mode', False)
        
        if not offline_mode:
            try:
                response = query_openai_api(prompt)
                print(response)
                store_response(prompt, response['choices'][0]['message']['content'])
                return jsonify(response)
            except requests.exceptions.RequestException as e:
                print("Error querying OpenAI API:", e)
                return jsonify({"error": "OpenAI API not accessible", "details": str(e)}), 503
        
        # Try fetching from database if API fails or in offline mode
        stored_response = fetch_response()
        if stored_response:
            return jsonify({"choices": [{"message": {"content": stored_response}}]})
        else:
            return jsonify({"error": "No response available in offline mode"}), 404

    except Exception as e:
        print("An unexpected error occurred:", e)
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)


