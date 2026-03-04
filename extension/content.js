// content.js
console.log('nJudge Bridge: Content Script Loaded');

// Use browser namespace if available (Firefox), otherwise chrome
const api = typeof browser !== 'undefined' ? browser : chrome;

// Listen for messages from the web app
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  // Only accept messages with a specific type to avoid noise
  if (event.data && event.data.type && event.data.type.startsWith('NJUDGE_')) {
    console.log('nJudge Bridge: Received from web app:', event.data.type);
    
    // Pass the message to the background script
    api.runtime.sendMessage(event.data)
      .then(response => {
        console.log('nJudge Bridge: Response from background:', response);
        // Send the response back to the web app
        window.postMessage({
          type: event.data.type + '_RESPONSE',
          payload: response,
          requestId: event.data.requestId
        }, '*');
      })
      .catch(error => {
        console.error('nJudge Bridge: Error from background:', error);
      });
  }
});

// Listen for push messages from background (optional)
api.runtime.onMessage.addListener((message) => {
  if (message && message.type && message.type.startsWith('NJUDGE_')) {
    window.postMessage(message, '*');
  }
});
