/**
 * OODA API Service
 * Centralized API client for all backend endpoints.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Demo ────────────────────────────────────────────────────────────────────────

export const seedDemo = () => api.post('/demo/seed');
export const triggerPriceDrop = () => api.post('/demo/trigger-price-drop');

// ── Signals ─────────────────────────────────────────────────────────────────────

export const getSignals = (limit = 50) => api.get(`/signals?limit=${limit}`);
export const getSignal = (id) => api.get(`/signals/${id}`);
export const createSignal = (data) => api.post('/signals', data);

// ── Entropy ─────────────────────────────────────────────────────────────────────

export const getCurrentEntropy = () => api.get('/entropy/current');
export const getEntropyHistory = () => api.get('/entropy/history');

// ── Agents ──────────────────────────────────────────────────────────────────────

export const runAgents = (signalId) => api.post(`/agents/run/${signalId}`);
export const getVerdicts = (signalId) => api.get(`/agents/verdicts/${signalId}`);
export const getReputations = () => api.get('/agents/reputation');

// ── Debate ──────────────────────────────────────────────────────────────────────

export const runDebate = (signalId) => api.post(`/debate/run/${signalId}`);
export const getLatestDebate = () => api.get('/debate/latest');
export const getDebate = (id) => api.get(`/debate/${id}`);

// ── Counter-Strike ──────────────────────────────────────────────────────────────

export const buildCounterStrike = (signalId) => api.post(`/counter-strike/build/${signalId}`);
export const getLatestPackage = () => api.get('/counter-strike/latest');
export const getPackage = (id) => api.get(`/counter-strike/${id}`);
export const deployPackage = (id) => api.post(`/counter-strike/${id}/deploy`);

// ── Competitors ─────────────────────────────────────────────────────────────────

export const getCompetitors = () => api.get('/competitors');
export const getCompetitor = (id) => api.get(`/competitors/${id}`);

export default api;
