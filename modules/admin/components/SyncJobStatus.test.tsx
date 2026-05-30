/**
 * SyncJobStatus Component Tests
 * 
 * Tests for status display, metrics, and visual indicators
 * Implements Requirements: 5.1, 5.2, 11.1, 11.2
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SyncJobStatus, type SyncJobStatusData } from './SyncJobStatus';

describe('SyncJobStatus', () => {
  const mockSyncData: SyncJobStatusData = {
    status: 'success',
    postsProcessed: 15,
    tasksCreated: 10,
    tasksUpdated: 5,
    metricsUpdated: 15,
    duration: 5432,
    timestamp: '2024-01-15T10:30:00Z',
  };

  describe('Rendering', () => {
    it('should render status badge', () => {
      render(<SyncJobStatus data={mockSyncData} />);

      expect(screen.getByText('Sucesso')).toBeInTheDocument();
    });

    it('should render all metrics', () => {
      render(<SyncJobStatus data={mockSyncData} />);

      const metrics = screen.getAllByText(/15|10|5/);
      expect(metrics.length).toBeGreaterThanOrEqual(3);
    });

    it('should render duration', () => {
      render(<SyncJobStatus data={mockSyncData} />);

      expect(screen.getByText(/5\.4s/)).toBeInTheDocument();
    });

    it('should render timestamp', () => {
      render(<SyncJobStatus data={mockSyncData} />);

      expect(screen.getByText(/15\/01\/2024/)).toBeInTheDocument();
    });

    it('should render loading state', () => {
      render(<SyncJobStatus isLoading={true} />);

      expect(screen.getByText(/Carregando status/i)).toBeInTheDocument();
    });

    it('should render empty state when no data', () => {
      render(<SyncJobStatus data={null} />);

      expect(screen.getByText(/Nenhuma sincronização realizada ainda/i)).toBeInTheDocument();
    });
  });

  describe('Status Variants', () => {
    it('should display success status', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'success',
          }}
        />
      );

      expect(screen.getByText('Sucesso')).toBeInTheDocument();
      expect(screen.getByText(/Sincronização concluída com sucesso/i)).toBeInTheDocument();
    });

    it('should display partial status', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'partial',
          }}
        />
      );

      expect(screen.getByText('Parcial')).toBeInTheDocument();
      expect(screen.getByText(/Sincronização parcial/i)).toBeInTheDocument();
    });

    it('should display failed status', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'failed',
            errorMessage: 'API connection failed',
          }}
        />
      );

      expect(screen.getByText('Falha')).toBeInTheDocument();
      expect(screen.getByText(/API connection failed/i)).toBeInTheDocument();
    });

    it('should display running status', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'running',
          }}
        />
      );

      expect(screen.getByText('Em Progresso')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      const errorMessage = 'Instagram API rate limit exceeded';
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'failed',
            errorMessage,
          }}
        />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display error message when not provided', () => {
      render(<SyncJobStatus data={mockSyncData} />);

      expect(screen.queryByText(/Erro durante sincronização/i)).not.toBeInTheDocument();
    });
  });

  describe('Metrics Display', () => {
    it('should display correct metric values', () => {
      const customData: SyncJobStatusData = {
        ...mockSyncData,
        postsProcessed: 25,
        tasksCreated: 20,
        tasksUpdated: 5,
        metricsUpdated: 25,
      };

      render(<SyncJobStatus data={customData} />);

      const values = screen.getAllByText('25');
      expect(values.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should display zero metrics', () => {
      const zeroData: SyncJobStatusData = {
        ...mockSyncData,
        postsProcessed: 0,
        tasksCreated: 0,
        tasksUpdated: 0,
        metricsUpdated: 0,
      };

      render(<SyncJobStatus data={zeroData} />);

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Duration Formatting', () => {
    it('should format milliseconds correctly', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            duration: 500,
          }}
        />
      );

      expect(screen.getByText(/500ms/)).toBeInTheDocument();
    });

    it('should format seconds correctly', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            duration: 2500,
          }}
        />
      );

      expect(screen.getByText(/2\.5s/)).toBeInTheDocument();
    });

    it('should format large durations correctly', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            duration: 120000,
          }}
        />
      );

      expect(screen.getByText(/120\.0s/)).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should display progress bar', () => {
      const { container } = render(<SyncJobStatus data={mockSyncData} />);

      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
    });

    it('should show full progress for success status', () => {
      const { container } = render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'success',
          }}
        />
      );

      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toHaveStyle('width: 100%');
    });

    it('should show partial progress for running status', () => {
      const { container } = render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'running',
          }}
        />
      );

      const progressBar = container.querySelector('.bg-blue-500');
      expect(progressBar).toHaveStyle('width: 75%');
    });
  });

  describe('Info Messages', () => {
    it('should show success info message', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'success',
          }}
        />
      );

      expect(screen.getByText(/Sincronização concluída com sucesso/i)).toBeInTheDocument();
    });

    it('should show partial info message', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'partial',
          }}
        />
      );

      expect(screen.getByText(/Sincronização parcial/i)).toBeInTheDocument();
    });

    it('should not show info message for failed status', () => {
      render(
        <SyncJobStatus
          data={{
            ...mockSyncData,
            status: 'failed',
          }}
        />
      );

      expect(screen.queryByText(/Sincronização concluída com sucesso/i)).not.toBeInTheDocument();
    });
  });
});
