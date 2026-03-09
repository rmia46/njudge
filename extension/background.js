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
    
    // 1. Get CSRF
    const getResp = await fetch(customTestUrl);
    const getHtml = await getResp.text();
    const csrfMatch = getHtml.match(/data-csrf='(.+?)'/);
    if (!csrfMatch) throw new Error('Could not find CSRF token. Log into Codeforces.');
    const csrfToken = csrfMatch[1];

    // 2. Submit
    const formData = new FormData();
    formData.append('csrf_token', csrfToken);
    formData.append('ftaa', '');
    formData.append('bfaa', '');
    formData.append('action', 'submitSolutionFormSubmitted');
    formData.append('programTypeId', languageId);
    formData.append('source', code);
    formData.append('input', input);
    formData.append('_tta', '37');

    const postResp = await fetch(customTestUrl, {
      method: 'POST',
      body: formData
    });

    if (!postResp.ok) throw new Error('Failed to submit custom test');

    // 3. Poll for result
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
      if (attempts > 30) {
        clearInterval(interval);
        reject(new Error('Custom test timed out'));
      }

      try {
        const resp = await fetch(customTestUrl);
        const html = await resp.text();
        
        // CF custom test results are often loaded via a side request or present in the HTML after refresh
        // For simplicity, we check if the output area has changed from "Empty"
        const outputMatch = html.match(/<div id="output"[\s\S]*?><pre>([\s\S]*?)<\/pre>/);
        if (outputMatch && outputMatch[1].trim() !== '' && !outputMatch[1].includes('Running')) {
          const timeMatch = html.match(/Time: (\d+) ms/);
          const memoryMatch = html.match(/Memory: (\d+) KB/);
          
          clearInterval(interval);
          resolve({
            output: outputMatch[1].trim(),
            time: timeMatch ? timeMatch[1] : '0',
            memory: memoryMatch ? memoryMatch[1] : '0'
          });
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
      if (!match) throw new Error('Invalid Codeforces Problem ID format (e.g., 123A)');
      
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
          if (!finalUrl.includes(contestId) || !finalUrl.toLowerCase().includes(problemIndex.toLowerCase())) {
            console.warn('Background: CF Redirect detected, ID mismatch', finalUrl, id);
            continue;
          }

          const html = await response.text();
          
          // 1. Title
          const divMatch = html.match(/<div class="title">(.+?)<\/div>/);
          let title = '';
          if (divMatch) {
            title = divMatch[1].replace(/^[A-Z]\d*\.\s+/, '').trim();
          } else {
            const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/);
            if (titleTagMatch) {
              title = titleTagMatch[1].replace(/- Codeforces/i, '').trim();
              title = title.replace(/^[A-Z]\d*\.\s+/, '').trim();
              title = title.replace(/^Problem\s+-\s+\d+[A-Z]\d*\s+-\s+/i, '').trim();
            }
          }

          // 2. Statement & Metadata (Codeforces)
          let statementHtml = '';
          let timeLimit = '1.0 second';
          let memoryLimit = '256 megabytes';

          const statementMatch = html.match(/<div class="problem-statement">([\s\S]*?)<\/div>\s*<script/);
          if (statementMatch) {
            statementHtml = statementMatch[1];
            
            // Extract metadata from headers
            const tMatch = statementHtml.match(/<div class="time-limit">[\s\S]*?<div class="property-title">[\s\S]*?<\/div>(.+?)<\/div>/);
            const mMatch = statementHtml.match(/<div class="memory-limit">[\s\S]*?<div class="property-title">[\s\S]*?<\/div>(.+?)<\/div>/);
            
            if (tMatch) timeLimit = tMatch[1].trim();
            if (mMatch) memoryLimit = mMatch[1].trim();

            // Remove the header
            statementHtml = statementHtml.replace(/<div class="header">[\s\S]*?<\/div>/, '');
          } else {
            const fallbackMatch = html.match(/<div class="title">[\s\S]*?<\/div>([\s\S]*?)<div class="sample-tests">/);
            if (fallbackMatch) statementHtml = fallbackMatch[1];
          }

          if (title) {
            return { title, url: finalUrl, statementHtml, timeLimit, memoryLimit };
          }
        } catch (e) { console.error('CF URL attempt failed', e); }
      }
      throw new Error('Problem Not Found');
    }
    
    if (oj === 'AC') {
      const match = id.match(/^([a-z0-9]+)_([a-z0-9]+)$/);
      if (!match) throw new Error('Invalid AtCoder Problem ID format (e.g., abc344_a)');
      
      const contestId = match[1];
      const targetUrl = `https://atcoder.jp/contests/${contestId}/tasks/${id}`;

      console.log('Background: Fetching AC URL', targetUrl);
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error(`AtCoder returned ${response.status}`);
      const html = await response.text();
      
      // 1. Title
      let title = 'Unknown Title';
      const titleTagMatch = html.match(/<title>([\s\S]*?)<\/title>/);
      if (titleTagMatch) {
        const parts = titleTagMatch[1].split(' - ');
        if (parts.length >= 2) title = parts[1].trim();
      }

      // 2. Statement & Metadata (AtCoder)
      let statementHtml = '';
      let timeLimit = '2.0 sec';
      let memoryLimit = '1024 MB';

      const statementMatch = html.match(/<div id="task-statement">([\s\S]*?)<span class="lang-jp">/);
      const fallbackStatementMatch = html.match(/<div id="task-statement">([\s\S]*?)<\/div>\s*<div class="button-pannel">/);
      const simpleStatementMatch = html.match(/<div id="task-statement">([\s\S]*?)<\/div>/);
      
      if (statementMatch) statementHtml = statementMatch[1];
      else if (fallbackStatementMatch) statementHtml = fallbackStatementMatch[1];
      else if (simpleStatementMatch) statementHtml = simpleStatementMatch[1];

      // Extract AtCoder limits from the page text
      const acLimitMatch = html.match(/Time Limit: (.*?) \/ Memory Limit: (.*?)<\/p>/);
      if (acLimitMatch) {
        timeLimit = acLimitMatch[1].trim();
        memoryLimit = acLimitMatch[2].trim();
      }

      // Clean up AC statement
      statementHtml = statementHtml.replace(/<span class="lang-en">([\s\S]*?)<\/span>/, '$1');
      statementHtml = statementHtml.replace(/<span class="lang-ja">[\s\S]*?<\/span>/g, '');
      
      return { title, url: targetUrl, statementHtml, timeLimit, memoryLimit };
    }
  } catch (err) {
    console.error('Background: Scrape error:', err);
    throw err;
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
