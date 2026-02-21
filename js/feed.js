// ─────────────────────────────────────────────────────────
//  feed.js — Lógica del Feed de Pauwiter
// ─────────────────────────────────────────────────────────

// ── device_id único por navegador ─────────────────────
function getDeviceId() {
    let id = localStorage.getItem('pw_device_id');
    if (!id) {
        id = 'dev_' + crypto.randomUUID();
        localStorage.setItem('pw_device_id', id);
    }
    return id;
}

const deviceId = getDeviceId();

// ── Tiempo relativo ────────────────────────────────────
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} días`;
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ── Inicial del autor para avatar ─────────────────────
function getInitial(name) {
    return (name && name.trim()) ? name.trim()[0].toUpperCase() : 'A';
}

// ── Leer likes dados por este dispositivo (localStorage) ──
function getLikedPosts() {
    try { return JSON.parse(localStorage.getItem('pw_liked') || '[]'); } catch { return []; }
}
function markLiked(postId) {
    const liked = getLikedPosts();
    if (!liked.includes(postId)) {
        liked.push(postId);
        localStorage.setItem('pw_liked', JSON.stringify(liked));
    }
}

// ── Leer posts reportados por este dispositivo ─────────
function getReportedPosts() {
    try { return JSON.parse(localStorage.getItem('pw_reported') || '[]'); } catch { return []; }
}
function markReported(postId) {
    const reported = getReportedPosts();
    if (!reported.includes(postId)) {
        reported.push(postId);
        localStorage.setItem('pw_reported', JSON.stringify(reported));
    }
}

// ── Skeleton loading ───────────────────────────────────
function renderSkeletons(feed, count = 3) {
    feed.innerHTML = '';
    for (let i = 0; i < count; i++) {
        feed.innerHTML += `
      <article class="skeleton-card">
        <div class="skeleton-line short" style="width:30%; margin-bottom:10px;"></div>
        <div class="skeleton-line long"></div>
        <div class="skeleton-line mid"></div>
        <div class="skeleton-line short" style="width:20%; margin-top:4px;"></div>
      </article>`;
    }
}

// ── Render de una tarjeta paw ──────────────────────────
function renderPaw(post, likedPosts, reportedPosts) {
    const isLiked = likedPosts.includes(post.id);
    const isReported = reportedPosts.includes(post.id);
    const name = post.author_name || 'Anónimo';

    const card = document.createElement('article');
    card.className = 'paw-card';
    card.dataset.id = post.id;

    card.innerHTML = `
    <div class="paw-header">
      <div class="paw-avatar">${getInitial(name)}</div>
      <div class="paw-meta">
        <div class="paw-author">${escapeHtml(name)}</div>
        <div class="paw-time">${timeAgo(post.created_at)}</div>
      </div>
    </div>
    <p class="paw-content">${escapeHtml(post.content)}</p>
    <div class="paw-actions">
      <button
        class="btn-like ${isLiked ? 'liked' : ''}"
        data-post="${post.id}"
        ${isLiked ? 'disabled' : ''}
        aria-label="Dar like">
        👍 <span class="like-count">${post.like_count}</span>
      </button>
      <button
        class="btn-report ${isReported ? 'reported' : ''}"
        data-post="${post.id}"
        ${isReported ? 'disabled' : ''}
        aria-label="Reportar">
        ${isReported ? '🚩 Reportado' : '⚑ Reportar'}
      </button>
    </div>`;

    return card;
}

// ── Escape HTML ────────────────────────────────────────
function escapeHtml(str) {
    const el = document.createElement('div');
    el.textContent = str;
    return el.innerHTML;
}

// ── Toast ──────────────────────────────────────────────
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
}

// ── Cargar feed ────────────────────────────────────────
async function loadFeed() {
    const feed = document.getElementById('feed');
    renderSkeletons(feed);

    const { data: posts, error } = await db
        .from('posts')
        .select('*')
        .eq('is_hidden', false)
        .order('created_at', { ascending: false });

    if (error) {
        feed.innerHTML = `<div class="empty-state">
      <div class="empty-icon">⚠️</div>
      <p>Error al cargar los paws. Intenta de nuevo.</p>
    </div>`;
        console.error(error);
        return;
    }

    if (!posts || posts.length === 0) {
        feed.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🐾</div>
      <p>Aún no hay paws. ¡Sé el primero!</p>
      <a href="new.html">+ Publicar paw</a>
    </div>`;
        return;
    }

    const likedPosts = getLikedPosts();
    const reportedPosts = getReportedPosts();

    feed.innerHTML = '';
    posts.forEach(post => feed.appendChild(renderPaw(post, likedPosts, reportedPosts)));
}

// ── Handler de Like ────────────────────────────────────
async function handleLike(btn) {
    const postId = btn.dataset.post;
    btn.disabled = true;
    btn.textContent = '⏳ Enviando like…';

    // Insertar en likes
    const { error: likeErr } = await db
        .from('likes')
        .insert({ post_id: postId, device_id: deviceId });

    if (likeErr) {
        // Restricción UNIQUE = ya tenía like
        showToast('Ya le diste Like de Pau a este paw 😊');
        btn.disabled = false;
        btn.innerHTML = `👍 <span class="like-count">${btn.querySelector('.like-count')?.textContent || ''}</span>`;
        return;
    }

    // Incrementar like_count
    const card = document.querySelector(`.paw-card[data-id="${postId}"]`);
    const countEl = card?.querySelector('.like-count');
    const currentCount = parseInt(countEl?.textContent || '0', 10);
    const newCount = currentCount + 1;

    await db.from('posts').update({ like_count: newCount }).eq('id', postId);

    // Actualizar UI
    if (countEl) countEl.textContent = newCount;
    btn.classList.add('liked');
    btn.innerHTML = `👍 <span class="like-count">${newCount}</span>`;
    markLiked(postId);
    showToast('¡Like de Pau enviado! 🐾');
}

// ── Handler de Reporte ─────────────────────────────────
async function handleReport(btn) {
    const postId = btn.dataset.post;
    if (!confirm('¿Quieres reportar este paw?')) return;

    btn.disabled = true;
    btn.textContent = '⏳ Enviando…';

    const { error: repErr } = await db
        .from('reports')
        .insert({ post_id: postId, device_id: deviceId });

    if (repErr) {
        showToast('Ya reportaste este paw anteriormente.');
        btn.disabled = false;
        btn.textContent = '⚑ Reportar';
        return;
    }

    // Leer report_count actual
    const { data: postData } = await db
        .from('posts')
        .select('report_count')
        .eq('id', postId)
        .single();

    const newReportCount = (postData?.report_count || 0) + 1;
    const shouldHide = newReportCount >= 3;

    await db.from('posts')
        .update({ report_count: newReportCount, ...(shouldHide && { is_hidden: true }) })
        .eq('id', postId);

    markReported(postId);
    btn.classList.add('reported');
    btn.textContent = '🚩 Reportado';

    if (shouldHide) {
        // Ocultar la tarjeta del DOM con animación
        const card = document.querySelector(`.paw-card[data-id="${postId}"]`);
        if (card) {
            card.style.transition = 'opacity .4s ease, max-height .5s ease';
            card.style.opacity = '0';
            card.style.maxHeight = '0';
            card.style.overflow = 'hidden';
            setTimeout(() => card.remove(), 500);
        }
        showToast('Paw ocultado por múltiples reportes.');
    } else {
        showToast('Paw reportado. Gracias.');
    }
}

// ── Event delegation ───────────────────────────────────
document.getElementById('feed').addEventListener('click', (e) => {
    const likeBtn = e.target.closest('.btn-like');
    const reportBtn = e.target.closest('.btn-report');
    if (likeBtn && !likeBtn.disabled) handleLike(likeBtn);
    if (reportBtn && !reportBtn.disabled) handleReport(reportBtn);
});

// ── Init ───────────────────────────────────────────────
loadFeed();
