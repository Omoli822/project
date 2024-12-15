
document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const chatOutput = document.getElementById('chat-output');
    const loadingIndicator = document.getElementById('loading');
  
    sendBtn.addEventListener('click', async () => {
      const userMessage = chatInput.value.trim();
      
      if (!userMessage) {
        alert('Please enter a message');
        return;
      }
  
      // Clear previous output and show loading
      chatOutput.textContent = '';
      loadingIndicator.style.display = 'block';
      sendBtn.disabled = true;
  
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ message: userMessage })
        });
  
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
  
        const data = await response.json();
        chatOutput.textContent = data.reply;
      } catch (error) {
        console.error('Chat error:', error);
        chatOutput.textContent = 'Sorry, there was an error processing your request.';
      } finally {
        loadingIndicator.style.display = 'none';
        sendBtn.disabled = false;
        chatInput.value = '';
      }
    });
  
    // Optional: Add enter key support
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendBtn.click();
      }
    });
  });