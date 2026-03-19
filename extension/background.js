// background.js
console.log('nJudge Bridge Extension Background Script Loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received request:', request.type);

  if (request.type === 'NJUDGE_PING') {
    sendResponse({ status: 'ok', message: 'Pong!' });
    return false;
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

  if (request.type === 'NJUDGE_CUSTOM_TEST') {
    handleCustomTest(request.payload)
      .then(data => sendResponse({ status: 'success', data }))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true;
  }

  if (request.type === 'NJUDGE_GET_LANGUAGES') {
    handleGetLanguages(request.payload)
      .then(data => sendResponse({ status: 'success', data }))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true;
  }

  sendResponse({ status: 'error', message: 'Unknown request type: ' + request.type });
  return false;
});

async function handleGetLanguages({ oj }) {
  if (oj === 'CF') {
    const resp = await fetch('https://codeforces.com/contest/1/submit'); // Use a generic contest or problemset
    const html = await resp.text();
    const selectMatch = html.match(/<select name="programTypeId"[\s\S]*?>([\s\S]*?)<\/select>/);
    if (!selectMatch) throw new Error('Could not find languages on Codeforces. Are you logged in?');
    const options = selectMatch[1].matchAll(/<option value="(\d+)"[^>]*?>([\s\S]*?)<\/option>/g);
    return Array.from(options).map(m => ({ id: m[1], name: m[2].trim() }));
  }
  if (oj === 'AC') {
    const resp = await fetch('https://atcoder.jp/contests/practice/submit');
    const html = await resp.text();
    const selectMatch = html.match(/<select name="data.LanguageId"[\s\S]*?>([\s\S]*?)<\/select>/);
    if (!selectMatch) throw new Error('Could not find languages on AtCoder. Are you logged in?');
    const options = selectMatch[1].matchAll(/<option value="(\d+)"[^>]*?>([\s\S]*?)<\/option>/g);
    return Array.from(options).map(m => ({ id: m[1], name: m[2].trim() }));
  }
  throw new Error('Unsupported OJ');
}

async function handleCustomTest({ oj, code, languageId, input }) {
  if (oj === 'CF') {
    const customTestUrl = 'https://codeforces.com/customtest';
    const getResp = await fetch(customTestUrl);
    const getHtml = await getResp.text();
    const csrfToken = getHtml.match(/data-csrf='(.+?)'/)?.[1];
    if (!csrfToken) throw new Error('Could not find CSRF token. Log into Codeforces.');

    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('ftaa', '');
    formData.append('bfaa', '');
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('programTypeId', languageId);
    formData.append('source', code);
    formData.append('input', input);
    formData.append('_tta', '37');

    const postResp = await fetch(customTestUrl, { method: 'POST', body: formData });
    if (!postResp.ok) throw new Error('Failed to submit custom test');
    return pollCFCustomTest(csrfToken);
  }

  if (oj === 'AC') {
    // For AtCoder, we need a contestId. We can extract it from the problemId or use 'practice'
    // Let's assume most users have access to 'practice' contest.
    const customTestUrl = 'https://atcoder.jp/contests/practice/custom_test';
    const getResp = await fetch(customTestUrl);
    const getHtml = await getResp.text();
    const csrfToken = getHtml.match(/name="csrf_token" value="(.+?)"/)?.[1];
    if (!csrfToken) throw new Error('Could not find CSRF token. Log into AtCoder.');

    const formData = new FormData();
    formData.append('data.LanguageId', languageId);
    formData.append('sourceCode', code);
    formData.append('input', input);
    formData.append('csrf_token', csrfToken);

    const postResp = await fetch(`${customTestUrl}/submit`, { method: 'POST', body: formData });
    if (!postResp.ok) throw new Error('Failed to submit custom test to AtCoder');
    return pollACCustomTest();
  }
  throw new Error('Unsupported OJ for custom test');
}

async function pollACCustomTest() {
  const customTestUrl = 'https://atcoder.jp/contests/practice/custom_test/json';
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) { clearInterval(interval); reject(new Error('AtCoder Custom test timed out')); }
      try {
        const resp = await fetch(customTestUrl);
        const data = await resp.json();
        // Result: "Success" or similar, usually it has "Waiting" or "Judging" in some field if not done
        // AtCoder's /custom_test/json returns a Result field.
        if (data && data.Result && !['Waiting', 'Judging'].includes(data.Result)) {
          clearInterval(interval);
          resolve({ 
            output: data.Stdout || data.Stderr || 'No output', 
            time: data.Time || '0', 
            memory: data.Memory || '0' 
          });
        }
      } catch (e) { console.error('AC Poll error:', e); }
    }, 2000);
  });
}

async function pollCFCustomTest(csrfToken) {
  const customTestUrl = 'https://codeforces.com/customtest';
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 30) { clearInterval(interval); reject(new Error('Custom test timed out')); }
      try {
        const resp = await fetch(customTestUrl);
        const html = await resp.text();
        const outputMatch = html.match(/<div id="output"[\s\S]*?><pre>([\s\S]*?)<\/pre>/);
        if (outputMatch && outputMatch[1].trim() !== '' && !outputMatch[1].includes('Running')) {
          const timeMatch = html.match(/Time: (\d+) ms/);
          const memoryMatch = html.match(/Memory: (\d+) KB/);
          clearInterval(interval);
          resolve({ output: outputMatch[1].trim(), time: timeMatch ? timeMatch[1] : '0', memory: memoryMatch ? memoryMatch[1] : '0' });
        }
      } catch (e) { console.error('Poll error:', e); }
    }, 2000);
  });
}

async function handleScrapeProblem({ oj, id }) {
  console.log('Background: Scraping problem', oj, id);
  try {
    if (oj === 'CF') {
      const match = id.match(/^(\d+)([A-Z]\d*)$/);
      if (!match) throw new Error('Invalid Codeforces ID (e.g. 123A)');
      const contestId = match[1];
      const problemIndex = match[2];
      const urls = [
        `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`,
        `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`,
        `https://codeforces.com/gym/${contestId}/problem/${problemIndex}`
      ];

      for (const targetUrl of urls) {
        try {
          const response = await fetch(targetUrl);
          if (!response.ok) continue;
          const finalUrl = response.url;
          if (!finalUrl.includes(contestId) || !finalUrl.toLowerCase().includes(problemIndex.toLowerCase())) {
            if (!finalUrl.includes('problemset') && !finalUrl.includes('contest')) continue;
          }
          const html = await response.text();
          
          // 1. Title
          const divMatch = html.match(/<div class="title">[\s\S]*?([A-Z]\d*[\.\s]+)?([^<]+)<\/div>/);
          const title = divMatch ? divMatch[2].trim() : '';

          // 2. RAW Container extraction (VJudge style)
          const startIdx = html.indexOf('<div class="problem-statement">');
          const endIdx = html.indexOf('<script', startIdx);
          let statementHtml = '';
          if (startIdx !== -1 && endIdx !== -1) {
            statementHtml = html.substring(startIdx, endIdx);
          }

          // Metadata extraction
          const tMatch = html.match(/<div class="time-limit">[\s\S]*?<div class="property-title">[\s\S]*?<\/div>(.+?)<\/div>/);
          const mMatch = html.match(/<div class="memory-limit">[\s\S]*?<div class="property-title">[\s\S]*?<\/div>(.+?)<\/div>/);

          if (statementHtml) {
            return { title: title || 'Problem ' + id, url: finalUrl, statementHtml, timeLimit: tMatch?.[1].trim() || '1.0s', memoryLimit: mMatch?.[1].trim() || '256MB' };
          }
        } catch (e) { }
      }
      throw new Error('Problem Not Found');
    }
    
    if (oj === 'AC') {
      const match = id.match(/^([a-z0-9]+)_([a-z0-9]+)$/);
      if (!match) throw new Error('Invalid AtCoder ID (e.g. abc344_a)');
      const contestId = match[1];
      const targetUrl = `https://atcoder.jp/contests/${contestId}/tasks/${id}`;
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`AtCoder Error: ${response.status}`);
      const html = await response.text();
      
      const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleTagMatch?.[1].split(' - ')[1]?.trim() || 'Unknown';

      // Capture the whole task-statement section
      const startIdx = html.indexOf('<div id="task-statement">');
      const endIdx = html.indexOf('</div>', html.indexOf('<div class="button-pannel">'));
      let statementHtml = '';
      if (startIdx !== -1 && endIdx !== -1) {
        statementHtml = html.substring(startIdx, endIdx);
      }

      const acLimitMatch = html.match(/Time Limit: (.*?) \/ Memory Limit: (.*?)<\/p>/);

      return { title, url: targetUrl, statementHtml, timeLimit: acLimitMatch?.[1].trim(), memoryLimit: acLimitMatch?.[2].trim() };
    }
  } catch (err) { throw err; }
  throw new Error('Unsupported OJ');
}

async function handleSubmission({ oj, problemId, code, languageId, submissionId, supabaseConfig }) {
  if (oj === 'CF') {
    const match = problemId.match(/^(\d+)([A-Z]\d*)$/);
    const contestId = match[1];
    const problemIndex = match[2];
    const submitUrl = `https://codeforces.com/contest/${contestId}/submit`;
    const getResp = await fetch(submitUrl);
    const getHtml = await getResp.text();
    const csrfToken = getHtml.match(/data-csrf='(.+?)'/)?.[1];
    if (!csrfToken) throw new Error('Login to Codeforces');

    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('submittedProblemIndex', problemIndex);
    formData.append('programTypeId', languageId); 
    formData.append('source', code);
    formData.append('_tta', '37');

    const postResp = await fetch(submitUrl + '?enforceRedirect=true', { method: 'POST', body: formData, redirect: 'follow' });
    if (!postResp.ok) throw new Error('CF Submission failed');
    pollCFVerdict(contestId, submissionId, supabaseConfig);
    return { status: 'submitted' };
  }

  if (oj === 'AC') {
    const match = problemId.match(/^([a-z0-9]+)_([a-z0-9]+)$/);
    const contestId = match[1];
    const submitUrl = `https://atcoder.jp/contests/${contestId}/submit`;
    const getResp = await fetch(submitUrl);
    const getHtml = await getResp.text();
    const csrfToken = getHtml.match(/name="csrf_token" value="(.+?)"/)?.[1];
    if (!csrfToken) throw new Error('Login to AtCoder');

    const formData = new FormData();
    formData.append('data.TaskScreenName', problemId);
    formData.append('data.LanguageId', languageId);
    formData.append('sourceCode', code);
    formData.append('csrf_token', csrfToken);

    const postResp = await fetch(submitUrl, { method: 'POST', body: formData, redirect: 'follow' });
    if (!postResp.ok) throw new Error('AC Submission failed');
    pollACVerdict(contestId, submissionId, supabaseConfig);
    return { status: 'submitted' };
  }
}

async function pollCFVerdict(contestId, submissionId, { url, key, accessToken }) {
  const statusUrl = `https://codeforces.com/contest/${contestId}/my`;
  const interval = setInterval(async () => {
    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      const rowMatch = html.match(/<tr data-submission-id="(\d+)"[\s\S]*?verdict="(.+?)"/);
      if (rowMatch) {
        let v = rowMatch[2];
        const points = (v === 'OK' || v === 'Accepted') ? 100 : 0;
        if (v.includes('TESTING') || v === 'null' || v === 'IN_QUEUE') {
          updateSupabase(submissionId, 'Judging', v, { url, key, accessToken }, points);
        } else {
          updateSupabase(submissionId, v, v, { url, key, accessToken }, points);
          clearInterval(interval);
        }
      }
    } catch (e) { }
  }, 5000);
}

async function pollACVerdict(contestId, submissionId, { url, key, accessToken }) {
  const statusUrl = `https://atcoder.jp/contests/${contestId}/submissions/me`;
  const interval = setInterval(async () => {
    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      // Match the first row in the submission table
      const rowMatch = html.match(/<tr>[\s\S]*?<td class="text-right">(\d+)<\/td>[\s\S]*?<span class="label label-[^"]+"[^>]*?>(.+?)<\/span>/);
      if (rowMatch) {
        const points = parseInt(rowMatch[1]);
        const verdict = rowMatch[2].trim();
        
        if (verdict === 'WJ' || verdict === 'WR' || /^\d+\/\d+/.test(verdict)) {
          updateSupabase(submissionId, 'Judging', verdict, { url, key, accessToken }, points);
        } else {
          updateSupabase(submissionId, verdict, verdict, { url, key, accessToken }, points);
          clearInterval(interval);
        }
      }
    } catch (e) { console.error('AC Poll Error:', e); }
  }, 5000);
}

async function updateSupabase(id, verdict, details, { url, key, accessToken }, points = 0) {
  await fetch(`${url}/rest/v1/submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 
      'apikey': key, 
      'Authorization': `Bearer ${accessToken || key}`, 
      'Content-Type': 'application/json', 
      'Prefer': 'return=minimal' 
    },
    body: JSON.stringify({ verdict, verdict_details: details, points })
  });
}
