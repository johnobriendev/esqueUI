// Comment-related types

export interface CommentUser {
  id: string;
  email: string;
  name?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  userId: string;
  user: CommentUser;
}

// Comments state for Redux
export interface CommentsState {
  items: Comment[];
  isLoading: boolean;
  error: string | null;
}
