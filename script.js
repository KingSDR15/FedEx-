// js/script.js (updated — no Google Maps API, "Open in Google Maps" link only)
(function () {
  'use strict';

  /**
   * Configuration
   */
  const MAX_EVENTS = 5;
  const DEFAULT_TITLES = [
    'Label created',
    'Picked up',
    'In transit',
    'Out for delivery',
    'Delivered'
  ];

  const SELECTORS = {
    form: '#track-form',
    input: '#tracking-input',
    btn: '#track-btn',
    timeline: '#timeline',           // legacy fallback
    progress: '#progress-line',      // legacy fallback
    message: '#message-area',
    shipmentNumber: '#shipment-number',
    fromTo: '#from-to',
    weight: '#weight',
    service: '#service',
    estDelivery: '#est-delivery',
    loader: '.loader-overlay',
    roadWrap: '#road-timeline-wrap',
    roadSteps: '#road-steps',
    roadProgress: '#road-progress',
    map: '#map',
    mapLink: '#mapLink',             // optional anchor if present in DOM
    summary: '#summary',
    statusBadge: '#status',
    lastUpdateBrief: '#last-update-brief'
  };

  /**
   * Utilities
   */
  function qs(sel) { return document.querySelector(sel); }
  function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function normalizeTracking(s) {
    return String(s || '').replace(/\s+/g, '').toLowerCase();
  }

  function isValidDate(d) {
    return d instanceof Date && !isNaN(d.getTime());
  }

  function formatDateFlexible(s) {
    if (!s && s !== 0) return '—';
    try {
      const parsed = new Date(s);
      if (isValidDate(parsed)) {
        return parsed.toLocaleString();
      }
    } catch (e) {}
    return String(s).trim() || '—';
  }

  // Prefer page-level loader helper if available
  function showLoader() {
    if (window.showGlobalLoader && typeof window.showGlobalLoader === 'function') {
      try { window.showGlobalLoader(); return; } catch (e) { /* fallback */ }
    }
    const loader = qs(SELECTORS.loader);
    if (loader) loader.style.visibility = 'visible';
  }

  function hideLoader() {
    if (window.hideGlobalLoader && typeof window.hideGlobalLoader === 'function') {
      try { window.hideGlobalLoader(); return; } catch (e) { /* fallback */ }
    }
    const loader = qs(SELECTORS.loader);
    if (loader) loader.style.visibility = 'hidden';
  }

  /**
   * Data helpers — uses global window.SHIPMENTS prepared by delivery.js
   */
  function findShipment(tracking) {
    if (!window.SHIPMENTS || !Array.isArray(window.SHIPMENTS)) return null;
    const normalized = normalizeTracking(tracking);
    if (!normalized) return null;
    let found = window.SHIPMENTS.find(s => normalizeTracking(s.trackingNumber) === normalized);
    if (found) return found;
    found = window.SHIPMENTS.find(s => normalizeTracking(String(s.trackingNumber || '')).includes(normalized));
    return found || null;
  }

  function normalizeEvents(rawEvents) {
    const out = Array.isArray(rawEvents) ? rawEvents.slice(0, MAX_EVENTS) : [];
    for (let i = 0; i < MAX_EVENTS; i++) {
      const evt = out[i] || {};
      const title = (evt.title || DEFAULT_TITLES[i] || `Step ${i + 1}`).trim();
      const rawTime = (evt.time !== undefined ? evt.time : evt.datetime || evt.date || '') || '';
      const time = formatDateFlexible(rawTime);
      out[i] = { title, time, rawTime, details: evt.details || '' };
    }
    return out;
  }

  /**
   * Map link helpers — no API key required.
   * Creates/updates an anchor inside #map which opens Google Maps in a new tab.
   */
  function buildMapsUrlForShipment(shipment) {
    if (!shipment || typeof shipment !== 'object') return '';

    // Prefer directions if both fromCoords + toCoords are provided
    if (Array.isArray(shipment.fromCoords) && shipment.fromCoords.length >= 2 &&
        Array.isArray(shipment.toCoords) && shipment.toCoords.length >= 2) {
      const fromLat = parseFloat(shipment.fromCoords[0]);
      const fromLng = parseFloat(shipment.fromCoords[1]);
      const toLat = parseFloat(shipment.toCoords[0]);
      const toLng = parseFloat(shipment.toCoords[1]);
      if (![fromLat, fromLng, toLat, toLng].some(isNaN)) {
        return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(fromLat + ',' + fromLng)}&destination=${encodeURIComponent(toLat + ',' + toLng)}&travelmode=driving`;
      }
    }

    // Single coords (coords array or lat/lng)
    if (Array.isArray(shipment.coords) && shipment.coords.length >= 2) {
      const lat = parseFloat(shipment.coords[0]);
      const lng = parseFloat(shipment.coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) return `https://www.google.com/maps?q=${lat},${lng}`;
    }
    if (shipment.lat !== undefined && shipment.lng !== undefined) {
      const lat = parseFloat(shipment.lat);
      const lng = parseFloat(shipment.lng);
      if (!isNaN(lat) && !isNaN(lng)) return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    // Address fallback
    if (shipment.locationAddress && String(shipment.locationAddress).trim()) {
      return `https://www.google.com/maps?q=${encodeURIComponent(String(shipment.locationAddress).trim())}`;
    }

    // Nothing usable
    return '';
  }

  function updateMapLink(shipment) {
    const mapWrap = qs(SELECTORS.map);
    if (!mapWrap) return;

    // If there is already an anchor with id mapLink in DOM (user-customized index), reuse it.
    let anchor = qs(SELECTORS.mapLink);

    const url = buildMapsUrlForShipment(shipment);
    if (!url) {
      // No location available — show placeholder text
      mapWrap.innerHTML = 'Map view will appear here after tracking';
      mapWrap.setAttribute('aria-hidden', 'true');
      return;
    }

    mapWrap.setAttribute('aria-hidden', 'false');

    if (!anchor) {
      // create an inline anchor that fills the placeholder area
      anchor = document.createElement('a');
      anchor.id = 'mapLink';
      anchor.target = '_blank';
      anchor.rel = 'noopener';
      anchor.style.display = 'inline-flex';
      anchor.style.alignItems = 'center';
      anchor.style.justifyContent = 'center';
      anchor.style.width = '100%';
      anchor.style.height = '100%';
      anchor.style.padding = '14px';
      anchor.style.borderRadius = '12px';
      anchor.style.textDecoration = 'none';
      anchor.style.fontWeight = '700';
      anchor.style.color = '#4d148c';
      anchor.style.background = '#f6f1fb';
      anchor.style.border = '1px solid #e6dff5';
      anchor.innerText = 'View location on Google Maps';
      // clear existing content, append anchor
      mapWrap.innerHTML = '';
      mapWrap.appendChild(anchor);
    }

    anchor.href = url;
    // Improve visibility on mobile (optionally we can animate or emphasize)
    anchor.innerText = (url.indexOf('dir/?') !== -1) ? 'Click to view location' : 'Open location in Google Maps';
  }

  /**
   * Clear timeline and summary
   */
  function clearUI() {
    const timeline = qs(SELECTORS.timeline);
    const progress = qs(SELECTORS.progress);
    const msg = qs(SELECTORS.message);
    if (timeline) timeline.innerHTML = '';
    if (progress) progress.style.height = '0%';
    if (msg) msg.innerHTML = '';
    qs(SELECTORS.shipmentNumber).textContent = '—';
    qs(SELECTORS.fromTo).textContent = '';
    qs(SELECTORS.weight).textContent = '';
    qs(SELECTORS.service).textContent = '';
    qs(SELECTORS.estDelivery).textContent = '—';
    const mapEl = qs(SELECTORS.map);
    if (mapEl) mapEl.innerHTML = 'Map view will appear here after tracking';
    const statusEl = qs(SELECTORS.statusBadge);
    if (statusEl) statusEl.textContent = '—';
    const lastBrief = qs(SELECTORS.lastUpdateBrief);
    if (lastBrief) lastBrief.textContent = '—';
    const roadWrap = qs(SELECTORS.roadWrap);
    const summaryWrap = qs(SELECTORS.summary);
    if (roadWrap) { roadWrap.classList.add('hidden'); roadWrap.setAttribute('aria-hidden', 'true'); }
    if (summaryWrap) { summaryWrap.classList.add('hidden'); summaryWrap.setAttribute('aria-hidden', 'true'); }
  }

  /**
   * Render a single shipment:
   * - timeline (list of events)
   * - map link (open Google Maps with coords/address)
   * - summary fields
   */
  function renderShipment(shipment) {
    if (!shipment || typeof shipment !== 'object') return;

    const timelineEl = qs(SELECTORS.timeline);
    const messageArea = qs(SELECTORS.message);

    if (messageArea) messageArea.innerHTML = '';

    // normalize events
    const events = normalizeEvents(shipment.events);

    // determine activeStep (clamped)
    let activeStep = Number.isFinite(Number(shipment.activeStep)) ? Number(shipment.activeStep) : 0;
    activeStep = Math.max(0, Math.min(MAX_EVENTS - 1, activeStep));

    // build/refresh road timeline (if renderer exists)
    if (window.renderRoadTimeline && typeof window.renderRoadTimeline === 'function') {
      try {
        window.renderRoadTimeline(events, activeStep);
      } catch (e) {
        console.warn('renderRoadTimeline failed:', e);
      }
    }

    // populate summary (use textContent for safety)
    const snEl = qs(SELECTORS.shipmentNumber);
    if (snEl) snEl.textContent = shipment.trackingNumber || '—';
    const fromToEl = qs(SELECTORS.fromTo);
    if (fromToEl) fromToEl.textContent = `${shipment.from || '—'} · ${shipment.to || '—'}`;
    const weightEl = qs(SELECTORS.weight);
    if (weightEl) weightEl.textContent = shipment.weight || '—';
    const serviceEl = qs(SELECTORS.service);
    if (serviceEl) serviceEl.textContent = shipment.service || '—';
    const estEl = qs(SELECTORS.estDelivery);
    if (estEl) estEl.textContent = shipment.estimatedDelivery || '—';
    const statusEl = qs(SELECTORS.statusBadge);
    if (statusEl) statusEl.textContent = shipment.status || '—';
    const lastBrief = qs(SELECTORS.lastUpdateBrief);
    if (lastBrief) lastBrief.textContent = shipment.lastUpdate || '—';

    // Update map link (no API)
    try {
      updateMapLink(shipment);
    } catch (e) {
      console.warn('updateMapLink failed:', e);
    }

    // accessibility focus
    try {
      const firstDot = document.querySelector('.road-steps .dot, .timeline .dot');
      if (firstDot) {
        firstDot.setAttribute('tabindex', '0');
        firstDot.focus({ preventScroll: true });
      }
    } catch (e) {}
  }

  /**
   * Show not found message and clear UI
   */
  function showNotFound(tracking) {
    const messageArea = qs(SELECTORS.message);
    if (messageArea) {
      messageArea.innerHTML = `<div class="not-found">No shipment found for tracking number <strong>${escapeHtml(tracking)}</strong>. Please check and try again.</div>`;
    }
    clearUI();
  }

  /**
   * Debounce helper
   */
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Init / event wiring
   */
  function init() {
    const form = qs(SELECTORS.form);
    const input = qs(SELECTORS.input);
    const btn = qs(SELECTORS.btn);

    if (!form || !input || !btn) return;

    // ensure loader is hidden eventually (if present)
    hideLoader();

    // enable/disable button based on input length (simple guard)
    function refreshButtonState() {
      const v = String(input.value || '').trim();
      btn.disabled = v.length < 3; // require at least 3 chars
    }
    refreshButtonState();
    input.addEventListener('input', debounce(refreshButtonState, 150));

    // on submit
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const q = input.value.trim();
      if (!q) return;
      // try to find
      showLoader();
      // small timeout to show loader in UI
      setTimeout(() => {
        const shipment = findShipment(q);
        if (shipment) {
          renderShipment(shipment);
        } else {
          showNotFound(q);
        }
        hideLoader();
      }, 160); // keep small delay for visibility
    });

    // keyboard: pressing Escape clears input
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        input.value = '';
        refreshButtonState();
        clearUI();
      }
    });

    // if URL contains q or tracking param -> seed input and submit
    const params = new URLSearchParams(location.search);
    const qParam = params.get('q') || params.get('tracking') || '';
    if (qParam) {
      input.value = qParam;
      refreshButtonState();
      // programmatically submit after microtask so UI settles
      setTimeout(() => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })), 120);
    }
  }

  // content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
