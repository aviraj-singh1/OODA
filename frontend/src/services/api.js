/**
 * OODA API Service
 * Centralized API client for all backend endpoints.
 * Phase 3: Added agent analysis endpoints.
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
export const getLatestSignal = () => api.get('/signals/latest');
export const createSignal = (data) => api.post('/signals', data);
export const classifySignal = (id) => api.get(`/signals/${id}/classify`);

// ── Entropy ─────────────────────────────────────────────────────────────────────

export const getCurrentEntropy = (windowHours) =>
  api.get('/entropy/current', { params: windowHours ? { window_hours: windowHours } : {} });
export const getEntropyComponents = (windowHours) =>
  api.get('/entropy/components', { params: windowHours ? { window_hours: windowHours } : {} });
export const getEntropyHistory = () => api.get('/entropy/history');

// ── Agents ──────────────────────────────────────────────────────────────────────

export const runAgents = (signalId, force = false) =>
  api.post(`/agents/run/${signalId}${force ? '?force=true' : ''}`);
export const getAgentVerdicts = (signalId) => api.get(`/agents/verdicts/${signalId}`);
export const getLatestAgentVerdicts = () => api.get('/agents/latest');
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
export const getCompetitorGenomes = () => api.get('/competitors/genomes');
export const getCompetitorGenome = (id) => api.get(`/competitors/${id}/genome`);

export default api;
