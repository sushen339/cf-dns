const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from the root .env file.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (!process.env.CLOUDFLARE_API_TOKEN) {
  console.warn(
    'Warning: CLOUDFLARE_API_TOKEN is not set. Requests to Cloudflare will fail until it is configured.'
  );
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || [
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ],
    credentials: true
  })
);
app.use(express.json());

// Create a dedicated axios instance pre-configured for the Cloudflare API.
const cloudflareApi = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

/**
 * Simple helper to unwrap the `result` payload from Cloudflare responses.
 * Cloudflare consistently wraps data in `{ success, result, errors, messages }`.
 */
const unwrapResult = (response) => response?.data?.result || [];

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Fetch every zone that belongs to the authenticated Cloudflare account.
app.get('/api/zones', async (_req, res, next) => {
  try {
    const response = await cloudflareApi.get('/zones');
    res.json(unwrapResult(response));
  } catch (error) {
    next(error);
  }
});

// Retrieve DNS records for a given zone.
app.get('/api/zones/:zoneId/dns_records', async (req, res, next) => {
  try {
    const response = await cloudflareApi.get(`/zones/${req.params.zoneId}/dns_records`);
    res.json(unwrapResult(response));
  } catch (error) {
    next(error);
  }
});

// Create a DNS record for a given zone.
app.post('/api/zones/:zoneId/dns_records', async (req, res, next) => {
  try {
    const response = await cloudflareApi.post(
      `/zones/${req.params.zoneId}/dns_records`,
      req.body
    );
    res.status(201).json(unwrapResult(response));
  } catch (error) {
    next(error);
  }
});

// Update a DNS record in a given zone.
app.put('/api/zones/:zoneId/dns_records/:recordId', async (req, res, next) => {
  try {
    const response = await cloudflareApi.put(
      `/zones/${req.params.zoneId}/dns_records/${req.params.recordId}`,
      req.body
    );
    res.json(unwrapResult(response));
  } catch (error) {
    next(error);
  }
});

// Delete a DNS record from a zone.
app.delete('/api/zones/:zoneId/dns_records/:recordId', async (req, res, next) => {
  try {
    const response = await cloudflareApi.delete(
      `/zones/${req.params.zoneId}/dns_records/${req.params.recordId}`
    );
    res.json(unwrapResult(response));
  } catch (error) {
    next(error);
  }
});

// Centralized error handler to ensure consistent error responses to the client.
app.use((error, _req, res, _next) => {
  console.error('Cloudflare proxy error:', error.message);

  if (error.response) {
    const { status, data } = error.response;
    res.status(status).json({
      success: false,
      message:
        data?.errors?.map((item) => item.message).join(', ') || data?.message ||
        'Cloudflare API request failed.',
      data
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Unexpected server error. Please try again later.',
    details: error.message
  });
});

app.listen(PORT, () => {
  console.log(`Cloudflare DNS manager proxy listening on port ${PORT}`);
});

module.exports = app;
