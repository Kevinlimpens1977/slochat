// State management
let conversationHistory = [];
let currentData = null;
let isLoading = false;

// DOM elements
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const welcomeMessage = document.getElementById('welcomeMessage');
const exportContainer = document.getElementById('exportContainer');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    messageInput.addEventListener('keydown', handleKeyPress);
    messageInput.addEventListener('input', autoResize);
});

// Handle keyboard input
function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Auto-resize textarea
function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
}

// Send example question
function sendExample(text) {
    messageInput.value = text;
    sendMessage();
}

// Send message
async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || isLoading) return;

    // Hide welcome message
    if (welcomeMessage) {
        welcomeMessage.style.display = 'none';
    }

    // Add user message to UI
    addMessage('user', message);

    // Add to conversation history
    conversationHistory.push({
        role: 'user',
        content: message
    });

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // Disable input while loading
    isLoading = true;
    sendBtn.disabled = true;
    messageInput.disabled = true;

    // Add loading indicator
    const loadingId = addLoadingIndicator();

    try {
        // Stream response from LLM
        await streamLLMResponse(loadingId);
    } catch (error) {
        console.error('Error sending message:', error);
        removeMessage(loadingId);
        addMessage('assistant', '❌ Er is een fout opgetreden bij het verbinden met de assistent. Controleer of de server draait en de API keys correct zijn ingesteld.');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        messageInput.disabled = false;
        messageInput.focus();
    }
}

// Stream LLM response
async function streamLLMResponse(loadingId) {
    try {
        const response = await fetch('/api/llm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        // Remove loading indicator
        removeMessage(loadingId);

        // Create message element for streaming
        const messageId = 'msg-' + Date.now();
        const messageDiv = createMessageElement('assistant', '', messageId);
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();

        const contentDiv = messageDiv.querySelector('.message-content');
        let fullContent = '';

        // Read the stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    if (data === '[DONE]') {
                        // Stream complete
                        conversationHistory.push({
                            role: 'assistant',
                            content: fullContent
                        });

                        // Check if response mentions data that should be exported
                        if (shouldShowExport(fullContent)) {
                            showExportButton();
                        }

                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;

                        if (content) {
                            fullContent += content;
                            contentDiv.textContent = fullContent;
                            scrollToBottom();
                        }
                    } catch (e) {
                        // Skip invalid JSON
                        continue;
                    }
                }
            }
        }

    } catch (error) {
        throw error;
    }
}

// Add message to UI
function addMessage(role, content) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = createMessageElement(role, content, messageId);
    messagesContainer.appendChild(messageDiv);
    scrollToBottom();
    return messageId;
}

// Create message element
function createMessageElement(role, content, id) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.id = id;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? '👤' : '📚';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Format content with line breaks
    if (content) {
        const formattedContent = formatMessageContent(content);
        contentDiv.innerHTML = formattedContent;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    return messageDiv;
}

// Format message content
function formatMessageContent(content) {
    // Convert newlines to <br> and preserve formatting
    return content
        .split('\n')
        .map(line => {
            // Check if line is a header (starts with #)
            if (line.startsWith('# ')) {
                return `<strong>${line.substring(2)}</strong>`;
            }
            // Check for bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                return `<div style="margin-left: 16px;">${line}</div>`;
            }
            return line;
        })
        .join('<br>');
}

// Add loading indicator
function addLoadingIndicator() {
    const loadingId = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = loadingId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '📚';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const template = document.getElementById('loadingTemplate');
    contentDiv.appendChild(template.content.cloneNode(true));

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    scrollToBottom();
    return loadingId;
}

// Remove message
function removeMessage(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

// Scroll to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Check if export button should be shown
function shouldShowExport(content) {
    const exportKeywords = [
        'kerndoel',
        'domein',
        'subdomein',
        'examenprogramma',
        'curriculum',
        'resultaat',
        'gevonden'
    ];

    const lowerContent = content.toLowerCase();
    return exportKeywords.some(keyword => lowerContent.includes(keyword));
}

// Show export button
function showExportButton() {
    exportContainer.style.display = 'block';
}

// Export conversation to Excel
function exportToExcel() {
    try {
        // Prepare data for Excel
        const worksheetData = [];

        // Add header
        worksheetData.push(['DaCapo Chat - SLO Curriculumassistent']);
        worksheetData.push(['Gesprek geëxporteerd op: ' + new Date().toLocaleString('nl-NL')]);
        worksheetData.push([]); // Empty row
        worksheetData.push(['Rol', 'Bericht']);

        // Add conversation messages
        conversationHistory.forEach(msg => {
            const role = msg.role === 'user' ? 'Gebruiker' : 'Assistent';
            worksheetData.push([role, msg.content]);
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(worksheetData);

        // Set column widths
        ws['!cols'] = [
            { wch: 15 },  // Role column
            { wch: 80 }   // Message column
        ];

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Gesprek');

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `SLO_Chat_${timestamp}.xlsx`;

        // Download file
        XLSX.writeFile(wb, filename);

        // Show success message
        showTemporaryMessage('✅ Excel bestand succesvol gedownload!');

    } catch (error) {
        console.error('Export error:', error);
        showTemporaryMessage('❌ Fout bij exporteren naar Excel');
    }
}

// Show temporary message
function showTemporaryMessage(text) {
    const messageId = addMessage('assistant', text);
    setTimeout(() => {
        const element = document.getElementById(messageId);
        if (element) {
            element.style.transition = 'opacity 0.3s ease-out';
            element.style.opacity = '0';
            setTimeout(() => element.remove(), 300);
        }
    }, 3000);
}

// API helper to fetch SLO data (for future use if needed)
async function fetchSLOData(params) {
    try {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`/api/slo?${queryString}`);

        if (!response.ok) {
            throw new Error('Failed to fetch SLO data');
        }

        const data = await response.json();
        currentData = data;
        return data;
    } catch (error) {
        console.error('SLO API error:', error);
        throw error;
    }
}
