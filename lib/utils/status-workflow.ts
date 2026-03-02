/**
 * Status Workflow & Transition Rules
 * 
 * Workflow:
 * new → assigned → in_progress → resolved → closed
 *                                    ↓
 *                                 reopened → (back to assigned)
 */

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['assigned'], // Can only move to assigned
  assigned: ['in_progress'], // Can start work
  in_progress: ['resolved'], // Can mark as resolved
  resolved: ['closed', 'reopened'], // Can close or reopen
  closed: ['reopened'], // Can only reopen if needed
  reopened: ['assigned'], // Goes back to assignment workflow
};

/**
 * Validate if a status transition is allowed
 */
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  if (currentStatus === newStatus) {
    return false; // No change
  }

  const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
}

/**
 * Get allowed status transitions for a given current status
 */
export function getAllowedStatusTransitions(currentStatus: string): string[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Get error message for invalid transition
 */
export function getStatusTransitionError(
  currentStatus: string,
  newStatus: string
): string {
  const allowed = STATUS_TRANSITIONS[currentStatus];
  
  if (!allowed || allowed.length === 0) {
    return `لا يمكن تغيير الحالة من ${currentStatus}`;
  }
  
  if (currentStatus === newStatus) {
    return 'الحالة الجديدة هي نفس الحالة الحالية';
  }
  
  return `لا يمكن تغيير الحالة من ${currentStatus} إلى ${newStatus}`;
}
