# Matrix Chat Interface with n8n Integration

A Matrix-themed chat interface that connects to ChatGPT through n8n webhooks, deployed on Vercel.

![Matrix Chat Interface](https://img.shields.io/badge/Status-Production%20Ready-green)
![Security](https://img.shields.io/badge/Security-Environment%20Variables-blue)
![Deployment](https://img.shields.io/badge/Deployment-Vercel-black)

## 🚀 Features

- **Matrix-themed UI** with animated background effects
- **Real-time chat** with ChatGPT via n8n webhooks
- **Secure deployment** with environment variables
- **Responsive design** that works on all devices
- **Session management** for conversation continuity
- **Production-ready** with automatic HTTPS

## 🏗️ Architecture

```
Frontend (Vercel) → Serverless API → n8n Webhook → ChatGPT → Response
```

## 📦 Project Structure

```
├── api/
│   └── webhook-proxy.py      # Vercel serverless function
├── public/
│   ├── index.html           # Matrix chat interface
│   ├── script.js            # Frontend logic
│   └── styles.css           # Matrix styling
├── vercel.json              # Vercel configuration
├── requirements.txt         # Python dependencies
├── .env.example            # Environment variables template
└── README.md               # This file
```

## 🔧 Setup & Deployment

### Prerequisites

1. **n8n instance** with a publicly accessible webhook
2. **GitHub account** for repository hosting
3. **Vercel account** for deployment

### Step 1: Clone & Configure

```bash
# Clone your repository
git clone https://github.com/yourusername/matrix-chat.git
cd matrix-chat

# Copy environment template
cp .env.example .env.local

# Edit with your n8n webhook URL
# N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Connect your GitHub repo to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push

### Step 3: Environment Variables

In your Vercel dashboard, set:

| Variable | Value | Example |
|----------|-------|---------|
| `N8N_WEBHOOK_URL` | Your n8n webhook URL | `https://app.n8n.cloud/webhook/abc123` |

## 🔒 Security Features

✅ **No exposed API keys** - All sensitive data in environment variables
✅ **CORS protection** - Configured for your domain
✅ **Input validation** - Sanitized user inputs
✅ **HTTPS enforcement** - Automatic with Vercel
✅ **Environment isolation** - Separate dev/prod configs

## 🌐 n8n Webhook Setup

Your n8n workflow should:

1. **Accept GET requests** with query parameters:
   - `message` - User's chat message
   - `timestamp` - Message timestamp
   - `sessionId` - Conversation session ID

2. **Return JSON response**:
   ```json
   {
     "text": "ChatGPT response message here"
   }
   ```

### Example n8n Workflow
```
Webhook Trigger → ChatGPT Node → Response Node
```

## 🛠️ Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start local development server
python server.py

# In another terminal, serve frontend
python -m http.server 3000

# Access at http://localhost:3000
```

## 🚀 Production URLs

After deployment, your app will be available at:
- **Frontend**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.vercel.app/api/webhook-proxy/health`

## 📱 Usage

1. **Open the chat interface** in your browser
2. **Type your message** in the input field
3. **Press Enter** or click "TRANSMIT"
4. **Receive AI responses** from ChatGPT via n8n

## 🔧 Configuration

The interface automatically detects production vs development:

- **Production**: Uses `/api/webhook-proxy` (Vercel function)
- **Development**: Uses `http://localhost:8080/webhook-proxy`

## 🐛 Troubleshooting

### Common Issues

1. **"Connection error"**
   - Check n8n webhook URL is publicly accessible
   - Verify environment variable is set correctly

2. **"Internal server error"**
   - Check Vercel function logs
   - Ensure n8n workflow is active

3. **CORS errors**
   - Verify domain configuration in Vercel

### Debug Commands

```bash
# Test n8n webhook directly
curl "https://your-n8n-webhook-url?message=test&timestamp=2024-01-01&sessionId=debug"

# Check Vercel function health
curl https://your-app.vercel.app/api/webhook-proxy/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check this README for common solutions
- **n8n Community**: For workflow-specific questions

---

**🤖 Generated with Claude Code**
*Secure • Fast • Production-Ready*