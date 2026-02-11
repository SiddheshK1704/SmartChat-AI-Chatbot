import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = Flask(__name__)

# Initialize Groq
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def format_response(text):
    """Simple formatting for AI responses"""
    # Convert code blocks
    import re
    text = re.sub(r'```(\w+)?\n(.*?)```', r'<pre><code>\2</code></pre>', text, flags=re.DOTALL)
    text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    
    # Convert bullet points
    lines = text.split('\n')
    in_list = False
    formatted_lines = []
    
    for line in lines:
        if line.strip().startswith('- '):
            if not in_list:
                formatted_lines.append('<ul>')
                in_list = True
            formatted_lines.append(f'<li>{line.strip()[2:]}</li>')
        else:
            if in_list:
                formatted_lines.append('</ul>')
                in_list = False
            formatted_lines.append(f'<p>{line}</p>' if line.strip() else '')
    
    if in_list:
        formatted_lines.append('</ul>')
    
    return ''.join(formatted_lines)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat')
def chat_page():
    return render_template('chat.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        
        data = request.get_json()
        message = data.get('message', '')
        history = data.get('history', [])
        
        # Prepare messages for Groq
        messages = [{
            "role": "system",
            "content": """You are SmartChat, an intelligent and friendly AI assistant.
            Response guidelines:
            - Be clear, concise, and helpful by default
            - Use **bold** to highlight important concepts or keywords
            - Use *italics* sparingly for subtle emphasis or tone
            - Use bullet points only when listing multiple items, steps, or options improves clarity
            - Write in natural paragraphs when explaining concepts or answering directly
            - Use ```language``` fenced code blocks for code snippets
            - Keep formatting clean and readable (avoid over-formatting)
            - Match the tone to the question (technical when needed, conversational otherwise)
            - Add emojis occasionally when appropriate to enhance friendliness ✨
            - Prefer clarity over verbosity
            - Avoid repeating the user’s question unless necessary
            - When unsure, ask a brief clarifying question"""
        }]
        
        # Add conversation history
        for msg in history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        
        # Add current message
        messages.append({"role": "user", "content": message})
        
        # Get response from Groq
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            top_p=1
        )
        
        response_text = completion.choices[0].message.content
        formatted_response = format_response(response_text)
        
        return jsonify({
            'response': response_text,
            'formatted_response': formatted_response
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)