// js/delivery.js (updated)
// Exposes `window.SHIPMENTS` — edit these entries manually to change what `script.js` will show.
//
// Shipment shape (recommended):
// {
//   trackingNumber: "string",
//   from: "City, ST",
//   to: "City, ST",
//   fromCoords: [lat, lng],
//   toCoords: [lat, lng],
//   coords: [lat, lng], // origin legacy
//   weight: "2.0 kg",
//   service: "FedEx Ground",
//   estimatedDelivery: "2025-10-06",
//   activeStep: 0,
//   events: [ { title, time, details }, ... ]
// }

(function () {
  'use strict';

  const MAX_EVENTS = 5;
  const DEFAULT_TITLES = [
    'Label created',
    'Picked up',
    'In transit',
    'Out for delivery',
    'Delivered'
  ];

  // -------------------------
  // Raw, editable shipments
  // -------------------------
  const RAW_SHIPMENTS = [

{

  trackingNumber: "74512317391",
  carrier: "FedEx",
  shipper: "theBalm Cosmetics",
  receiver: "Malina Lahr",
  from: "Dallas, Texas, United States",
  to: "Wisconsin, United States",

  // Geographic coordinates (approximate)
  fromCoords: [32.7767, -96.7970],   // Dallas, TX
  toCoords: [44.5000, -89.5000],     // Central Wisconsin (approx.)

  // Current position (final delivery location)
  coords: [44.5000, -89.5000],
  locationAddress: "Wisconsin, United States",

  weight: "5.6 kg",
  service: "FedEx Ground",
  pickupDate: "Dec 27, 2025 — 15:00 (local time)",
  estimatedDelivery: "Dec 30, 2025",
  activeStep: 2, // 3 = Out for delivery / Delivered-waiting

  events: [
    {
      title: "Shipment information sent to FedEx",
      time: "2025-12-25 — 08:15 (local shipper time)",
      isoTime: "2025-12-25T08:15:00-06:00",
      details: "FedEx received preliminary shipment details from theBalm Cosmetics."
    },
    {
      title: "Picked up",
      time: "2025-12-27 — 15:00 (Dallas, TX)",
      isoTime: "2025-12-27T15:00:00-06:00",
      details: "Package collected by FedEx courier in Dallas, Texas."
    },
    {
      title: "In transit",
      time: "2025-12-27 — 23:10 (in transit)",
      isoTime: "2025-12-27T23:10:00-06:00",
      details: "Departed FedEx sorting hub — currently in transit to Wisconsin."
    },
    {
      title: "Out for delivery",
      time: "2025-12-30 — 09:30 (local time)",
      isoTime: "2025-12-30T09:30:00-06:00",
      details: "With FedEx courier for final delivery in Wisconsin."
    },
    {
      title: "Delivered",
      time: "Awaiting confirmation",
      isoTime: null,
      details: "Awaiting recipient signature/confirmation — delivery in progress."
    }
  ]
},


    {
      trackingNumber: "9A10123484",
      from: "Texas",
      to: "Austin, TX",
      fromCoords: [32.7157, -117.1611],
      toCoords: [30.2672, -97.7431],
      coords: [32.7157, -117.1611],
      locationAddress: "San Diego, CA",
      weight: "1.2 kg",
      service: "FedEx 2Day",
      estimatedDelivery: "Oct 7, 2025",
      activeStep: 1,
      events: [
        { title: "Label created", time: "Oct 1, 2025 — 09:12", details: "Created by sender" },
        { title: "Picked up", time: "Oct 2, 2025 — 14:03", details: "Picked by courier" },
        { title: "In transit", time: "Oct 5, 2025 — 11:26", details: "Cleared outbound sorting" },
        { title: "Out for delivery", time: "In Review", details: "" },
        { title: "Delivered", time: "In Review", details: "" }
      ]
    },

    {
      trackingNumber: "940011020088123456",
      from: "Los Angeles, CA",
      to: "Chicago, IL",
      fromCoords: [34.0522, -118.2437],
      toCoords: [41.8781, -87.6298],
      coords: [34.0522, -118.2437],
      locationAddress: "Los Angeles, CA",
      weight: "3.1 kg",
      service: "FedEx Ground",
      estimatedDelivery: "Oct 9, 2025",
      activeStep: 0,
      events: [
        { title: "Label created", time: "Oct 1, 2025 — 09:12", details: "Label created via portal" },
        { title: "Picked up", time: "Oct 2, 2025 — 14:03", details: "" },
        { title: "In transit", time: "Oct 5, 2025 — 11:26", details: "" },
        { title: "Out for delivery", time: "In Review", details: "" },
        { title: "Delivered", time: "In Review", details: "" }
      ]
    },

    {
      trackingNumber: "EE123456789",
      from: "Miami, FL",
      to: "Orlando, FL",
      fromCoords: [25.7617, -80.1918],
      toCoords: [28.5383, -81.3792],
      coords: [25.7617, -80.1918],
      locationAddress: "Miami, FL",
      weight: "0.7 kg",
      service: "FedEx Express",
      estimatedDelivery: "Oct 5, 2025",
      activeStep: 3,
      events: [
        { title: "Label created", time: "Oct 1, 2025 — 09:12", details: "" },
        { title: "Picked up", time: "Oct 2, 2025 — 14:03", details: "" },
        { title: "In transit", time: "Oct 5, 2025 — 11:26", details: "" },
        { title: "Out for delivery", time: "Oct 5, 2025 — 08:05", details: "Local courier scanning" },
        { title: "Delivered", time: "In Review", details: "" }
      ]
    },

    {
      trackingNumber: "RX987654321",
      from: "Seattle, WA",
      to: "Denver, CO",
      fromCoords: [47.6062, -122.3321],
      toCoords: [39.7392, -104.9903],
      coords: [47.6062, -122.3321],
      locationAddress: "Seattle, WA",
      weight: "5.6 kg",
      service: "FedEx Freight",
      estimatedDelivery: "Oct 8, 2025",
      activeStep: 4,
      events: [
        { title: "Label created", time: "Sep 28, 2025 — 08:00", details: "" },
        { title: "Picked up", time: "Sep 29, 2025 — 13:45", details: "" },
        { title: "In transit", time: "Oct 2, 2025 — 09:30", details: "" },
        { title: "Out for delivery", time: "Oct 4, 2025 — 07:20", details: "" },
        { title: "Delivered", time: "Oct 4, 2025 — 12:14", details: "Signed by recipient" }
      ]
    },

    {
      trackingNumber: "ABCD1234567890",
      from: "Sender City",
      to: "Recipient City",
      fromCoords: [40.7128, -74.0060],
      toCoords: [34.0522, -118.2437],
      coords: [40.7128, -74.0060],
      locationAddress: "New York, NY",
      weight: "2.0 kg",
      service: "FedEx Standard Overnight",
      estimatedDelivery: "Oct 10, 2025",
      activeStep: 2,
      events: [
        { title: "Label created", time: "Oct 1, 2025 — 09:12", details: "" },
        { title: "Picked up", time: "Oct 2, 2025 — 14:03", details: "" },
        { title: "In transit", time: "Oct 5, 2025 — 11:26", details: "" },
        { title: "Out for delivery", time: "In Review", details: "" },
        { title: "Delivered", time: "In Review", details: "" }
      ]
    }

  ];

  // -------------------------
  // Internal helpers
  // -------------------------
  function toStr(v) { return v === undefined || v === null ? '' : String(v); }
  function trimOrEmpty(v) { return toStr(v).trim(); }
  function clampInt(v, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.trunc(n)));
  }

  function normalizeEvents(rawEvents) {
    const out = Array.isArray(rawEvents) ? rawEvents.slice(0, MAX_EVENTS) : [];
    for (let i = 0; i < MAX_EVENTS; i++) {
      const ev = out[i] || {};
      const title = trimOrEmpty(ev.title) || DEFAULT_TITLES[i] || `Step ${i + 1}`;
      const time = (ev.time !== undefined && ev.time !== null) ? String(ev.time).trim() : '—';
      const details = trimOrEmpty(ev.details) || '';
      out[i] = { title, time, details };
    }
    return out;
  }

  function normalizeCoords(raw) {
    if (!raw) return null;
    if (Array.isArray(raw) && raw.length >= 2) {
      const lat = parseFloat(raw[0]);
      const lng = parseFloat(raw[1]);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    if (raw && raw.lat !== undefined && raw.lng !== undefined) {
      const lat = parseFloat(raw.lat);
      const lng = parseFloat(raw.lng);
      if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
    }
    return null;
  }

  function normalizeShipment(raw) {
    if (!raw || typeof raw !== 'object') {
      console.warn('[delivery.js] invalid shipment entry (not an object):', raw);
      raw = {};
    }

    const trackingNumber = trimOrEmpty(raw.trackingNumber);
    if (!trackingNumber) {
      console.warn('[delivery.js] shipment missing trackingNumber:', raw);
    }

    const events = normalizeEvents(raw.events);

    // derive lastUpdate from last event that has a non-empty time
    let lastUpdate = '—';
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i] && events[i].time && events[i].time !== '—') {
        lastUpdate = events[i].time;
        break;
      }
    }

    const active = clampInt(raw.activeStep, 0, MAX_EVENTS - 1);
    const status = (DEFAULT_TITLES[active] || '—');

    // normalize coordinates (accepts arrays or {lat,lng} objects)
    const coords = normalizeCoords(raw.coords || raw);
    const fromCoords = normalizeCoords(raw.fromCoords || raw.from || null);
    const toCoords = normalizeCoords(raw.toCoords || raw.to || null);

    const s = {
      trackingNumber: trackingNumber,
      from: trimOrEmpty(raw.from) || '—',
      to: trimOrEmpty(raw.to) || '—',
      weight: trimOrEmpty(raw.weight) || '—',
      service: trimOrEmpty(raw.service) || '—',
      estimatedDelivery: trimOrEmpty(raw.estimatedDelivery) || '—',
      activeStep: active,
      events: events,
      coords: coords,
      fromCoords: fromCoords || (coords ? coords : null),
      toCoords: toCoords || null,
      lat: coords ? coords[0] : (raw.lat !== undefined ? parseFloat(raw.lat) : undefined),
      lng: coords ? coords[1] : (raw.lng !== undefined ? parseFloat(raw.lng) : undefined),
      locationAddress: trimOrEmpty(raw.locationAddress) || '',
      lastUpdate: lastUpdate,
      status: trimOrEmpty(raw.status) || status
    };

    return s;
  }

  // Build normalized array and attach to window
  const NORMALIZED = RAW_SHIPMENTS.map(normalizeShipment);
  window.SHIPMENTS = NORMALIZED;

  // -------------------------
  // Runtime helpers (optional)
  // -------------------------
  function normalizeTrackingKey(s) {
    return String(s || '').replace(/\s+/g, '').toLowerCase();
  }

  window.deliveryHelpers = {
    /**
     * Add a shipment object at runtime (returns normalized object)
     * Usage: window.deliveryHelpers.add({ trackingNumber: '123', ... })
     */
    add: function (raw) {
      const n = normalizeShipment(raw);
      window.SHIPMENTS.push(n);
      return n;
    },

    /**
     * Find shipment by tracking number (normalized)
     * Usage: window.deliveryHelpers.find('577215117391')
     */
    find: function (tracking) {
      const key = normalizeTrackingKey(tracking);
      return window.SHIPMENTS.find(s => normalizeTrackingKey(s.trackingNumber) === key) || null;
    },

    /**
     * Update shipment (by tracking number). `updates` merged shallowly.
     * Usage: window.deliveryHelpers.update('123', { activeStep: 3 })
     */
    update: function (tracking, updates) {
      const key = normalizeTrackingKey(tracking);
      const idx = window.SHIPMENTS.findIndex(s => normalizeTrackingKey(s.trackingNumber) === key);
      if (idx === -1) return null;
      const merged = Object.assign({}, window.SHIPMENTS[idx], updates || {});
      // re-normalize so events / coords / activeStep remain valid
      const normalized = normalizeShipment(merged);
      window.SHIPMENTS[idx] = normalized;
      return normalized;
    },

    /**
     * Remove a shipment by tracking number.
     */
    remove: function (tracking) {
      const key = normalizeTrackingKey(tracking);
      const idx = window.SHIPMENTS.findIndex(s => normalizeTrackingKey(s.trackingNumber) === key);
      if (idx === -1) return false;
      window.SHIPMENTS.splice(idx, 1);
      return true;
    },

    /**
     * Print a quick summary to the console (dev helper).
     */
    list: function () {
      console.table(window.SHIPMENTS.map(s => ({
        trackingNumber: s.trackingNumber,
        from: s.from,
        to: s.to,
        activeStep: s.activeStep,
        estimatedDelivery: s.estimatedDelivery,
        fromCoords: s.fromCoords,
        toCoords: s.toCoords,
        locationAddress: s.locationAddress
      })));
    }
  };

  // Small console notice so you know the file loaded
  if (typeof console !== 'undefined' && console.info) {
    console.info('[delivery.js] window.SHIPMENTS prepared —', window.SHIPMENTS.length, 'shipment(s).');
    console.info('[delivery.js] Helpers: window.deliveryHelpers (add/find/update/remove/list).');
  }
})();
