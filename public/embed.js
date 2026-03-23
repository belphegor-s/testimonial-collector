(function () {
  const containers = document.querySelectorAll('[data-testimonial-campaign]');

  containers.forEach(async function (container) {
    const campaignId = container.getAttribute('data-testimonial-campaign');
    // const theme = container.getAttribute('data-theme') || 'grid';
    const origin = container.getAttribute('data-origin') || 'https://your-domain.com';

    let testimonials = [];
    try {
      const res = await fetch(`${origin}/api/embed/${campaignId}`);
      testimonials = await res.json();
    } catch (e) {
      return;
    }

    if (!testimonials.length) return;

    const styles = `
      .tcw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
      .tcw-card { background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; box-sizing: border-box; }
      .tcw-stars { color: #f59e0b; font-size: 14px; margin-bottom: 10px; letter-spacing: 1px; }
      .tcw-text { font-size: 14px; color: #3f3f46; line-height: 1.6; margin: 0 0 16px; }
      .tcw-author { display: flex; align-items: center; gap: 10px; }
      .tcw-avatar { width: 32px; height: 32px; border-radius: 50%; background: #e4e4e7; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; color: #71717a; flex-shrink: 0; }
      .tcw-name { font-size: 13px; font-weight: 600; color: #18181b; }
      .tcw-title { font-size: 12px; color: #a1a1aa; margin-top: 1px; }
      .tcw-video { width: 100%; border-radius: 8px; margin-bottom: 12px; max-height: 180px; object-fit: cover; }
      .tcw-badge { display: inline-block; margin-top: 16px; font-size: 11px; color: #a1a1aa; text-decoration: none; }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);

    const grid = document.createElement('div');
    grid.className = 'tcw-grid';

    testimonials.forEach(function (t) {
      const stars = '★'.repeat(t.rating || 5) + '☆'.repeat(5 - (t.rating || 5));
      const initials = t.customer_name
        ? t.customer_name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : '?';

      const card = document.createElement('div');
      card.className = 'tcw-card';
      card.innerHTML = `
        <div class="tcw-stars">${stars}</div>
        ${t.content_type === 'video' && t.video_url ? `<video class="tcw-video" src="${t.video_url}" controls preload="none"></video>` : ''}
        <p class="tcw-text">${t.text_content || t.ai_summary || ''}</p>
        <div class="tcw-author">
          <div class="tcw-avatar">${initials}</div>
          <div>
            <div class="tcw-name">${t.customer_name}</div>
            ${t.customer_title ? `<div class="tcw-title">${t.customer_title}</div>` : ''}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

    // Powered by badge
    const badge = document.createElement('a');
    badge.href = origin;
    badge.className = 'tcw-badge';
    badge.textContent = 'Powered by Testimonial Collector';
    badge.target = '_blank';

    container.appendChild(grid);
    container.appendChild(badge);
  });
})();
