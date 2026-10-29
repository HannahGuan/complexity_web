// Explicitly verify DataPipe acceptance before offering Prolific completion.
window.PilotCollection = {
  async upload(payload) {
    const response = await fetch('https://pipe.jspsych.org/api/data/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000)
    });
    const result = await response.json();
    if (![201, 202].includes(response.status) || result.error) {
      throw new Error(result.error || ('HTTP_' + response.status));
    }
    return { status: response.status, queued: response.status === 202 };
  },

  finish({ experimentID, filename, data, completionUrl, backupKey }) {
    const payload = { experimentID, filename, data };
    try { localStorage.setItem(backupKey, JSON.stringify(payload)); } catch (_) {}
    document.body.innerHTML = `<main style="max-width:800px;margin:60px auto;padding:24px;text-align:center;">
      <h1 id="save-heading">Saving your responses</h1>
      <p id="save-status" role="status">Please keep this page open while your responses are submitted.</p>
      <button class="jspsych-btn" id="retry-save" hidden>Retry saving</button>
      <button class="jspsych-btn" id="download-backup" hidden>Download response backup</button>
      <a class="jspsych-btn" id="prolific-completion" hidden>Return to Prolific</a>
    </main>`;
    const retry = document.getElementById('retry-save');
    const backup = document.getElementById('download-backup');
    backup.onclick = function() {
      const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    const submit = async () => {
      retry.hidden = true; backup.hidden = true;
      document.getElementById('save-heading').textContent = 'Saving your responses';
      document.getElementById('save-status').textContent = 'Please keep this page open while your responses are submitted.';
      try {
        await this.upload(payload);
        try { localStorage.removeItem(backupKey); } catch (_) {}
        document.getElementById('save-heading').textContent = 'Thank you for participating!';
        document.getElementById('save-status').textContent = completionUrl
          ? 'Your responses have been accepted. Click below to complete your submission on Prolific.'
          : 'Your responses have been accepted. You may close this window now.';
        if (completionUrl) {
          const link = document.getElementById('prolific-completion');
          link.href = completionUrl; link.hidden = false;
        }
      } catch (error) {
        console.error('DataPipe save failed:', error);
        document.getElementById('save-heading').textContent = 'Your responses have not been confirmed as saved';
        document.getElementById('save-status').textContent =
          'Please retry saving. If the problem continues, download a backup and contact the researcher on Prolific. Please do not repeat the study. Reference: ' + filename;
        retry.hidden = false; backup.hidden = false;
      }
    };
    retry.onclick = submit;
    return submit();
  }
};
