import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthStatusPage from '../pages/HealthStatusPage';
import { healthService } from '../services/health.service';

vi.mock('../services/health.service', () => ({
  healthService: {
    getHealthStatus: vi.fn(),
  },
}));

describe('HealthStatusPage Skeleton Loading Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes the pulse loader and renders skeletons only in dynamic slots while loading', () => {
    healthService.getHealthStatus.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<HealthStatusPage />);

    // Static page & card labels stay real immediately
    expect(screen.getByText('System Foundation Status')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot Backend')).toBeInTheDocument();
    expect(screen.getByText('MySQL Database')).toBeInTheDocument();
    expect(screen.getByText('Redis Cache')).toBeInTheDocument();
    expect(screen.getByText('Apache Kafka')).toBeInTheDocument();
    expect(screen.getByText('WebSocket & STOMP')).toBeInTheDocument();
    expect(screen.getByText('Security Baseline')).toBeInTheDocument();

    // Old pulse/text loader is removed
    expect(container.querySelector('.pulse-loader')).toBeNull();
    expect(screen.queryByText(/Contacting backend foundation/i)).toBeNull();
    expect(container.querySelector('.spin')).toBeNull();

    // Skeletons appear only in dynamic badges/status pills/meta values
    expect(container.querySelectorAll('.health-card .animate-pulse').length).toBe(13);
  });

  it('populates real infrastructure statuses once health data resolves', async () => {
    healthService.getHealthStatus.mockResolvedValue({
      data: {
        status: 'UP',
        javaVersion: '21.0.11',
        springBootVersion: '3.3.4',
        timestamp: '2026-11-11T09:03:24Z',
        database: { databaseProduct: 'MySQL', status: 'CONNECTED', databaseVersion: '8.0.46' },
        redis: { status: 'CONNECTED', ping: 'PONG' },
        kafka: { status: 'CONFIGURED', bootstrapServers: 'localhost:9092' },
        websocket: { status: 'CONFIGURED', messageBroker: 'STOMP (/topic, /queue, /app)' },
      },
    });

    const { container } = render(<HealthStatusPage />);

    await waitFor(() => {
      expect(screen.getByText('UP')).toBeInTheDocument();
      expect(screen.getByText('8.0.46')).toBeInTheDocument();
      expect(screen.getByText('PONG')).toBeInTheDocument();
      expect(screen.getByText('STOMP (/topic, /queue, /app)')).toBeInTheDocument();
    });

    expect(container.querySelectorAll('.health-card .animate-pulse').length).toBe(0);
  });
});

