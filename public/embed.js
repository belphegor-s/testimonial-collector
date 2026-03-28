(function () {
  var containers = document.querySelectorAll('[data-testimonial-campaign]');

  containers.forEach(async function (container) {
    var campaignId = container.getAttribute('data-testimonial-campaign');
    var origin = container.getAttribute('data-origin') || window.location.origin;
    var theme = container.getAttribute('data-theme') || 'light';
    var layout = container.getAttribute('data-layout') || 'masonry';
    var columns = container.getAttribute('data-columns') || '3';
    var maxItems = parseInt(container.getAttribute('data-max') || '50', 10);
    var showRating = container.getAttribute('data-show-rating') !== 'false';
    var showDate = container.getAttribute('data-show-date') === 'true';
    var showVideo = container.getAttribute('data-show-video') !== 'false';
    var accentColor = container.getAttribute('data-accent') || null;
    var radius = container.getAttribute('data-radius') || '16';
    var fontFamily = container.getAttribute('data-font') || "-apple-system,BlinkMacSystemFont,'Segoe UI','Inter',sans-serif";
    var animation = container.getAttribute('data-animation') || 'none'; // none | fade | marquee
    var autoplay = container.getAttribute('data-autoplay') || ''; // ms interval for carousel
    var speed = parseInt(container.getAttribute('data-speed') || '40', 10); // marquee speed value
    var direction = container.getAttribute('data-direction') || 'left'; // left | right
    var pauseHover = container.getAttribute('data-pause-hover') !== 'false'; // default true

    var response;
    try {
      var res = await fetch(origin + '/api/embed/' + campaignId);
      response = await res.json();
    } catch (e) { return; }

    var testimonials = (response.testimonials || []).slice(0, maxItems);
    var campaign = response.campaign || {};
    if (!testimonials.length) return;

    // HTML-escape helper to prevent XSS from user content
    function esc(s) {
      var d = document.createElement('div');
      d.appendChild(document.createTextNode(s || ''));
      return d.innerHTML;
    }

    function contrastTextColor(hex) {
      var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#fff';
    }
    var accent = accentColor || campaign.brand_color || '#6366f1';
    var uid = 'tcw-' + Math.random().toString(36).slice(2, 8);
    container.id = uid;

    // ── Theme colors ─────────────────────────────────────
    var c = theme === 'dark' ? {
      bg: '#09090b', cardBg: '#18181b', cardBorder: '#27272a', cardShadow: '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)',
      cardHoverShadow: '0 12px 32px rgba(0,0,0,0.4)', text: '#fafafa', textSec: '#a1a1aa', textMuted: '#71717a',
      starFill: '#facc15', starEmpty: '#3f3f46', quoteBg: accent + '20', quoteColor: accent,
      badgeText: '#52525b', videoOverlay: 'rgba(0,0,0,0.55)',
    } : {
      bg: 'transparent', cardBg: '#ffffff', cardBorder: '#f0f0f2', cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03)',
      cardHoverShadow: '0 8px 30px rgba(0,0,0,0.08)', text: '#18181b', textSec: '#52525b', textMuted: '#a1a1aa',
      starFill: '#f59e0b', starEmpty: '#e4e4e7', quoteBg: accent + '0a', quoteColor: accent,
      badgeText: '#a1a1aa', videoOverlay: 'rgba(0,0,0,0.40)',
    };

    var rad = parseInt(radius);

    // ── Build styles ──────────────────────────────────────
    var css = '';
    css += '#' + uid + '{font-family:' + fontFamily + ';position:relative;}\n';

    // Card base
    css += '#' + uid + ' .tcw-card{background:' + c.cardBg + ';border:1px solid ' + c.cardBorder + ';border-radius:' + rad + 'px;padding:24px;box-sizing:border-box;display:flex;flex-direction:column;';
    css += 'box-shadow:' + c.cardShadow + ';transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s cubic-bezier(.4,0,.2,1);}\n';
    css += '#' + uid + ' .tcw-card:hover{transform:translateY(-3px);box-shadow:' + c.cardHoverShadow + ';}\n';

    // Masonry
    css += '#' + uid + ' .tcw-masonry{column-count:' + columns + ';column-gap:16px;}\n';
    css += '#' + uid + ' .tcw-masonry .tcw-card{break-inside:avoid;margin-bottom:16px;}\n';
    css += '@media(max-width:900px){#' + uid + ' .tcw-masonry{column-count:2;}}\n';
    css += '@media(max-width:560px){#' + uid + ' .tcw-masonry{column-count:1;}}\n';

    // Carousel
    css += '#' + uid + ' .tcw-carousel{display:flex;gap:16px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding:4px 0 16px;}\n';
    css += '#' + uid + ' .tcw-carousel::-webkit-scrollbar{display:none;}\n';
    css += '#' + uid + ' .tcw-carousel .tcw-card{width:320px;scroll-snap-align:start;flex-shrink:0;}\n';

    // List
    css += '#' + uid + ' .tcw-list{display:flex;flex-direction:column;gap:16px;max-width:640px;margin:0 auto;}\n';

    // Marquee
    css += '#' + uid + ' .tcw-marquee-wrap{overflow:hidden;position:relative;}\n';
    var dur = Math.max(3, 55 - speed);
    css += '#' + uid + ' .tcw-marquee-track{display:flex;width:max-content;will-change:transform;animation:tcw-scroll-' + uid + ' ' + dur + 's linear infinite' + (direction === 'right' ? ' reverse' : '') + ';}\n';
    if (pauseHover) css += '#' + uid + ' .tcw-marquee-wrap:hover .tcw-marquee-track{animation-play-state:paused;}\n';
    css += '#' + uid + ' .tcw-marquee-track .tcw-card{width:320px;flex-shrink:0;margin-right:16px;}\n';
    css += '@keyframes tcw-scroll-' + uid + '{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}\n';

    // Fade animation
    css += '#' + uid + ' .tcw-fade-card{opacity:0;transform:translateY(20px);transition:opacity .5s ease,transform .5s ease;}\n';
    css += '#' + uid + ' .tcw-fade-card.tcw-visible{opacity:1;transform:translateY(0);}\n';

    // Quote icon
    css += '#' + uid + ' .tcw-quote{width:36px;height:36px;border-radius:10px;background:' + c.quoteBg + ';display:flex;align-items:center;justify-content:center;margin-bottom:16px;}\n';
    css += '#' + uid + ' .tcw-quote svg{width:16px;height:16px;}\n';

    // Stars
    css += '#' + uid + ' .tcw-stars{display:flex;gap:2px;margin-bottom:14px;}\n';
    css += '#' + uid + ' .tcw-star{width:16px;height:16px;}\n';

    // Text
    css += '#' + uid + ' .tcw-text{font-size:14.5px;color:' + c.text + ';line-height:1.75;margin:0 0 20px;font-weight:400;flex:1;}\n';

    // Author
    css += '#' + uid + ' .tcw-author{display:flex;align-items:center;gap:12px;margin-top:auto;}\n';
    css += '#' + uid + ' .tcw-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:' + contrastTextColor(accent) + ';flex-shrink:0;';
    css += 'background:linear-gradient(135deg,' + accent + ',' + accent + 'aa);}\n';
    css += '#' + uid + ' .tcw-name{font-size:14px;font-weight:600;color:' + c.text + ';}\n';
    css += '#' + uid + ' .tcw-title{font-size:12px;color:' + c.textMuted + ';margin-top:2px;}\n';
    css += '#' + uid + ' .tcw-date{font-size:11px;color:' + c.textMuted + ';margin-top:2px;}\n';

    // Video
    css += '#' + uid + ' .tcw-vid{position:relative;border-radius:' + Math.max(rad - 6, 8) + 'px;overflow:hidden;margin-bottom:16px;cursor:pointer;background:#000;}\n';
    css += '#' + uid + ' .tcw-vid video{width:100%;display:block;max-height:220px;object-fit:cover;}\n';
    css += '#' + uid + ' .tcw-vid-ov{position:absolute;inset:0;background:linear-gradient(0deg,' + c.videoOverlay + ' 0%,transparent 60%);display:flex;align-items:center;justify-content:center;transition:opacity .2s;}\n';
    css += '#' + uid + ' .tcw-vid.playing .tcw-vid-ov{opacity:0;pointer-events:none;}\n';
    css += '#' + uid + ' .tcw-vid:hover .tcw-vid-ov{opacity:1;pointer-events:auto;}\n';
    css += '#' + uid + ' .tcw-play{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.95);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.2);transition:transform .15s;}\n';
    css += '#' + uid + ' .tcw-play:hover{transform:scale(1.1);}\n';
    css += '#' + uid + ' .tcw-play svg{width:20px;height:20px;color:#18181b;margin-left:2px;}\n';

    // Badge
    css += '#' + uid + ' .tcw-badge{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:24px;padding:10px 16px;font-size:12px;color:' + c.badgeText + ';text-decoration:none;letter-spacing:.3px;transition:opacity .2s;}\n';
    css += '#' + uid + ' .tcw-badge:hover{opacity:.6;}\n';

    // Carousel nav
    css += '#' + uid + ' .tcw-nav{display:flex;justify-content:center;gap:8px;margin-top:16px;}\n';
    css += '#' + uid + ' .tcw-nav button{width:36px;height:36px;border-radius:50%;border:1px solid ' + c.cardBorder + ';background:' + c.cardBg + ';display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;}\n';
    css += '#' + uid + ' .tcw-nav button:hover{border-color:' + accent + ';}\n';
    css += '#' + uid + ' .tcw-nav button svg{width:16px;height:16px;color:' + c.textMuted + ';}\n';

    // Inject styles
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── SVG helpers ───────────────────────────────────────
    var quoteSVG = '<svg viewBox="0 0 24 24" fill="' + c.quoteColor + '"><path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.2 11 15c0 1.105-.448 2.105-1.172 2.828A4.002 4.002 0 015 19a3.98 3.98 0 01-.417-1.679zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.2 21 15c0 1.105-.448 2.105-1.172 2.828A4.002 4.002 0 0115 19a3.98 3.98 0 01-.417-1.679z"/></svg>';

    function starSVG(fill) {
      return '<svg class="tcw-star" viewBox="0 0 20 20" fill="' + fill + '"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
    }

    var playSVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14.72a1 1 0 001.5.86l11.28-7.36a1 1 0 000-1.72L9.5 4.28A1 1 0 008 5.14z"/></svg>';

    // ── Build card HTML ──────────────────────────────────
    function buildCard(t, idx) {
      var card = document.createElement('div');
      card.className = 'tcw-card' + (animation === 'fade' ? ' tcw-fade-card' : '');
      if (animation === 'fade') card.style.transitionDelay = (idx * 80) + 'ms';

      var h = '';

      // Quote icon
      h += '<div class="tcw-quote">' + quoteSVG + '</div>';

      // Stars
      if (showRating && t.rating) {
        h += '<div class="tcw-stars">';
        for (var i = 1; i <= 5; i++) h += starSVG(i <= t.rating ? c.starFill : c.starEmpty);
        h += '</div>';
      }

      // Video
      if (showVideo && t.content_type === 'video' && t.video_url) {
        h += '<div class="tcw-vid" data-tcw-v>';
        h += '<video src="' + esc(t.video_url) + '" preload="metadata" playsinline></video>';
        h += '<div class="tcw-vid-ov"><div class="tcw-play">' + playSVG + '</div></div>';
        h += '</div>';
      }

      // Text
      var txt = t.text_content || t.ai_summary || '';
      if (txt) {
        var display = txt.length > 200 && layout !== 'list' ? txt.slice(0, 200) + '\u2026' : txt;
        h += '<p class="tcw-text">\u201c' + esc(display) + '\u201d</p>';
      }

      // Author
      var initials = t.customer_name ? t.customer_name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase() : '?';
      h += '<div class="tcw-author">';
      h += '<div class="tcw-avatar">' + esc(initials) + '</div><div>';
      h += '<div class="tcw-name">' + esc(t.customer_name || 'Anonymous') + '</div>';
      if (t.customer_title) h += '<div class="tcw-title">' + esc(t.customer_title) + '</div>';
      if (showDate && t.created_at) {
        var d = new Date(t.created_at);
        h += '<div class="tcw-date">' + d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) + '</div>';
      }
      h += '</div></div>';

      card.innerHTML = h;
      return card;
    }

    // ── Render layout ────────────────────────────────────
    var wrapper;

    if (animation === 'marquee') {
      // Marquee: horizontal infinite scroll
      var outer = document.createElement('div');
      outer.className = 'tcw-marquee-wrap';
      var track = document.createElement('div');
      track.className = 'tcw-marquee-track';
      // Duplicate enough times so track is >= 2x viewport width for seamless loop
      var cardSlot = 320 + 16; // card width + gap
      var viewW = window.innerWidth || 1200;
      var minCards = Math.ceil((viewW * 2) / cardSlot);
      var copies = Math.max(2, Math.ceil(minCards / testimonials.length));
      if (copies % 2 !== 0) copies++;
      for (var pass = 0; pass < copies; pass++) {
        testimonials.forEach(function(t, idx) { track.appendChild(buildCard(t, idx)); });
      }
      outer.appendChild(track);
      container.appendChild(outer);
      wrapper = outer;
    } else if (layout === 'carousel') {
      wrapper = document.createElement('div');
      wrapper.className = 'tcw-carousel';
      testimonials.forEach(function(t, idx) { wrapper.appendChild(buildCard(t, idx)); });
      container.appendChild(wrapper);

      // Nav buttons
      var nav = document.createElement('div');
      nav.className = 'tcw-nav';
      nav.innerHTML = '<button data-d="-1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7"/></svg></button>'
        + '<button data-d="1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button>';
      container.appendChild(nav);
      nav.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() {
          wrapper.scrollBy({ left: parseInt(btn.getAttribute('data-d')) * 340, behavior: 'smooth' });
        });
      });

      // Autoplay
      if (autoplay) {
        var interval = parseInt(autoplay) || 3000;
        var autoTimer = setInterval(function() {
          wrapper.scrollBy({ left: 340, behavior: 'smooth' });
          // Loop back when near end
          if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 10) {
            setTimeout(function() { wrapper.scrollTo({ left: 0, behavior: 'smooth' }); }, interval / 2);
          }
        }, interval);
        wrapper.addEventListener('mouseenter', function() { clearInterval(autoTimer); });
        wrapper.addEventListener('mouseleave', function() {
          autoTimer = setInterval(function() {
            wrapper.scrollBy({ left: 340, behavior: 'smooth' });
            if (wrapper.scrollLeft + wrapper.clientWidth >= wrapper.scrollWidth - 10) {
              setTimeout(function() { wrapper.scrollTo({ left: 0, behavior: 'smooth' }); }, interval / 2);
            }
          }, interval);
        });
      }
    } else if (layout === 'list') {
      wrapper = document.createElement('div');
      wrapper.className = 'tcw-list';
      testimonials.forEach(function(t, idx) { wrapper.appendChild(buildCard(t, idx)); });
      container.appendChild(wrapper);
    } else {
      // Masonry (default)
      wrapper = document.createElement('div');
      wrapper.className = 'tcw-masonry';
      testimonials.forEach(function(t, idx) { wrapper.appendChild(buildCard(t, idx)); });
      container.appendChild(wrapper);
    }

    // ── Fade animation (IntersectionObserver) ────────────
    if (animation === 'fade') {
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('tcw-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      container.querySelectorAll('.tcw-fade-card').forEach(function(el) { observer.observe(el); });
    }

    // ── Video player controls ────────────────────────────
    container.querySelectorAll('[data-tcw-v]').forEach(function(wrap) {
      var video = wrap.querySelector('video');
      wrap.addEventListener('click', function() {
        if (video.paused) {
          container.querySelectorAll('[data-tcw-v] video').forEach(function(v) {
            if (v !== video) { v.pause(); v.parentElement.classList.remove('playing'); }
          });
          video.play(); wrap.classList.add('playing');
        } else {
          video.pause(); wrap.classList.remove('playing');
        }
      });
      video.addEventListener('ended', function() { wrap.classList.remove('playing'); });
    });

    // ── Powered-by badge ─────────────────────────────────
    var badge = document.createElement('a');
    badge.href = origin;
    badge.className = 'tcw-badge';
    badge.target = '_blank';
    badge.rel = 'noopener';
    badge.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> Powered by Testimonial Collector';
    container.appendChild(badge);
  });
})();
