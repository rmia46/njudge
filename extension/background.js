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
  
  if (oj === 'AC') {
    // AtCoder ID format: abc344_a
    const match = id.match(/^([a-z0-9]+)_([a-z0-9]+)$/);
    if (!match) throw new Error('Invalid AtCoder Problem ID format (e.g., abc344_a)');
    
    const contestId = match[1];
    const targetUrl = `https://atcoder.jp/contests/${contestId}/tasks/${id}`;

    const response = await fetch(targetUrl);
    const html = await response.text();
    
    const titleMatch = html.match(/<span class="h2">[\s\S]*?-\s*(.+?)<\/span>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Title';

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

    const getResp = await fetch(submitUrl);
    const getHtml = await getResp.text();
    const csrfMatch = getHtml.match(/data-csrf='(.+?)'/);
    if (!csrfMatch) throw new Error('Could not find CSRF token. Are you logged into Codeforces?');
    const csrfToken = csrfMatch[1];

    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('ftaa', '');
    formData.append('bfaa', '');
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('submittedProblemIndex', problemIndex);
    formData.append('programTypeId', languageId); 
    formData.append('source', code);
    formData.append('tabSize', '4');
    formData.append('_tta', '37');

    const postResp = await fetch(submitUrl + '?enforceRedirect=true', {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });

    if (!postResp.ok) throw new Error('Submission failed at Codeforces');
    pollCFVerdict(contestId, submissionId, supabaseConfig);
    return { status: 'submitted' };
  }

  if (oj === 'AC') {
    const match = problemId.match(/^([a-z0-9]+)_([a-z0-9]+)$/);
    if (!match) throw new Error('Invalid AtCoder Problem ID');
    
    const contestId = match[1];
    const submitUrl = `https://atcoder.jp/contests/${contestId}/submit`;

    // 1. Get CSRF Token
    const getResp = await fetch(submitUrl);
    const getHtml = await getResp.text();
    const csrfMatch = getHtml.match(/name="csrf_token" value="(.+?)"/);
    if (!csrfMatch) throw new Error('Could not find AtCoder CSRF token. Are you logged in?');
    const csrfToken = csrfMatch[1];

    // 2. Submit
    const formData = new FormData();
    formData.append('data.TaskScreenName', problemId);
    formData.append('data.LanguageId', languageId);
    formData.append('sourceCode', code);
    formData.append('csrf_token', csrfToken);

    const postResp = await fetch(submitUrl, {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });

    if (!postResp.ok) throw new Error('Submission failed at AtCoder');
    pollACVerdict(contestId, submissionId, supabaseConfig);
    return { status: 'submitted' };
  }
}

async function pollCFVerdict(contestId, submissionId, { url, key }) {
  const statusUrl = `https://codeforces.com/contest/${contestId}/my`;
  let attempts = 0;
  const maxAttempts = 60;

  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) { clearInterval(interval); return; }

    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      const rowMatch = html.match(/<tr data-submission-id="(\d+)"[\s\S]*?verdict="(.+?)"/);
      
      if (rowMatch) {
        let verdict = rowMatch[2];
        if (verdict.includes('TESTING') || verdict === 'null' || verdict === 'IN_QUEUE') {
          updateSupabase(submissionId, 'Judging', verdict, { url, key });
        } else {
          updateSupabase(submissionId, verdict, verdict, { url, key });
          clearInterval(interval);
        }
      }
    } catch (e) { console.error('CF Polling error:', e); }
  }, 5000);
}

async function pollACVerdict(contestId, submissionId, { url, key }) {
  const statusUrl = `https://atcoder.jp/contests/${contestId}/submissions/me`;
  let attempts = 0;
  const maxAttempts = 80;

  const interval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) { clearInterval(interval); return; }

    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      
      // Find the first row in the submission table
      const rowMatch = html.match(/<td class="text-center">[\s\S]*?<span class="label label-[^"]+"[^>]*?>(.+?)<\/span>/);
      
      if (rowMatch) {
        let verdict = rowMatch[1].trim();
        // AtCoder verdicts: AC, WA, TLE, MLE, RE, CE, Q, WJ (Waiting for Judging)
        if (verdict === 'WJ' || verdict === 'WR' || /^\d+\/\d+/.test(verdict)) {
          updateSupabase(submissionId, 'Judging', verdict, { url, key });
        } else {
          updateSupabase(submissionId, verdict, verdict, { url, key });
          clearInterval(interval);
        }
      }
    } catch (e) { console.error('AC Polling error:', e); }
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
