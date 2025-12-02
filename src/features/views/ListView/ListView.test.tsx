import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ListView from './ListView';
import { renderWithProviders, createMockTasks, createMockProject, RootState } from '../../../test/utils/testUtils';

vi.mock('../../app/hooks', async () => {
  const actual = await vi.importActual('../../app/hooks');
  return {
    ...actual,
  };
});

describe('ListView', () => {
  const mockTasks = createMockTasks(3);
  const mockProject = createMockProject();

  const defaultState: Partial<RootState> = {
    tasks: {
      items: mockTasks,
      isLoading: false,
      error: null,
    },
    projects: {
      items: [mockProject],
      currentProject: mockProject,
      isLoading: false,
      error: null,
    },
    ui: {
      sortConfig: { field: 'updatedAt', direction: 'desc' },
      filterConfig: { status: 'all', priority: 'all', searchTerm: '' },
      isDeleteConfirmOpen: false,
    },
    collaboration: {},
    comments: {},
  };

  it('renders "No Project Selected" when no project is active', () => {
    const state = {
      ...defaultState,
      projects: { ...defaultState.projects, currentProject: null },
    };

    renderWithProviders(<ListView />, { preloadedState: state });

    expect(screen.getByText('No Project Selected')).toBeInTheDocument();
  });

  it('renders task list table with tasks', () => {
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('shows "No tasks found" when task list is empty', () => {
    const state = {
      ...defaultState,
      tasks: { ...defaultState.tasks, items: [] },
    };

    renderWithProviders(<ListView />, { preloadedState: state });

    expect(screen.getByText(/No tasks found/i)).toBeInTheDocument();
  });

  it('displays role indicator for current user', () => {
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    expect(screen.getByText(/Your role:/i)).toBeInTheDocument();
    expect(screen.getByText('owner')).toBeInTheDocument();
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

    renderWithProviders(<ListView />, { preloadedState: state });

    expect(screen.getByText(/Read-only access/i)).toBeInTheDocument();
  });

  it('allows sorting by clicking column headers', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    const titleHeader = screen.getByText(/Title/i);
    await user.click(titleHeader);

    // After click, should show sort indicator
    expect(titleHeader.textContent).toMatch(/[↑↓]/);
  });

  it('shows checkboxes for bulk operations when user has write access', () => {
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  it('hides checkboxes and action buttons for viewers', () => {
    const viewerProject = createMockProject({ userRole: 'viewer', canWrite: false });
    const state = {
      ...defaultState,
      projects: {
        ...defaultState.projects,
        currentProject: viewerProject,
        items: [viewerProject],
      },
    };

    renderWithProviders(<ListView />, { preloadedState: state });

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('shows bulk edit options when tasks are selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    // Select first task
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Skip "select all" checkbox

    expect(screen.getByText(/1 task selected/i)).toBeInTheDocument();
    expect(screen.getByText('Change Status')).toBeInTheDocument();
    expect(screen.getByText('Change Priority')).toBeInTheDocument();
    expect(screen.getByText('Delete Selected')).toBeInTheDocument();
  });

  it('selects all visible tasks when select-all checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    expect(screen.getByText(/3 tasks selected/i)).toBeInTheDocument();
  });

  it('paginates tasks when there are more than 10', () => {
    const manyTasks = createMockTasks(15);
    const state = {
      ...defaultState,
      tasks: { ...defaultState.tasks, items: manyTasks },
    };

    renderWithProviders(<ListView />, { preloadedState: state });

    // Check for pagination controls
    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    const nextButtons = screen.getAllByText('Next');
    expect(nextButtons.length).toBeGreaterThan(0);
    // Only 10 tasks should be visible on first page
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 10')).toBeInTheDocument();
    expect(screen.queryByText('Task 11')).not.toBeInTheDocument();
  });

  it('opens task detail when clicking task title', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListView />, { preloadedState: defaultState });

    await user.click(screen.getByText('Task 1'));

    // Should dispatch action to open detail view (check via store state or spy)
  });

  it('displays custom fields preview when present', () => {
    const tasksWithCustomFields = createMockTasks(1);
    tasksWithCustomFields[0].customFields = { Sprint: '2024-Q1', Team: 'Backend' };

    const state = {
      ...defaultState,
      tasks: { ...defaultState.tasks, items: tasksWithCustomFields },
    };

    const { container } = renderWithProviders(<ListView />, { preloadedState: state });

    // Custom fields are displayed in the table
    expect(container.textContent).toContain('Sprint');
    expect(container.textContent).toContain('2024-Q1');
  });
});
