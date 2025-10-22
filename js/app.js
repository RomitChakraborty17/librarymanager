// Simple client-side library manager using localStorage
document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'web-library-books';
  let books = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

  const form = document.getElementById('bookForm');
  const tbody = document.querySelector('#books tbody');
  const search = document.getElementById('search');
  const clearStorage = document.getElementById('clearStorage');
  const exportBtn = document.getElementById('exportJson');
  const importFile = document.getElementById('importFile');
  const cancelEdit = document.getElementById('cancelEdit');
  const toast = document.getElementById('toast');

  if (!form || !tbody) {
    console.error('web-library: required DOM elements missing');
    return;
  }

  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(books)); }
  function showToast(msg, ms = 2200){ if(!toast) return; toast.textContent = msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), ms); }

  function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function render(filter=''){
    tbody.innerHTML='';
    const rows = books.filter(b => (b.title + ' ' + b.author).toLowerCase().includes(filter.toLowerCase()));
    for(const b of rows){
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${escapeHtml(b.title)}</td><td>${escapeHtml(b.author)}</td><td>${escapeHtml(b.year||'')}</td><td>
        <button class="action" data-id="${b.id}" data-action="edit">Edit</button>
        <button class="action" data-id="${b.id}" data-action="delete">Delete</button>
      </td>`;
      tbody.appendChild(tr);
    }
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const titleEl = document.getElementById('title');
    const authorEl = document.getElementById('author');
    const yearEl = document.getElementById('year');
    if(!titleEl || !authorEl || !yearEl) return;
    const title = titleEl.value.trim();
    const author = authorEl.value.trim();
    const year = yearEl.value.trim();
    if(!title || !author) return showToast('Title and Author are required');

    const idField = form.getAttribute('data-edit-id');
    if(idField){
      const idx = books.findIndex(x=>x.id===idField);
      if(idx>=0){ books[idx].title = title; books[idx].author = author; books[idx].year = year; showToast('Updated'); }
      form.removeAttribute('data-edit-id');
      cancelEdit?.classList.add('hidden');
    } else {
      books.push({ id: Date.now().toString(36), title, author, year });
      showToast('Added');
    }
    save(); render(search?.value || '');
    form.reset();
  });

  tbody.addEventListener('click', e=>{
    const btn = e.target.closest('button'); if(!btn) return;
    const id = btn.dataset.id; const action = btn.dataset.action;
    if(action==='delete'){ if(confirm('Delete this book?')){ books = books.filter(b=>b.id!==id); save(); render(search?.value || ''); showToast('Deleted'); } }
    if(action==='edit'){ const b = books.find(x=>x.id===id); if(!b) return; document.getElementById('title').value = b.title; document.getElementById('author').value = b.author; document.getElementById('year').value = b.year || ''; form.setAttribute('data-edit-id', b.id); cancelEdit?.classList.remove('hidden'); }
  });

  search?.addEventListener('input', ()=> render(search.value));
  clearStorage?.addEventListener('click', ()=>{ if(confirm('Clear all books?')){ books=[]; save(); render(); showToast('Cleared'); } });

  // Export/Import
  exportBtn?.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(books, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'books.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    showToast('Exported');
  });

  importFile?.addEventListener('change', async (ev)=>{
    const f = ev.target.files && ev.target.files[0]; if(!f) return;
    try{
      const txt = await f.text(); const arr = JSON.parse(txt);
      if(!Array.isArray(arr)) throw new Error('Invalid file');
      // validate minimal shape
      arr.forEach(x=>{ if(!x.title || !x.author) throw new Error('Invalid item'); });
      books = arr.map(x=>({ id: x.id || Date.now().toString(36), title: x.title, author: x.author, year: x.year }));
      save(); render(); showToast('Imported');
    }catch(err){ alert('Import failed: ' + err.message); }
    importFile.value = '';
  });

  cancelEdit?.addEventListener('click', ()=>{ form.removeAttribute('data-edit-id'); form.reset(); cancelEdit.classList.add('hidden'); showToast('Edit canceled'); });

  render();
});
