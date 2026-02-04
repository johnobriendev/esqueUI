import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskDetailView from './TaskDetailView';
import { renderWithProviders, createMockTask, createMockProject, RootState } from '../../../test/utils/testUtils';

// Mock CommentsSection to avoid needing to set up all its dependencies
vi.mock('../../comments/components/CommentsSection', () => ({
  default: () => <div data-testid="comments-section">Comments</div>,
}));

describe('TaskDetailView', () => {
  const mockTask = createMockTask({
    title: 'Test Task',
    description: 'Test description',
    status: 'in progress',
    priority: 'high',
  });

  const mockProject = createMockProject({ id: mockTask.projectId, userRole: 'owner' });
  const mockOnClose = vi.fn();

  const defaultState: Partial<RootState> = {
    projects: {
      items: [mockProject],
      currentProject: mockProject,
      isLoading: false,
      error: null,
    },
    tasks: { items: [], isLoading: false, error: null },
    ui: {},
    collaboration: {},
    comments: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task title and description', () => {
    renderWithProviders(<TaskDetailView task={mockTask} onClose={mockOnClose} />, {
      preloadedState: defaultState,
    });

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays status and priority badges', () => {
    renderWithProviders(<TaskDetailView task={mockTask} onClose={mockOnClose} />, {
      preloadedState: defaultState,
    });

    expect(screen.getByText('in progress')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('closes when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <TaskDetailView task={mockTask} onClose={mockOnClose} />,
      { preloadedState: defaultState }
    );

    await user.click(container.firstChild as HTMLElement);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TaskDetailView task={mockTask} onClose={mockOnClose} />, {
      preloadedState: defaultState,
    });

    await user.click(screen.getByLabelText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows edit and delete buttons for users with write access', () => {
    renderWithProviders(<TaskDetailView task={mockTask} onClose={mockOnClose} />, {
      preloadedState: defaultState,
    });

    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows read-only message for viewers', () => {
    const viewerProject = createMockProject({ userRole: 'viewer', canWrite: false });
    const state = {
      ...defaultState,
      projects: {
        ...defaultState.projects,
        currentProject: viewerProject,
        items: [viewerProject],
      },
    };

    renderWithProviders(<TaskDetailView task={mockTask} onClose={mockOnClose} />, {
      preloadedState: state,
    });

    expect(screen.getByText('You have read-only access to this task.')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('warns when task is from a different project', () => {
    const differentProject = createMockProject({ id: 'different-project' });
    const state = {
      ...defaultState,
      projects: {
        ...defaultState.projects,
        currentProject: differentProject,
        items: [differentProject],
      },
    };

    renderWithProviders(<TaskDetailView task={mockTask} onClose={mockOnClose} />, {
      preloadedState: state,
    });

    expect(screen.getByText(/different project/i)).toBeInTheDocument();
  });

  it('renders custom fields when present', () => {
    const taskWithCustomFields = createMockTask({
      ...mockTask,
      customFields: { Environment: 'Production' },
    });

    renderWithProviders(<TaskDetailView task={taskWithCustomFields} onClose={mockOnClose} />, {
      preloadedState: defaultState,
    });

    expect(screen.getByText('Custom Fields')).toBeInTheDocument();
    expect(screen.getByText('Environment')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
  });
});
