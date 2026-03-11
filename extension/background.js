// background.js
console.log('nJudge Bridge Extension Background Script Loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received request:', request.type);

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

  if (request.type === 'NJUDGE_CUSTOM_TEST') {
    handleCustomTest(request.payload)
      .then(data => sendResponse({ status: 'success', data }))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true;
  }

  return true;
});

async function handleCustomTest({ oj, code, languageId, input }) {
  if (oj === 'CF') {
    const customTestUrl = 'https://codeforces.com/customtest';
    const getResp = await fetch(customTestUrl);
    const getHtml = await getResp.text();
    const csrfMatch = getHtml.match(/data-csrf='(.+?)'/);
    if (!csrfMatch) throw new Error('Could not find CSRF token. Log into Codeforces.');
    const csrfToken = csrfMatch[1];

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
  throw new Error('Custom test only supported for Codeforces currently');
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
      if (!match) throw new Error('Invalid Codeforces ID');
      const contestId = match[1];
      const problemIndex = match[2];
      const urls = [
        `https://codeforces.com/contest/${contestId}/problem/${problemIndex}`,
        `https://codeforces.com/problemset/problem/${contestId}/${problemIndex}`
      ];

      for (const targetUrl of urls) {
        try {
          const response = await fetch(targetUrl);
          if (!response.ok) continue;
          const finalUrl = response.url;
          if (!finalUrl.includes(contestId) || !finalUrl.toLowerCase().includes(problemIndex.toLowerCase())) continue;
          const html = await response.text();
          
          const titleMatch = html.match(/<div class="title">(.+?)<\/div>/);
          const title = titleMatch ? titleMatch[1].replace(/^[A-Z]\d*\.\s+/, '').trim() : 'Unknown';

          // Extract EVERYTHING inside the problem statement
          const statementMatch = html.match(/<div class="problem-statement">([\s\S]*?)<\/div>\s*<script/);
          let statementHtml = statementMatch ? statementMatch[1] : '';
          
          // Generic clean: remove only the outer header
          statementHtml = statementHtml.replace(/<div class="header">[\s\S]*?<\/div>/, '');

          const tMatch = html.match(/<div class="time-limit">[\s\S]*?<div class="property-title">[\s\S]*?<\/div>(.+?)<\/div>/);
          const mMatch = html.match(/<div class="memory-limit">[\s\S]*?<div class="property-title">[\s\S]*?<\/div>(.+?)<\/div>/);

          return { title, url: finalUrl, statementHtml, timeLimit: tMatch?.[1].trim(), memoryLimit: mMatch?.[1].trim() };
        } catch (e) { }
      }
      throw new Error('Problem Not Found');
    }
    
    if (oj === 'AC') {
      const match = id.match(/^([a-z0-9]+)_([a-z0-9]+)$/);
      if (!match) throw new Error('Invalid AtCoder ID');
      const contestId = match[1];
      const targetUrl = `https://atcoder.jp/contests/${contestId}/tasks/${id}`;
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`AtCoder Error: ${response.status}`);
      const html = await response.text();
      
      const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleTagMatch?.[1].split(' - ')[1]?.trim() || 'Unknown';

      // Capturing the whole section for AtCoder
      const statementMatch = html.match(/<div id="task-statement">([\s\S]*?)<\/div>\s*<div class="button-pannel">/);
      let statementHtml = statementMatch ? statementMatch[1] : '';

      // Clean AtCoder Japanese sections specifically
      statementHtml = statementHtml.replace(/<span class="lang-ja">[\s\S]*?<\/span>/g, '');
      statementHtml = statementHtml.replace(/<span class="lang-en">([\s\S]*?)<\/span>/, '$1');

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

async function pollCFVerdict(contestId, submissionId, { url, key }) {
  const statusUrl = `https://codeforces.com/contest/${contestId}/my`;
  const interval = setInterval(async () => {
    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      const rowMatch = html.match(/<tr data-submission-id="(\d+)"[\s\S]*?verdict="(.+?)"/);
      if (rowMatch) {
        let v = rowMatch[2];
        if (v.includes('TESTING') || v === 'null' || v === 'IN_QUEUE') {
          updateSupabase(submissionId, 'Judging', v, { url, key });
        } else {
          updateSupabase(submissionId, v, v, { url, key });
          clearInterval(interval);
        }
      }
    } catch (e) { }
  }, 5000);
}

async function pollACVerdict(contestId, submissionId, { url, key }) {
  const statusUrl = `https://atcoder.jp/contests/${contestId}/submissions/me`;
  const interval = setInterval(async () => {
    try {
      const resp = await fetch(statusUrl);
      const html = await resp.text();
      const rowMatch = html.match(/<td class="text-center">[\s\S]*?<span class="label label-[^"]+"[^>]*?>(.+?)<\/span>/);
      if (rowMatch) {
        let v = rowMatch[1].trim();
        if (v === 'WJ' || v === 'WR' || /^\d+\/\d+/.test(v)) {
          updateSupabase(submissionId, 'Judging', v, { url, key });
        } else {
          updateSupabase(submissionId, v, v, { url, key });
          clearInterval(interval);
        }
      }
    } catch (e) { }
  }, 5000);
}

async function updateSupabase(id, verdict, details, { url, key }) {
  await fetch(`${url}/rest/v1/submissions?id=eq.${id}`, {
    method: 'PATCH',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ verdict, verdict_details: details })
  });
}
