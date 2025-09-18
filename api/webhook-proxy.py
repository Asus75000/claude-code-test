"""
Vercel serverless function for proxying chat messages to n8n webhook.
This function receives POST requests from the frontend and forwards them as GET requests to n8n.
"""

import json
import urllib.request
import urllib.parse
import os
from datetime import datetime
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_POST(self):
        """Handle POST requests from the frontend."""
        try:
            # Only allow POST to the correct path
            if self.path != '/api/webhook-proxy':
                self._send_json_response(404, {'error': 'Endpoint not found'})
                return

            # Get n8n webhook URL from environment variables
            n8n_webhook_url = os.environ.get('N8N_WEBHOOK_URL')
            if not n8n_webhook_url:
                self._send_json_response(500, {
                    'error': 'N8N_WEBHOOK_URL environment variable not configured'
                })
                return

            # Read the request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)

            # Parse JSON data
            try:
                request_data = json.loads(post_data.decode('utf-8'))
                message = request_data.get('message', '')
                timestamp = request_data.get('timestamp', datetime.now().isoformat())
                session_id = request_data.get('sessionId', 'unknown')

            except json.JSONDecodeError as e:
                self._send_json_response(400, {'error': 'Invalid JSON format'})
                return

            # Forward to n8n webhook as GET request with query parameters
            query_params = urllib.parse.urlencode({
                'message': message,
                'timestamp': timestamp,
                'sessionId': session_id
            })

            n8n_url = f"{n8n_webhook_url}?{query_params}"

            try:
                # Make GET request to n8n
                with urllib.request.urlopen(n8n_url, timeout=10) as response:
                    # Try different encodings to handle special characters
                    raw_response = response.read()
                    try:
                        n8n_response = raw_response.decode('utf-8')
                    except UnicodeDecodeError:
                        n8n_response = raw_response.decode('latin-1')

                    # Default message if n8n returns empty response
                    if not n8n_response or n8n_response.strip() == '':
                        bot_message = 'Message received by n8n (empty response)'
                    else:
                        # Try to parse n8n response as JSON, fallback to text
                        try:
                            n8n_data = json.loads(n8n_response)
                            # n8n returns JSON with 'text' field
                            bot_message = n8n_data.get('text') or n8n_data.get('response') or n8n_response
                        except json.JSONDecodeError:
                            # If not JSON, use raw response as message
                            bot_message = n8n_response

                    response_data = {
                        'success': True,
                        'response': bot_message,
                        'timestamp': datetime.now().isoformat()
                    }

                    self._send_json_response(200, response_data)

            except urllib.error.URLError as e:
                error_response = {
                    'success': False,
                    'error': f'Failed to connect to n8n webhook: {str(e)}',
                    'response': 'Connection to neural network failed. Please check n8n service.'
                }
                self._send_json_response(502, error_response)

            except Exception as e:
                error_response = {
                    'success': False,
                    'error': f'Server error: {str(e)}',
                    'response': 'Internal server error occurred.'
                }
                self._send_json_response(500, error_response)

        except Exception as e:
            self._send_json_response(500, {'error': 'Internal server error'})

    def do_GET(self):
        """Handle GET requests (for health check)."""
        if self.path == '/api/webhook-proxy/health':
            self._send_json_response(200, {
                'status': 'healthy',
                'service': 'n8n-webhook-proxy',
                'timestamp': datetime.now().isoformat(),
                'environment': 'production' if os.environ.get('VERCEL') else 'development'
            })
        else:
            self._send_json_response(404, {'error': 'Endpoint not found'})

    def _set_cors_headers(self):
        """Set CORS headers for cross-origin requests."""
        # In production, you might want to restrict this to your domain
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def _send_json_response(self, status_code, data):
        """Send a JSON response."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))