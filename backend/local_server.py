import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import os

# Load .env variables
try:
    with open('.env') as f:
        for line in f:
            if line.strip() and not line.startswith('#'):
                key, val = line.strip().split('=', 1)
                os.environ[key] = val
except Exception as e:
    print(f"Failed to load .env: {e}")

from lambdas.api_handler.app import handler

class LambdaHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def handle_request(self):
        url = urlparse(self.path)
        path = url.path
        if path.startswith('/api'):
            path = path[4:] # strip /api if present

        query_params = {k: v[0] for k, v in parse_qs(url.query).items()}
        
        body = ""
        if self.command == 'POST':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8') if content_length else ""

        event = {
            "httpMethod": self.command,
            "path": path,
            "queryStringParameters": query_params,
            "body": body,
            "pathParameters": {}
        }

        parts = path.strip('/').split('/')
        if len(parts) >= 2 and parts[0] == 'decision':
            event["pathParameters"]["decision_id"] = parts[1]
        elif len(parts) >= 3 and parts[0] == 'replay' and parts[1] == 'scenario':
            event["pathParameters"]["id"] = parts[2]

        print(f"Local Proxy -> {self.command} {path}")
        response = handler(event, None)
        
        status_code = response.get("statusCode", 500)
        body = response.get("body", "")
        headers = response.get("headers", {})
        
        self.send_response(status_code)
        for k, v in headers.items():
            if k.lower() not in ['access-control-allow-origin', 'access-control-allow-methods', 'access-control-allow-headers']:
                self.send_header(k, v)
        # Always allow CORS for local dev
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body.encode('utf-8'))

    def do_GET(self):
        self.handle_request()
        
    def do_POST(self):
        self.handle_request()

if __name__ == '__main__':
    port = 8000
    server_address = ('', port)
    httpd = HTTPServer(server_address, LambdaHandler)
    print(f"Starting local API mock on http://localhost:{port}/api")
    httpd.serve_forever()
