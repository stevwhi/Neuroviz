import unittest
from app import app, query_openai_api, init_db, store_response, fetch_response
from flask_testing import TestCase
import requests_mock
import sqlite3
import os

class TestFlaskApi(TestCase):
    def create_app(self):
        app.config['TESTING'] = True
        return app
    
    def setUp(self):
   
        if os.path.exists('responses.db'):
            os.remove('responses.db')
        init_db() 

    def tearDown(self):
    
        if os.path.exists('responses.db'):
            os.remove('responses.db')

    @requests_mock.Mocker()
    def test_query_openai_api(self, mocker):
       
        mocker.post("https://api.openai.com/v1/chat/completions", json={"choices": [{"message": {"content": "Test response"}}]})
        response = query_openai_api("Test prompt")
        self.assertEqual(response["choices"][0]["message"]["content"], "Test response")

    def test_database_functions(self):
        
        store_response("Test prompt", "Test response")
        response = fetch_response()
        self.assertEqual(response, "Test response")

if __name__ == '__main__':
    unittest.main()