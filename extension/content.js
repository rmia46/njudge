// content.js
console.log('nJudge Bridge: Content Script Loaded');

const api = typeof browser !== 'undefined' ? browser : chrome;

// Small delay to ensure bridge is ready
setTimeout(() => {
  console.log('nJudge Bridge [Content]: System Online');
}, 500);

// Listen for messages FROM the Web App
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  
  const data = event.data;
  if (!data || !data.type || !data.type.startsWith('NJUDGE_')) return;

  // IMPORTANT: Only forward REQUESTS to background. Ignore RESPONSES.
  if (data.type.endsWith('_RESPONSE')) return;

  console.log('nJudge Bridge [Content]: Forwarding request to background:', data.type);
  
  try {
    api.runtime.sendMessage(data, (response) => {
      // Firefox might return response directly or through callback depending on version/setup
      const finalResponse = response || { status: 'error', message: 'No response from background' };
      
      console.log('nJudge Bridge [Content]: Received response from background for:', data.type);
      
      window.postMessage({
        type: data.type + '_RESPONSE',
        payload: finalResponse,
        requestId: data.requestId
      }, '*');
    });
  } catch (err) {
    console.error('nJudge Bridge [Content]: Failed to send to background:', err);
  }
});
