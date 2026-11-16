import { describe, it, expect, afterEach, vi } from 'vitest';
import stompClient from '../services/websocket';

describe('WebSocket resolveWsUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('strips duplicated wss://https:// scheme prefix', () => {
    vi.stubEnv('VITE_WS_URL', 'wss://https://demo-tunnel.trycloudflare.com/ws');
    expect(stompClient.resolveWsUrl()).toBe('wss://demo-tunnel.trycloudflare.com/ws');
  });

  it('normalizes https:// and ws://http:// URLs cleanly', () => {
    vi.stubEnv('VITE_WS_URL', 'https://demo-tunnel.trycloudflare.com/ws');
    expect(stompClient.resolveWsUrl()).toBe('wss://demo-tunnel.trycloudflare.com/ws');

    vi.stubEnv('VITE_WS_URL', 'ws://http://localhost:8080/ws');
    expect(stompClient.resolveWsUrl()).toBe('ws://localhost:8080/ws');
  });

  it('uses same-host /ws over wss on non-localhost https origin when VITE_WS_URL is unset', () => {
    vi.stubEnv('VITE_WS_URL', '');
    vi.stubGlobal('location', {
      protocol: 'https:',
      hostname: 'app.trycloudflare.com',
      host: 'app.trycloudflare.com',
    });
    expect(stompClient.resolveWsUrl()).toBe('wss://app.trycloudflare.com/ws');
  });

  it('defaults to port 8080 /ws on localhost when VITE_WS_URL is unset', () => {
    vi.stubEnv('VITE_WS_URL', '');
    vi.stubGlobal('location', {
      protocol: 'http:',
      hostname: 'localhost',
      host: 'localhost:5173',
    });
    expect(stompClient.resolveWsUrl()).toBe('ws://localhost:8080/ws');
  });
});

