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
      .catch(error => {
        console.error('Submission Error:', error);
        sendResponse({ 
          status: 'error', 
          message: error.message,
          code: error.message.includes('Login to') ? 'NEED_LOGIN' : 'SUBMIT_ERROR'
        });
      });
    return true;
  }

  if (request.type === 'NJUDGE_CUSTOM_TEST') {
    handleCustomTest(request.payload)
      .then(data => sendResponse({ status: 'success', data }))
      .catch(error => sendResponse({ status: 'error', message: error.message }));
    return true;
  }

  sendResponse({ status: 'error', message: 'Unknown request type: ' + request.type });
  return false;
});

async function handleCustomTest({ oj, code, languageId, input }) {
  if (oj === 'CF') {
    const customTestUrl = 'https://codeforces.com/customtest';
    const getResp = await fetch(customTestUrl);
    const getHtml = await getResp.text();
    const csrfToken = getHtml.match(/data-csrf='(.+?)'/)?.[1];
    if (!csrfToken) throw new Error('Login to Codeforces');

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
          
          const divMatch = html.match(/<div class="title">[\s\S]*?([A-Z]\d*[\.\s]+)?([^<]+)<\/div>/);
          const title = divMatch ? divMatch[2].trim() : '';

          const startIdx = html.indexOf('<div class="problem-statement">');
          const endIdx = html.indexOf('<script', startIdx);
          let statementHtml = '';
          if (startIdx !== -1 && endIdx !== -1) {
            statementHtml = html.substring(startIdx, endIdx);
          }

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
    
    // Check if we are redirected to login or token is missing
    if (!csrfToken || getHtml.includes('handleOrEmail')) {
      throw new Error('Login to Codeforces first in another tab.');
    }

    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('submittedProblemIndex', problemIndex);
    formData.append('programTypeId', languageId); 
    formData.append('source', code);
    formData.append('_tta', '37');

    const postResp = await fetch(submitUrl + '?enforceRedirect=true', { method: 'POST', body: formData, redirect: 'follow' });
    if (!postResp.ok) throw new Error('CF Submission failed. Check if you are logged in.');
    
    const finalHtml = await postResp.text();
    if (finalHtml.includes('handleOrEmail')) throw new Error('Login to Codeforces session expired.');

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
    
    if (!csrfToken || getHtml.includes('login?')) {
      throw new Error('Login to AtCoder first in another tab.');
    }

    const formData = new FormData();
    formData.append('data.TaskScreenName', problemId);
    formData.append('data.LanguageId', languageId);
    formData.append('sourceCode', code);
    formData.append('csrf_token', csrfToken);

    const postResp = await fetch(submitUrl, { method: 'POST', body: formData, redirect: 'follow' });
    if (!postResp.ok) throw new Error('AC Submission failed. Check login.');
    
    const finalHtml = await postResp.text();
    if (finalHtml.includes('login?')) throw new Error('AtCoder session expired.');

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
