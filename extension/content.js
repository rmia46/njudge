// content.js
console.log('nJudge Bridge: Content Script Loaded');

const api = typeof browser !== 'undefined' ? browser : chrome;

// Listen for messages FROM the Web App
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  const data = event.data;
  if (!data || !data.type || !data.type.startsWith('NJUDGE_')) return;

  // IMPORTANT: Only forward REQUESTS to background. Ignore RESPONSES.
  if (data.type.endsWith('_RESPONSE')) return;

  console.log('nJudge Bridge [Content]: Forwarding request to background:', data.type);
  
  api.runtime.sendMessage(data, (response) => {
    // If background used sendResponse, we get it here
    if (chrome.runtime.lastError) {
      console.error('nJudge Bridge [Content]: Runtime error:', chrome.runtime.lastError);
      return;
    }

    console.log('nJudge Bridge [Content]: Received response from background for:', data.type);
    
    // Send response back to Web App
    window.postMessage({
      type: data.type + '_RESPONSE',
      payload: response,
      requestId: data.requestId
    }, '*');
  });
});

// REMOVED: api.runtime.onMessage.addListener - This was likely causing echoes.
