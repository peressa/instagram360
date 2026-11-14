/* IndexedDB writes with synchronous recovery drafts for pending state changes. */
function createLocalPersistence({getDatabase, getNamespace, storage, onStatus}) {
  let pending = 0, failed = false, lastSaved = null;
  const versions = new Map();
  const waiters = new Set();
  const prefix = () => 'rio360_draft_' + getNamespace() + '_';
  const report = () => onStatus({pending, failed, lastSaved});
  function put(store, record) {
    const database = getDatabase();
    const journalKey = store === 'state' ? prefix() + record.key : null;
    const version = (versions.get(journalKey) || 0) + 1;
    if(journalKey)versions.set(journalKey, version);
    let draft = null, previousDraft = null, journalWritten = false;
    if (journalKey) {
      try { previousDraft = storage.getItem(journalKey); draft = JSON.stringify(record); storage.setItem(journalKey, draft); journalWritten = true; }
      catch (_) { /* IndexedDB still works when localStorage is full or unavailable. */ }
    }
    pending++; report();
    return new Promise(resolve => {
      let finished = false;
      const finish = success => {
        if (finished) return;
        finished = true; pending--;
        if (!success) failed = true;
        else {
          lastSaved = new Date();
          if (journalKey && versions.get(journalKey) === version) {
            try { if (storage.getItem(journalKey) === (journalWritten ? draft : previousDraft)) storage.removeItem(journalKey); } catch (_) {}
          }
        }
        report(); resolve(success);
        if (!pending) { for(const done of waiters)done();waiters.clear(); }
      };
      try {
        if (!database) return finish(false);
        const transaction = database.transaction(store, 'readwrite');
        transaction.objectStore(store).put(record);
        transaction.oncomplete = () => finish(true);
        transaction.onerror = transaction.onabort = () => finish(false);
      } catch (_) { finish(false); }
    });
  }
  function drafts() {
    const found = [];
    for (const key of ['layout', 'profile', 'view']) {
      try {
        const record = JSON.parse(storage.getItem(prefix() + key) || 'null');
        if (record?.key === key && (key !== 'layout' || Array.isArray(record.tiles))) found.push(record);
      } catch (_) {}
    }
    return found;
  }
  async function recover() {
    const records = drafts();
    for (const record of records) await put('state', record);
    return records.length;
  }
  return {put, drafts, recover, markError() { failed = true; report(); }, resetError() { failed = false; report(); },
    settled() { return pending ? new Promise(resolve=>waiters.add(resolve)) : Promise.resolve(); },
    get unsaved() { return pending > 0 || failed; }};
}
