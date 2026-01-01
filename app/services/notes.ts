export async function getNotes() {
  const res = await fetch('/api/notes', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch notes');
  return res.json();
}

export async function createNote(note: any) {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('Failed to create note');
  return res.json();
} 