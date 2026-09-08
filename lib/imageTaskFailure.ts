import type { Storyboard } from '@/types';

/** A failed provider receipt remains evidence, never an empty slot to rebuy. */
export function recordImageTaskFailure(board: Storyboard, reason: string): Storyboard {
  const history = board.imageFailureHistory || [];
  return { ...board, status: 'failed', imageFailureReason: reason,
    imageFailureHistory: board.taskId && !history.some(item => item.taskId === board.taskId)
      ? [...history, { taskId: board.taskId, reason, at: new Date().toISOString(), review: '上游明确失败，保留回执；未授权自动重提' }]
      : history,
  };
}
