import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KanbanView from '../KanbanView';
import { renderWithProviders, createMockTask, createMockProject, RootState } from '../../test/utils/testUtils';

// Mock @hello-pangea/dnd to avoid DragDropContext issues in tests
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) =>
    children(
      { innerRef: vi.fn(), droppableProps: {} },
      { isDraggingOver: false }
    ),
  Draggable: ({ children }: any) =>
    children(
      { innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} },
      { isDragging: false }
    ),
}));

describe('KanbanView', () => {
  const mockProject = createMockProject({ id: 'project-1' });

  // Create tasks that belong to the mock project
  const lowPriorityTask = createMockTask({
    id: 'task-1',
    title: 'Low Priority Task',
    priority: 'low',
    projectId: 'project-1',
  });
  const highPriorityTask = createMockTask({
    id: 'task-2',
    title: 'High Priority Task',
    priority: 'high',
    projectId: 'project-1',
  });
  const urgentTask = createMockTask({
    id: 'task-3',
    title: 'Urgent Task',
    priority: 'urgent',
    projectId: 'project-1',
  });

  const defaultState: Partial<RootState> = {
    tasks: {
      items: [lowPriorityTask, highPriorityTask, urgentTask],
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
      viewMode: 'kanban',
      kanbanGroupBy: 'priority',
      sortConfig: { field: 'updatedAt', direction: 'desc' },
      filterConfig: { status: 'all', priority: 'all', searchTerm: '' },
      isTaskModalOpen: false,
      editingTaskId: null,
      isTaskDetailOpen: false,
      viewingTaskId: null,
      isDeleteConfirmOpen: false,
      deletingTaskId: null,
      deletingTaskIds: [],
      isBulkEditOpen: false,
      bulkEditType: null,
      selectedTaskIds: [],
      currentProjectId: 'project-1',
      isTeamModalOpen: false,
      isInviteModalOpen: false,
      isInvitationsPanelOpen: false,
      activeConflicts: [],
      conflictBannerVisible: false,
      isDeleteCommentModalOpen: false,
      deletingCommentId: null,
      isUrgentTasksModalOpen: false,
    },
    collaboration: {},
    comments: {},
  };

  // Test: Verifies that when no project is selected, a helpful message is shown
  it('shows empty state when no project is selected', () => {
    const state = {
      ...defaultState,
      projects: { ...defaultState.projects, currentProject: null },
    };

    renderWithProviders(<KanbanView />, { preloadedState: state });

    expect(screen.getByText('No Project Selected')).toBeInTheDocument();
  });

  // Test: Checks that all 4 priority columns render when grouping by priority
  it('renders all priority columns (Low, Medium, High, Urgent)', () => {
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    expect(screen.getByText(/Low \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Medium \(/i)).toBeInTheDocument();
    expect(screen.getByText(/High \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgent \(/i)).toBeInTheDocument();
  });

  // Test: Checks that all 3 status columns render when switching grouping mode
  it('renders status columns when grouped by status', () => {
    const state = {
      ...defaultState,
      ui: { ...defaultState.ui, kanbanGroupBy: 'status' },
    };

    renderWithProviders(<KanbanView />, { preloadedState: state });

    expect(screen.getByText(/Not Started \(/i)).toBeInTheDocument();
    expect(screen.getByText(/In Progress \(/i)).toBeInTheDocument();
    expect(screen.getByText(/Completed \(/i)).toBeInTheDocument();
  });

  // Test: Verifies that tasks appear in the kanban board
  it('displays tasks in their respective columns', () => {
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    expect(screen.getByText('Low Priority Task')).toBeInTheDocument();
    expect(screen.getByText('High Priority Task')).toBeInTheDocument();
    expect(screen.getByText('Urgent Task')).toBeInTheDocument();
  });

  // Test: Checks that column headers show task counts (e.g., "Low (1)")
  it('displays task count in column headers', () => {
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    expect(screen.getByText(/Low \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/High \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Urgent \(1\)/i)).toBeInTheDocument();
  });

  // Test: Verifies empty state message shows in columns with no tasks
  it('shows "No tasks" in empty columns', () => {
    const state = {
      ...defaultState,
      tasks: { ...defaultState.tasks, items: [] },
    };

    renderWithProviders(<KanbanView />, { preloadedState: state });

    const noTasksMessages = screen.getAllByText('No tasks');
    expect(noTasksMessages.length).toBeGreaterThan(0);
  });

  // Test: Checks that users with write permission see "Add task" buttons
  it('shows "Add task" button for users with write access', () => {
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    const addButtons = screen.getAllByText(/Add task/i);
    expect(addButtons.length).toBeGreaterThan(0);
  });

  // Test: Verifies viewers (read-only users) don't see "Add task" buttons
  it('hides "Add task" button for viewers', () => {
    const viewerProject = createMockProject({ id: 'project-1', userRole: 'viewer', canWrite: false });
    const state = {
      ...defaultState,
      projects: {
        ...defaultState.projects,
        currentProject: viewerProject,
        items: [viewerProject],
      },
    };

    renderWithProviders(<KanbanView />, { preloadedState: state });

    expect(screen.queryByText(/Add task/i)).not.toBeInTheDocument();
  });

  // Test: Checks that clicking "Add task" opens the quick-add form
  it('opens quick-add form when "Add task" is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    const addButtons = screen.getAllByText(/Add task/i);
    await user.click(addButtons[0]);

    expect(screen.getByPlaceholderText(/Enter task title/i)).toBeInTheDocument();
  });

  // Test: Verifies the Cancel button closes the quick-add form
  it('closes quick-add form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    const addButtons = screen.getAllByText(/Add task/i);
    await user.click(addButtons[0]);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(screen.queryByPlaceholderText(/Enter task title/i)).not.toBeInTheDocument();
  });

  // Test: Checks that pressing Escape key closes the quick-add form
  it('closes quick-add form when Escape key is pressed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    const addButtons = screen.getAllByText(/Add task/i);
    await user.click(addButtons[0]);

    const input = screen.getByPlaceholderText(/Enter task title/i);
    await user.type(input, '{Escape}');

    expect(screen.queryByPlaceholderText(/Enter task title/i)).not.toBeInTheDocument();
  });

  // Test: Verifies Edit and Delete buttons appear on each task card
  it('shows Edit and Delete buttons on task cards', () => {
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');

    expect(editButtons.length).toBe(3); // One for each task
    expect(deleteButtons.length).toBe(3);
  });

  // Test: Checks that viewers don't see Edit/Delete buttons
  it('hides Edit and Delete buttons for viewers', () => {
    const viewerProject = createMockProject({ id: 'project-1', userRole: 'viewer', canWrite: false });
    const state = {
      ...defaultState,
      projects: {
        ...defaultState.projects,
        currentProject: viewerProject,
        items: [viewerProject],
      },
    };

    renderWithProviders(<KanbanView />, { preloadedState: state });

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  // Test: Verifies custom fields are displayed on task cards
  it('displays custom fields on task cards', () => {
    const taskWithCustomFields = createMockTask({
      id: 'task-4',
      title: 'Task with custom fields',
      priority: 'low',
      projectId: 'project-1',
      customFields: { Environment: 'Production' },
    });

    const state = {
      ...defaultState,
      tasks: {
        ...defaultState.tasks,
        items: [taskWithCustomFields],
      },
    };

    renderWithProviders(<KanbanView />, { preloadedState: state });

    expect(screen.getByText('Environment:')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  // Test: Ensures drag-and-drop library is initialized
  it('renders with drag-and-drop enabled', () => {
    renderWithProviders(<KanbanView />, { preloadedState: defaultState });

    expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
  });
});
