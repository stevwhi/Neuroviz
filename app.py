import os
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import logging

#environment variable
load_dotenv()

app = Flask(__name__)
CORS(app)  


OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'  

last_three_responses = []

logging.basicConfig(level=logging.DEBUG)

def query_openai_api(prompt):
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-3.5-turbo",  
        "messages": [{"role": "user", "content": prompt}]
    }
    try:
        response = requests.post(OPENAI_API_URL, headers=headers, json=data)
        response.raise_for_status()  
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        logging.error(f'HTTP error occurred: {http_err} - {response.text}')
    except Exception as err:
        logging.error(f'Other error occurred: {err}')

    return None  

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

def maintain_db_size():
    conn = sqlite3.connect('responses.db')
    cursor = conn.cursor()

   
    cursor.execute('SELECT COUNT(*) FROM api_responses')
    count = cursor.fetchone()[0]

    #more than 20 = delete oldest
    if count > 20:
        delete_count = count - 20
        
        cursor.execute('''
            SELECT rowid FROM api_responses
            ORDER BY timestamp ASC
            LIMIT ?
        ''', (delete_count,))
       
        rows_to_delete = cursor.fetchall()
        
        cursor.execute('''
            DELETE FROM api_responses
            WHERE rowid IN (%s)
        ''' % ','.join('?'*len(rows_to_delete)), [row[0] for row in rows_to_delete])

    conn.commit()
    conn.close()

def store_response(prompt, response):
    conn = sqlite3.connect('responses.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO api_responses (prompt, response) VALUES (?, ?)', (prompt, response))
    conn.commit()
    conn.close()
    maintain_db_size()

def fetch_response():
    global last_three_responses

    conn = sqlite3.connect('responses.db')
    cursor = conn.cursor()


    query = '''
    SELECT id, response FROM api_responses 
    WHERE id NOT IN (?, ?, ?)
    ORDER BY RANDOM() LIMIT 1
    '''
    cursor.execute(query, last_three_responses + [-1] * (3 - len(last_three_responses))) 
    
    row = cursor.fetchone()
    conn.close()

    if row:
        response_id, response_text = row

       
        last_three_responses.append(response_id)
        if len(last_three_responses) > 3:
            last_three_responses.pop(0)

        return response_text

    return None

@app.route('/generate-question', methods=['POST'])
def generate_question():
    try:
        data = request.json
        prompt = data['prompt']
        
        offline_mode = data.get('offline_mode', False)
        
        if not offline_mode:
            response = query_openai_api(prompt)
            if response:
                store_response(prompt, response['choices'][0]['message']['content'])
                return jsonify(response)
            else:
                
                logging.error('Failed to get a response from the OpenAI API.')
                return jsonify({"error": "Failed to get response from OpenAI API"}), 503
        
        
        stored_response = fetch_response()
        if stored_response:
            return jsonify({"choices": [{"message": {"content": stored_response}}]})
        else:
            return jsonify({"error": "No response available in offline mode"}), 404

    except Exception as e:
        logging.exception("An unexpected error occurred.")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)


