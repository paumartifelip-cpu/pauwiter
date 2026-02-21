// ─────────────────────────────────────────────────────────
//  new.js — Lógica de Crear Paw
// ─────────────────────────────────────────────────────────

const MAX_CHARS = 280;

const textarea = document.getElementById('paw-content');
const charCounter = document.getElementById('char-counter');
const authorInput = document.getElementById('author-name');
const publishBtn = document.getElementById('btn-publish');
const form = document.getElementById('new-paw-form');

// ── Contador de caracteres ─────────────────────────────
textarea.addEventListener('input', () => {
    const len = textarea.value.length;
    charCounter.textContent = `${len} / ${MAX_CHARS}`;

    charCounter.classList.remove('warn', 'danger');
    if (len >= MAX_CHARS) charCounter.classList.add('danger');
    else if (len >= MAX_CHARS * 0.85) charCounter.classList.add('warn');

    publishBtn.disabled = len === 0 || len > MAX_CHARS;
});

// ── Guardar nombre del autor ───────────────────────────
authorInput.addEventListener('input', () => {
    if (authorInput.value.trim()) {
        localStorage.setItem('pw_author_name', authorInput.value.trim());
    }
});

// ── Restaurar nombre del autor ─────────────────────────
const savedName = localStorage.getItem('pw_author_name');
if (savedName) authorInput.value = savedName;

// ── Submit ─────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const content = textarea.value.trim();
    if (!content) {
        showError('El paw no puede estar vacío.');
        return;
    }
    if (content.length > MAX_CHARS) {
        showError(`El paw no puede superar ${MAX_CHARS} caracteres.`);
        return;
    }

    const authorName = authorInput.value.trim() || 'Anónimo';

    // Estado de carga
    publishBtn.disabled = true;
    publishBtn.textContent = 'Publicando…';

    const { error } = await db
        .from('posts')
        .insert({
            author_name: authorName,
            content: content,
        });

    if (error) {
        console.error(error);
        showError('Error al publicar. Intenta de nuevo.');
        publishBtn.disabled = false;
        publishBtn.textContent = 'Publicar';
        return;
    }

    // Éxito → redirigir al feed
    window.location.href = '/';
});

// ── Mostrar error inline ───────────────────────────────
function showError(msg) {
    const existing = document.querySelector('.form-error');
    if (existing) existing.remove();

    const el = document.createElement('p');
    el.className = 'form-error';
    el.style.cssText = 'color:#dc2626;font-size:13px;margin-top:-6px;font-weight:500;';
    el.textContent = msg;
    publishBtn.before(el);

    setTimeout(() => el.remove(), 3000);
}
