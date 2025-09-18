// Configuration
// Use production API endpoint when deployed, localhost for development
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const defaultWebhookUrl = isProduction
    ? '/api/webhook-proxy'  // Vercel serverless function
    : 'http://localhost:8080/webhook-proxy';  // Local development

let webhookUrl = localStorage.getItem('n8nWebhookUrl') || defaultWebhookUrl;

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const typingIndicator = document.getElementById('typingIndicator');
const connectionStatus = document.getElementById('connectionStatus');
const currentTime = document.getElementById('currentTime');
const settingsButton = document.getElementById('settingsButton');
const configModal = document.getElementById('configModal');
const webhookUrlInput = document.getElementById('webhookUrl');
const saveConfigButton = document.getElementById('saveConfig');
const closeConfigButton = document.getElementById('closeConfig');

// Matrix Rain Canvas
const canvas = document.getElementById('matrix-rain');
const ctx = canvas.getContext('2d');

// Matrix Rain Configuration
let matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
matrix = matrix.split("");

let font_size = 10;
let columns;
let drops = [];

// Initialize Matrix Rain
function initializeMatrixRain() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    columns = canvas.width / font_size;
    drops = [];

    for (let x = 0; x < columns; x++) {
        drops[x] = Math.floor(Math.random() * canvas.height / font_size);
    }
}

// Draw Matrix Rain
function drawMatrixRain() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#00ff41';
    ctx.font = font_size + 'px monospace';

    for (let i = 0; i < drops.length; i++) {
        const text = matrix[Math.floor(Math.random() * matrix.length)];
        ctx.fillText(text, i * font_size, drops[i] * font_size);

        if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

// Initialize and animate Matrix Rain
initializeMatrixRain();
setInterval(drawMatrixRain, 35);

// Resize handler for Matrix Rain
window.addEventListener('resize', initializeMatrixRain);

// Update current time
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    currentTime.textContent = timeString;
}

updateTime();
setInterval(updateTime, 1000);

// Message handling functions
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);

    // Remove welcome message if it exists
    const welcomeMessage = document.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => welcomeMessage.remove(), 500);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Add typing effect for bot messages
    if (!isUser) {
        contentDiv.classList.add('typing-text');
        setTimeout(() => {
            contentDiv.classList.remove('typing-text');
        }, content.length * 20);
    }
}

// Send message to API endpoint
async function sendToAPI(message) {
    if (!webhookUrl) {
        addMessage("⚠ Please configure your webhook URL in settings", false);
        return;
    }

    typingIndicator.classList.add('active');
    connectionStatus.textContent = 'TRANSMITTING...';

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                timestamp: new Date().toISOString(),
                sessionId: getSessionId()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Handle the response from the API/n8n
        const botResponse = data.response || data.message || "Response received from neural network";

        setTimeout(() => {
            addMessage(botResponse, false);
            typingIndicator.classList.remove('active');
            connectionStatus.textContent = 'CONNECTED';
        }, 1000);

    } catch (error) {
        console.error('Error sending message to API:', error);
        typingIndicator.classList.remove('active');
        connectionStatus.textContent = 'CONNECTION ERROR';

        setTimeout(() => {
            addMessage(`⚠ Connection error: ${error.message}. Please check your configuration.`, false);
            connectionStatus.textContent = 'DISCONNECTED';
        }, 500);

        setTimeout(() => {
            connectionStatus.textContent = 'CONNECTED';
        }, 3000);
    }
}

// Get or create session ID
function getSessionId() {
    let sessionId = sessionStorage.getItem('chatSessionId');
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('chatSessionId', sessionId);
    }
    return sessionId;
}

// Send message handler
function sendMessage() {
    const message = messageInput.value.trim();

    if (!message) return;

    addMessage(message, true);
    messageInput.value = '';

    // Send to API
    sendToAPI(message);
}

// Event Listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Settings modal handlers
settingsButton.addEventListener('click', () => {
    webhookUrlInput.value = webhookUrl;
    configModal.classList.add('active');
});

closeConfigButton.addEventListener('click', () => {
    configModal.classList.remove('active');
});

saveConfigButton.addEventListener('click', () => {
    const newUrl = webhookUrlInput.value.trim();
    if (newUrl) {
        webhookUrl = newUrl;
        localStorage.setItem('n8nWebhookUrl', webhookUrl);
        configModal.classList.remove('active');

        // Show success message
        addMessage("✓ Webhook configuration saved successfully", false);
        connectionStatus.textContent = 'CONNECTED';
    } else {
        alert('Please enter a valid webhook URL');
    }
});

// Close modal when clicking outside
configModal.addEventListener('click', (e) => {
    if (e.target === configModal) {
        configModal.classList.remove('active');
    }
});

// Add CSS animation for fadeOut
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }
`;
document.head.appendChild(style);

// Focus on input when page loads
window.addEventListener('load', () => {
    messageInput.focus();

    // Show appropriate welcome message based on environment
    if (isProduction) {
        setTimeout(() => {
            addMessage("👋 Welcome to Matrix Chat! Your neural network is online and ready for communication.", false);
        }, 1500);
    } else {
        // Check if webhook is configured for development
        if (webhookUrl === defaultWebhookUrl) {
            setTimeout(() => {
                addMessage("👋 Welcome! Development mode active. Make sure your local webhook proxy is running: python server.py", false);
            }, 1500);
        } else if (!webhookUrl) {
            setTimeout(() => {
                addMessage("👋 Welcome! Please configure your webhook URL by clicking the settings button (⚙) in the top right corner.", false);
            }, 1500);
        }
    }
});

// Terminal control buttons functionality
document.querySelector('.control.close').addEventListener('click', () => {
    if (confirm('Exit Matrix Chat Interface?')) {
        window.close();
    }
});

document.querySelector('.control.minimize').addEventListener('click', () => {
    document.body.style.display = 'none';
    setTimeout(() => {
        document.body.style.display = 'flex';
    }, 100);
});

document.querySelector('.control.maximize').addEventListener('click', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
});

// Add glitch effect on hover for certain elements
const glitchElements = document.querySelectorAll('.terminal-title, .chat-title');
glitchElements.forEach(element => {
    element.addEventListener('mouseenter', () => {
        element.style.animation = 'glitch 0.3s infinite';
    });
    element.addEventListener('mouseleave', () => {
        element.style.animation = 'none';
    });
});

// Add glitch animation
const glitchStyle = document.createElement('style');
glitchStyle.textContent = `
    @keyframes glitch {
        0%, 100% {
            text-shadow:
                0 0 10px #00ff41,
                2px 2px 2px rgba(0, 255, 65, 0.5);
        }
        25% {
            text-shadow:
                0 0 10px #00ff41,
                -2px -2px 2px rgba(255, 0, 0, 0.5);
        }
        50% {
            text-shadow:
                0 0 10px #00ff41,
                2px -2px 2px rgba(0, 100, 255, 0.5);
        }
        75% {
            text-shadow:
                0 0 10px #00ff41,
                -2px 2px 2px rgba(255, 255, 0, 0.5);
        }
    }
`;
document.head.appendChild(glitchStyle);