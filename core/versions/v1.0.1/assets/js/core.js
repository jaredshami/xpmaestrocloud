/**
 * Core Scripts - v1.0
 */

console.log('Core engine loaded v1.0');

// Initialize core engine if available
if (typeof CoreEngine !== 'undefined') {
  const engine = new CoreEngine({
    version: 'v1.0',
    debug: true,
  });
  
  window.coreEngine = engine;
}

// Utility function: API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(endpoint, options);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return await response.json();
}

// Utility function: DOM ready
function onReady(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Ready event
onReady(() => {
  console.log('DOM ready - Core engine initialized');
  
  // Emit custom event
  const event = new CustomEvent('coreEngineReady');
  document.dispatchEvent(event);
});
