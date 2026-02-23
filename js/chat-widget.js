// A1 Diagnosis Floating AI Chat Widget
// Self-contained IIFE — injects its own CSS + HTML, zero dependencies
(function () {
    'use strict';

    // ── Configuration ──────────────────────────────────────────────
    const API_URL = '/.netlify/functions/claude-chat';
    const MAX_HISTORY = 10;
    const RATE_LIMIT_MS = 3000;
    const WORD_DELAY_MIN = 30;
    const WORD_DELAY_MAX = 80;
    const SESSION_KEY = 'a1chat_history';

    const WELCOME_MESSAGE = 'Hello! I\'m the A1 Diagnosis AI Assistant. I can answer questions about our AMD blood test, the company, our team, and investment opportunities. How can I help you today?';

    const SUGGESTIONS = [
        'What is AMD?',
        'How does the blood test work?',
        'Who is on the team?',
        'How can I contact you?'
    ];

    // ── Inject CSS ─────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        /* Toggle Button */
        .a1chat-toggle {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            border: none;
            cursor: pointer;
            z-index: 9998;
            box-shadow: 0 4px 20px rgba(20, 184, 166, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .a1chat-toggle:hover {
            transform: scale(1.08);
            box-shadow: 0 6px 28px rgba(20, 184, 166, 0.5);
        }
        .a1chat-toggle svg {
            width: 28px;
            height: 28px;
            fill: #fff;
        }

        /* Chat Window */
        .a1chat-window {
            position: fixed;
            bottom: 96px;
            right: 24px;
            width: 400px;
            height: 550px;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .a1chat-window.a1chat-open {
            display: flex;
        }

        /* Header */
        .a1chat-header {
            background: linear-gradient(135deg, #14b8a6 0%, #0284c7 100%);
            padding: 16px 18px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }
        .a1chat-header-title {
            color: #fff;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: 0.3px;
        }
        .a1chat-header-actions {
            display: flex;
            gap: 8px;
        }
        .a1chat-header-btn {
            background: rgba(255, 255, 255, 0.2);
            border: none;
            color: #fff;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            transition: background 0.2s;
        }
        .a1chat-header-btn:hover {
            background: rgba(255, 255, 255, 0.35);
        }

        /* Messages Area */
        .a1chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: #f8fafc;
        }
        .a1chat-messages::-webkit-scrollbar {
            width: 5px;
        }
        .a1chat-messages::-webkit-scrollbar-track {
            background: transparent;
        }
        .a1chat-messages::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }

        /* Message Bubbles */
        .a1chat-msg {
            max-width: 85%;
            padding: 10px 14px;
            border-radius: 14px;
            font-size: 14px;
            line-height: 1.55;
            word-wrap: break-word;
        }
        .a1chat-msg-ai {
            align-self: flex-start;
            background: #f0fdfa;
            color: #1e293b;
            border-bottom-left-radius: 4px;
        }
        .a1chat-msg-user {
            align-self: flex-end;
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            color: #fff;
            border-bottom-right-radius: 4px;
        }
        .a1chat-msg-ai strong { font-weight: 600; }
        .a1chat-msg-ai em { font-style: italic; }
        .a1chat-msg-ai ul, .a1chat-msg-ai ol {
            margin: 6px 0;
            padding-left: 20px;
        }
        .a1chat-msg-ai li { margin-bottom: 3px; }
        .a1chat-msg-ai p { margin: 0 0 8px; }
        .a1chat-msg-ai p:last-child { margin-bottom: 0; }
        .a1chat-msg-ai a {
            color: #0d9488;
            text-decoration: underline;
        }

        /* Suggestions */
        .a1chat-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 0 16px 12px;
            background: #f8fafc;
        }
        .a1chat-suggestion {
            background: #fff;
            border: 1.5px solid #14b8a6;
            color: #0d9488;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 13px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
        }
        .a1chat-suggestion:hover {
            background: #14b8a6;
            color: #fff;
        }

        /* Typing Indicator */
        .a1chat-typing {
            align-self: flex-start;
            display: none;
            align-items: center;
            gap: 5px;
            padding: 10px 14px;
            background: #f0fdfa;
            border-radius: 14px;
            border-bottom-left-radius: 4px;
        }
        .a1chat-typing.a1chat-visible {
            display: flex;
        }
        .a1chat-typing-dot {
            width: 7px;
            height: 7px;
            background: #94a3b8;
            border-radius: 50%;
            animation: a1chat-bounce 1.4s infinite ease-in-out;
        }
        .a1chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .a1chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes a1chat-bounce {
            0%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-6px); }
        }

        /* Input Area */
        .a1chat-input-area {
            display: flex;
            align-items: flex-end;
            gap: 8px;
            padding: 12px 16px;
            border-top: 1px solid #e2e8f0;
            background: #fff;
            flex-shrink: 0;
        }
        .a1chat-input {
            flex: 1;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 14px;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            resize: none;
            max-height: 100px;
            line-height: 1.4;
            outline: none;
            transition: border-color 0.2s;
            overflow-y: auto;
        }
        .a1chat-input:focus {
            border-color: #14b8a6;
        }
        .a1chat-input::placeholder {
            color: #94a3b8;
        }
        .a1chat-send {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: opacity 0.2s;
        }
        .a1chat-send:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .a1chat-send svg {
            width: 18px;
            height: 18px;
            fill: #fff;
        }

        /* Error */
        .a1chat-error {
            align-self: center;
            background: #fef2f2;
            color: #dc2626;
            padding: 8px 14px;
            border-radius: 10px;
            font-size: 13px;
            text-align: center;
        }

        /* Mobile: Full-screen */
        @media (max-width: 480px) {
            .a1chat-window {
                bottom: 0;
                right: 0;
                width: 100%;
                height: 100%;
                border-radius: 0;
            }
            .a1chat-toggle {
                bottom: 16px;
                right: 16px;
            }
        }
    `;
    document.head.appendChild(style);

    // ── Inject HTML ────────────────────────────────────────────────
    const container = document.createElement('div');
    container.id = 'a1chat-container';
    container.innerHTML = `
        <button class="a1chat-toggle" aria-label="Open chat" aria-expanded="false">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12z"/>
            </svg>
        </button>
        <div class="a1chat-window" role="dialog" aria-label="A1 Diagnosis AI Chat">
            <div class="a1chat-header">
                <span class="a1chat-header-title">A1 Diagnosis AI</span>
                <div class="a1chat-header-actions">
                    <button class="a1chat-header-btn a1chat-clear-btn" title="Clear chat">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M5 6l1 14h12l1-14"/></svg>
                    </button>
                    <button class="a1chat-header-btn a1chat-close-btn" title="Close chat">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
            </div>
            <div class="a1chat-messages"></div>
            <div class="a1chat-suggestions"></div>
            <div class="a1chat-input-area">
                <textarea class="a1chat-input" rows="1" placeholder="Type your message..." maxlength="2000"></textarea>
                <button class="a1chat-send" aria-label="Send message">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // ── DOM References ─────────────────────────────────────────────
    const toggle = container.querySelector('.a1chat-toggle');
    const chatWindow = container.querySelector('.a1chat-window');
    const messagesEl = container.querySelector('.a1chat-messages');
    const suggestionsEl = container.querySelector('.a1chat-suggestions');
    const input = container.querySelector('.a1chat-input');
    const sendBtn = container.querySelector('.a1chat-send');
    const closeBtn = container.querySelector('.a1chat-close-btn');
    const clearBtn = container.querySelector('.a1chat-clear-btn');

    // ── State ──────────────────────────────────────────────────────
    let conversationHistory = [];
    let isOpen = false;
    let isSending = false;
    let lastSendTime = 0;

    // ── Helpers ────────────────────────────────────────────────────
    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function formatMarkdown(text) {
        // Escape HTML first
        let html = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Bold: **text**
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic: *text*
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Unordered list items: - item or * item
        html = html.replace(/^[\-\*]\s+(.+)/gm, '<li>$1</li>');

        // Ordered list items: 1. item
        html = html.replace(/^\d+\.\s+(.+)/gm, '<li>$1</li>');

        // Wrap consecutive <li> in <ul>
        html = html.replace(/((?:<li>.*?<\/li>\n?)+)/g, '<ul>$1</ul>');

        // Links: [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Email addresses
        html = html.replace(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '<a href="mailto:$1">$1</a>');

        // Paragraphs: double newline
        html = html.replace(/\n\n/g, '</p><p>');

        // Single line breaks
        html = html.replace(/\n/g, '<br>');

        // Wrap in paragraph
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');

        return html;
    }

    function addMessage(content, role, animate) {
        const bubble = document.createElement('div');
        bubble.className = 'a1chat-msg ' + (role === 'user' ? 'a1chat-msg-user' : 'a1chat-msg-ai');

        if (role === 'user') {
            bubble.textContent = content;
            messagesEl.appendChild(bubble);
            scrollToBottom();
            return Promise.resolve();
        }

        if (!animate) {
            bubble.innerHTML = formatMarkdown(content);
            messagesEl.appendChild(bubble);
            scrollToBottom();
            return Promise.resolve();
        }

        // Streaming simulation: word-by-word
        messagesEl.appendChild(bubble);
        const words = content.split(/(\s+)/);
        let idx = 0;
        let accumulated = '';

        return new Promise(function (resolve) {
            function nextWord() {
                if (idx >= words.length) {
                    bubble.innerHTML = formatMarkdown(content);
                    scrollToBottom();
                    resolve();
                    return;
                }
                accumulated += words[idx];
                idx++;
                bubble.innerHTML = formatMarkdown(accumulated);
                scrollToBottom();
                var delay = WORD_DELAY_MIN + Math.random() * (WORD_DELAY_MAX - WORD_DELAY_MIN);
                setTimeout(nextWord, delay);
            }
            nextWord();
        });
    }

    function showTyping() {
        var el = messagesEl.querySelector('.a1chat-typing');
        if (!el) {
            el = document.createElement('div');
            el.className = 'a1chat-typing';
            el.innerHTML = '<div class="a1chat-typing-dot"></div><div class="a1chat-typing-dot"></div><div class="a1chat-typing-dot"></div>';
            messagesEl.appendChild(el);
        }
        el.classList.add('a1chat-visible');
        scrollToBottom();
    }

    function hideTyping() {
        var el = messagesEl.querySelector('.a1chat-typing');
        if (el) el.remove();
    }

    function showError(msg) {
        var el = document.createElement('div');
        el.className = 'a1chat-error';
        el.textContent = msg;
        messagesEl.appendChild(el);
        scrollToBottom();
    }

    function showSuggestions() {
        suggestionsEl.innerHTML = '';
        SUGGESTIONS.forEach(function (text) {
            var btn = document.createElement('button');
            btn.className = 'a1chat-suggestion';
            btn.textContent = text;
            btn.addEventListener('click', function () {
                sendMessage(text);
            });
            suggestionsEl.appendChild(btn);
        });
    }

    function hideSuggestions() {
        suggestionsEl.innerHTML = '';
    }

    function saveSession() {
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(conversationHistory));
        } catch (e) { /* ignore quota errors */ }
    }

    function loadSession() {
        try {
            var data = sessionStorage.getItem(SESSION_KEY);
            if (data) {
                conversationHistory = JSON.parse(data);
                return true;
            }
        } catch (e) { /* ignore */ }
        return false;
    }

    function restoreMessages() {
        conversationHistory.forEach(function (entry) {
            addMessage(entry.content, entry.role, false);
        });
    }

    // ── Core: Send Message ─────────────────────────────────────────
    async function sendMessage(text) {
        var msg = (text || '').trim();
        if (!msg || isSending) return;

        // Rate limiting
        var now = Date.now();
        if (now - lastSendTime < RATE_LIMIT_MS) return;
        lastSendTime = now;

        isSending = true;
        sendBtn.disabled = true;
        hideSuggestions();

        // Add user message
        addMessage(msg, 'user', false);
        conversationHistory.push({ role: 'user', content: msg });
        saveSession();
        input.value = '';
        input.style.height = 'auto';

        showTyping();

        try {
            var historyToSend = conversationHistory.slice(0, -1).slice(-MAX_HISTORY);
            var response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: msg,
                    conversationHistory: historyToSend
                })
            });

            hideTyping();

            if (!response.ok) {
                var errData;
                try { errData = await response.json(); } catch (e) { errData = {}; }
                throw new Error(errData.error || 'Something went wrong');
            }

            var data = await response.json();
            var reply = data.reply || 'I apologize, I was unable to generate a response.';

            await addMessage(reply, 'assistant', true);
            conversationHistory.push({ role: 'assistant', content: reply });
            saveSession();

        } catch (err) {
            hideTyping();
            showError(err.message || 'Failed to connect. Please try again.');
        } finally {
            isSending = false;
            sendBtn.disabled = false;
            input.focus();
        }
    }

    // ── Open / Close ───────────────────────────────────────────────
    function openChat() {
        isOpen = true;
        chatWindow.classList.add('a1chat-open');
        toggle.setAttribute('aria-expanded', 'true');
        input.focus();
    }

    function closeChat() {
        isOpen = false;
        chatWindow.classList.remove('a1chat-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    function clearChat() {
        conversationHistory = [];
        messagesEl.innerHTML = '';
        sessionStorage.removeItem(SESSION_KEY);
        addMessage(WELCOME_MESSAGE, 'assistant', false);
        showSuggestions();
    }

    // ── Auto-expand Textarea ───────────────────────────────────────
    function autoResize() {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 100) + 'px';
    }

    // ── Event Listeners ────────────────────────────────────────────
    toggle.addEventListener('click', function () {
        if (isOpen) closeChat(); else openChat();
    });

    closeBtn.addEventListener('click', closeChat);
    clearBtn.addEventListener('click', clearChat);

    sendBtn.addEventListener('click', function () {
        sendMessage(input.value);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input.value);
        }
    });

    input.addEventListener('input', autoResize);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isOpen) closeChat();
    });

    // ── Initialize ─────────────────────────────────────────────────
    var hadSession = loadSession();
    if (hadSession && conversationHistory.length > 0) {
        restoreMessages();
    } else {
        addMessage(WELCOME_MESSAGE, 'assistant', false);
        showSuggestions();
    }

})();
