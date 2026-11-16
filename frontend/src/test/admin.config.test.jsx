import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminConfigHubPage from '../pages/admin/AdminConfigHubPage';
import adminConfigService from '../services/adminConfig.service';
import { ToastProvider } from '../context/ToastContext';

// Mock adminConfigService
vi.mock('../services/adminConfig.service', () => ({
  default: {
    getEmailServerConfig: vi.fn(),
    updateEmailServerConfig: vi.fn(),
    resetEmailServerConfig: vi.fn(),
    testEmailServer: vi.fn(),

    getDeletionConfig: vi.fn(),
    updateDeletionConfig: vi.fn(),
    resetDeletionConfig: vi.fn(),

    getMediaConfig: vi.fn(),
    updateMediaConfig: vi.fn(),
    resetMediaConfig: vi.fn(),

    getFeatureFlagConfig: vi.fn(),
    updateFeatureFlagConfig: vi.fn(),
    resetFeatureFlagConfig: vi.fn(),

    getModerationConfig: vi.fn(),
    updateModerationConfig: vi.fn(),
    resetModerationConfig: vi.fn(),

    getDynamicConfigs: vi.fn(),
    updateDynamicConfig: vi.fn(),
    resetDynamicConfig: vi.fn(),
    resetAllDynamicConfigs: vi.fn(),
  },
}));

const mockEmailServer = {
  providerName: 'SMTP',
  host: 'smtp.gmail.com',
  port: 587,
  username: 'admin@instagram.com',
  hasPassword: true,
  maskedPassword: '********',
  authEnabled: true,
  starttlsEnabled: true,
  sslEnabled: false,
  connectionTimeoutMs: 10000,
  simulationMode: true,
  rateLimitPerHour: 1000,
};

const mockDeletion = {
  trashRetentionDays: 30,
  pseudoPermanentEnabled: true,
  mediaPurgeDelayDays: 30,
  legalHoldEnabled: false,
  adminTakedownPreserveDays: 365,
  accountGraceDays: 30,
  cronBatchSize: 500,
};

const mockMedia = {
  maxReelBytes: 262144000,
  maxPostBytes: 104857600,
  maxReelDurationSec: 90,
  maxStoryDurationSec: 60,
  allowedMimeTypes: 'video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp',
};

const mockFeatures = {
  reelsUploadEnabled: true,
  storyCreationEnabled: true,
  voiceMessagesEnabled: true,
  maintenanceModeEnabled: false,
  maintenanceMessage: 'Instagram is currently undergoing scheduled maintenance. Please check back shortly.',
};

const mockModeration = {
  autoQuarantineReportThreshold: 5,
  profanityBannedWords: 'spam,scam,fraud,hate,abuse,harassment,malware',
  nsfwBlurThreshold: 0.85,
  copyrightStrikeLimit: 3,
};

const mockDynamicConfigs = [
  {
    key: 'auth.signup_otp_expiry_minutes',
    value: '10',
    defaultValue: '10',
    category: 'AUTH',
    description: 'Expiry time for signup OTP in minutes',
    isPublic: false,
    isSecret: false,
    updatedAt: '2026-10-29T10:00:00Z',
  },
  {
    key: 'client.base_url',
    value: 'http://localhost:5173',
    defaultValue: 'http://localhost:5173',
    category: 'GENERAL',
    description: 'Frontend client base URL',
    isPublic: true,
    isSecret: false,
    updatedAt: '2026-10-29T10:00:00Z',
  },
];

describe('AdminConfigHubPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminConfigService.getEmailServerConfig.mockResolvedValue({ data: mockEmailServer });
    adminConfigService.getDeletionConfig.mockResolvedValue({ data: mockDeletion });
    adminConfigService.getMediaConfig.mockResolvedValue({ data: mockMedia });
    adminConfigService.getFeatureFlagConfig.mockResolvedValue({ data: mockFeatures });
    adminConfigService.getModerationConfig.mockResolvedValue({ data: mockModeration });
    adminConfigService.getDynamicConfigs.mockResolvedValue({ data: mockDynamicConfigs });
  });

  const renderComponent = () => {
    return render(
      <ToastProvider>
        <MemoryRouter>
          <AdminConfigHubPage />
        </MemoryRouter>
      </ToastProvider>
    );
  };

  it('renders loading spinner then displays Dynamic Settings by default', async () => {
    renderComponent();

    expect(screen.getByText('Dynamic System Configurations')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search settings by key name or description/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
      expect(screen.getByText('client.base_url')).toBeInTheDocument();
    });
  });

  it('switches to Email domain configuration tab and displays mail server settings', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    });

    const emailTabBtn = screen.getByRole('button', { name: /Email & Delivery/i });
    fireEvent.click(emailTabBtn);

    expect(screen.getByText('Mail Server & SMTP Connection')).toBeInTheDocument();
    expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('587')).toBeInTheDocument();
  });

  it('switches to Deletion & Retention tab and displays retention parameters', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    });

    const deletionTabBtn = screen.getByRole('button', { name: /Deletion & Retention/i });
    fireEvent.click(deletionTabBtn);

    expect(screen.getByText('Deletion & Data Lifecycle Policy')).toBeInTheDocument();
    expect(screen.getByText('Recently Deleted Trash Lifespan')).toBeInTheDocument();
    expect(screen.getByText('Pretend Purge Enabled')).toBeInTheDocument();
  });

  it('switches to Feature Flags tab and can save changes', async () => {
    adminConfigService.updateFeatureFlagConfig.mockResolvedValue({
      data: { ...mockFeatures, reelsUploadEnabled: false },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    });

    const featuresTabBtn = screen.getByRole('button', { name: /Feature Flags & Maintenance/i });
    fireEvent.click(featuresTabBtn);

    expect(screen.getByText('Platform Feature Switches & Maintenance Mode')).toBeInTheDocument();

    const saveBtn = screen.getByRole('button', { name: /Save Feature Switches/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(adminConfigService.updateFeatureFlagConfig).toHaveBeenCalled();
    });
  });

  it('switches to Moderation & Safety tab and displays profanity dictionary', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    });

    const modTabBtn = screen.getByRole('button', { name: /Moderation & Safety/i });
    fireEvent.click(modTabBtn);

    expect(screen.getByText('Automated Moderation & Safety Governance')).toBeInTheDocument();
    expect(screen.getByDisplayValue(/spam,scam,fraud/i)).toBeInTheDocument();
  });

  it('filters dynamic configs with search input and category pills', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
      expect(screen.getByText('client.base_url')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search settings by key name or description/i);
    fireEvent.change(searchInput, { target: { value: 'signup' } });

    expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    expect(screen.queryByText('client.base_url')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('client.base_url')).toBeInTheDocument();

    const authPill = screen.getByRole('button', { name: /^AUTH/i });
    fireEvent.click(authPill);

    expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    expect(screen.queryByText('client.base_url')).not.toBeInTheDocument();
  });

  it('can edit a dynamic config and trigger save', async () => {
    adminConfigService.updateDynamicConfig.mockResolvedValue({
      data: { ...mockDynamicConfigs[0], value: '15' },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('auth.signup_otp_expiry_minutes')).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue('10');
    fireEvent.change(input, { target: { value: '15' } });

    const saveBtns = screen.getAllByRole('button', { name: /Save/i });
    const activeSaveBtn = saveBtns.find((b) => !b.disabled);
    expect(activeSaveBtn).toBeDefined();
    fireEvent.click(activeSaveBtn);

    await waitFor(() => {
      expect(adminConfigService.updateDynamicConfig).toHaveBeenCalledWith(
        'auth.signup_otp_expiry_minutes',
        '15'
      );
    });
  });

  it('can update client.base_url and reset all dynamic settings', async () => {
    adminConfigService.updateDynamicConfig.mockResolvedValue({
      data: {
        ...mockDynamicConfigs[1],
        value: 'https://live.example.com',
        updatedBy: 'admin',
      },
    });
    adminConfigService.resetAllDynamicConfigs.mockResolvedValue({
      data: mockDynamicConfigs,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('client.base_url')).toBeInTheDocument();
    });

    const urlInput = screen.getByDisplayValue('http://localhost:5173');
    fireEvent.change(urlInput, { target: { value: 'https://live.example.com' } });

    const saveBtns = screen.getAllByRole('button', { name: /Save/i });
    const activeSaveBtn = saveBtns.find((b) => !b.disabled);
    expect(activeSaveBtn).toBeDefined();
    fireEvent.click(activeSaveBtn);

    await waitFor(() => {
      expect(adminConfigService.updateDynamicConfig).toHaveBeenCalledWith(
        'client.base_url',
        'https://live.example.com'
      );
    });

    const resetTabBtn = screen.getByRole('button', { name: /Reset Tab to Default/i });
    fireEvent.click(resetTabBtn);

    await waitFor(() => {
      expect(adminConfigService.resetAllDynamicConfigs).toHaveBeenCalledTimes(1);
    });
  });
});
