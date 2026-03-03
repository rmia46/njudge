// content.js
console.log('nJudge Bridge Extension Content Script Loaded');

// Listen for messages from the web app
window.addEventListener('message', (event) => {
  // Only accept messages from the same window
  if (event.source !== window) return;

  // Only accept messages with a specific type to avoid noise
  if (event.data && event.data.type && event.data.type.startsWith('NJUDGE_')) {
    console.log('Content script received message from web app:', event.data);
    
    // Pass the message to the background script
    chrome.runtime.sendMessage(event.data, (response) => {
      // Send the response back to the web app
      window.postMessage({
        type: event.data.type + '_RESPONSE',
        payload: response,
        requestId: event.data.requestId
      }, '*');
    });
  }
});

// Listen for messages from the background script (optional, if we need push updates)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type && message.type.startsWith('NJUDGE_')) {
    window.postMessage(message, '*');
  }
});
