// API Configuration
const API_BASE_URL = '';  // Empty for same-origin in Flask

// Store conversation history
let conversationHistory = [];

// Auto-resize textarea
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

// Send suggested question
function sendSuggestedQuestion(question) {
    const input = document.getElementById('messageInput');
    input.value = question;
    autoResize(input);
    sendMessage();
}

// Format AI response with HTML
function formatAIResponse(text) {
    // This is a fallback - the backend already formats it
    return text;
}

// Add message to chat
function addMessage(content, isUser = false, formattedContent = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'message-user' : ''}`;
    
    if (isUser) {
        messageDiv.innerHTML = `
            <div class="message-content">
                ${content}
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
        
        // Add to history
        conversationHistory.push({
            role: 'user',
            content: content
        });
    } else {
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-meteor"></i>
            </div>
            <div class="message-content">
                ${formattedContent || formatAIResponse(content)}
            </div>
        `;
        
        // Add to history
        conversationHistory.push({
            role: 'assistant',
            content: content
        });
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    const indicatorDiv = document.createElement('div');
    indicatorDiv.id = 'typingIndicator';
    indicatorDiv.className = 'message';
    indicatorDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-meteor"></i>
        </div>
        <div class="typing-indicator">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>
    `;
    chatMessages.appendChild(indicatorDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Send message to backend
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';
    
    // Disable send button
    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;
    
    // Add user message
    addMessage(message, true);
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: conversationHistory.slice(-10)
            })
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add AI response with formatted HTML
        addMessage(data.response, false, data.formatted_response);
        
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        addMessage('⚠️ Sorry, I encountered an error. Please try again.', false);
    } finally {
        // Re-enable send button
        sendButton.disabled = false;
    }
}

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        input.addEventListener('input', function() {
            autoResize(this);
        });
    }
    
    // Welcome message
    addMessage(
        '✨ Welcome to SmartChat! I\'m your Aurora AI assistant. I can help you with coding, answer questions, brainstorm ideas, or just chat! What would you like to explore today?', 
        false,
        '<p>✨ <strong>Welcome to SmartChat!</strong> I\'m your Aurora AI assistant. I can help you with:</p>' +
        '<ul>' +
        '<li>💻 <strong>Coding</strong> - Python, JavaScript, FastAPI, and more</li>' +
        '<li>📚 <strong>Learning</strong> - Explain complex topics simply</li>' +
        '<li>🎨 <strong>Creative</strong> - Brainstorming and ideas</li>' +
        '<li>🔧 <strong>Debugging</strong> - Fix your code</li>' +
        '</ul>' +
        '<p>What would you like to explore today? 🚀</p>'
    , false);
});