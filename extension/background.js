// background.js
console.log('nJudge Bridge Extension Background Script Loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received request:', request);

  if (request.type === 'NJUDGE_PING') {
    sendResponse({ status: 'ok', message: 'Pong!' });
    return true;
  }

  if (request.type === 'NJUDGE_SCRAPE_PROBLEM') {
    handleScrapeProblem(request.payload)
      .then(data => sendResponse({ status: 'success', data }))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true; 
  }

  if (request.type === 'NJUDGE_SUBMIT') {
    handleSubmission(request.payload)
      .then(data => sendResponse({ status: 'success', data }))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true;
  }

  return true;
});

async function handleScrapeProblem({ oj, id }) {
  if (oj === 'CF') {
    // Check if it's a contest problem (e.g. 123A) or problemset problem
    const match = id.match(/^(\d+)([A-Z]\d*)$/);
    if (!match) throw new Error('Invalid Codeforces Problem ID format (e.g., 123A)');
    
    const contestId = match[1];
    const problemIndex = match[2];
    const targetUrl = `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`;

    const response = await fetch(targetUrl);
    const html = await response.text();
    
    const titleMatch = html.match(/<div class="title">(.+?)<\/div>/);
    const title = titleMatch ? titleMatch[1].replace(/^[A-Z]\.\s+/, '') : 'Unknown Title';

    return { title, url: targetUrl };
  }
  
  throw new Error('Unsupported OJ or invalid payload');
}

async function handleSubmission({ oj, problemId, code, languageId, submissionId, supabaseConfig }) {
  if (oj === 'CF') {
    const match = problemId.match(/^(\d+)([A-Z]\d*)$/);
    if (!match) throw new Error('Invalid Codeforces Problem ID');
    
    const contestId = match[1];
    const problemIndex = match[2];
    const submitUrl = `https://codeforces.com/contest/${contestId}/submit`;

    // 1. Get CSRF Token
    const getResp = await fetch(submitUrl);
    const getHtml = await getResp.text();
    const csrfMatch = getHtml.match(/data-csrf='(.+?)'/);
    if (!csrfMatch) throw new Error('Could not find CSRF token. Are you logged into Codeforces?');
    const csrfToken = csrfMatch[1];

    // 2. Submit Code
    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('ftaa', ''); // Often empty or randomized
    formData.append('bfaa', '');
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('submittedProblemIndex', problemIndex);
    formData.append('programTypeId', languageId); // e.g., 54 for C++20
    formData.append('source', code);
    formData.append('tabSize', '4');
    formData.append('_tta', '37'); // Random constant often works

    const postResp = await fetch(submitUrl + '?enforceRedirect=true', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });

    if (!postResp.ok) throw new Error('Submission failed at Codeforces');

    // 3. Start Polling for Verdict
    pollCFVerdict(contestId, submissionId, supabaseConfig);

    return { status: 'submitted' };
  }
}

async function pollCFVerdict(contestId, submissionId, { url, key }) {
  const statusUrl = `https://codeforces.com/contest/${contestId}/my`;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes

  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      return;
    }

    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      
      // Look for the first row in the submission table
      // This is a bit brittle, parsing HTML with regex, but it's the CF way
      const rowMatch = html.match(/<tr data-submission-id="(\d+)"[\s\S]*?verdict="(.+?)"/);
      
      if (rowMatch) {
        const cfSubId = rowMatch[1];
        let verdict = rowMatch[2];
        
        // Map CF verdicts to our internal state
        // If it's still judging, keep polling
        if (verdict.includes('TESTING') || verdict === 'null' || verdict === 'IN_QUEUE') {
          updateSupabase(submissionId, 'Judging', verdict, { url, key });
        } else {
          // Final verdict reached
          updateSupabase(submissionId, verdict, verdict, { url, key });
          clearInterval(interval);
        }
      }
    } catch (e) {
      console.error('Polling error:', e);
    }
  }, 5000);
}

async function updateSupabase(id, verdict, details, { url, key }) {
  await fetch(`${url}/rest/v1/submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      verdict: verdict,
      verdict_details: details
    })
  });
}
