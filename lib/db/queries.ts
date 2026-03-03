import db from './schema';

// ==================== PREPARED STATEMENTS (Hoisted for Reuse) ====================

// User statements
const stmtGetUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
const stmtGetUserById = db.prepare('SELECT * FROM users WHERE id = ?');
const stmtGetAllUsers = db.prepare('SELECT id, name, email, role, status, created_at FROM users');
const stmtGetActiveUsers = db.prepare('SELECT id, name, email, role, status FROM users WHERE status = ? AND role = ?');
const stmtCreateUser = db.prepare('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)');
const stmtUpdateUserStatus = db.prepare('UPDATE users SET status = ? WHERE id = ?');

// Complaint statements
const stmtCreateComplaint = db.prepare(`
  INSERT INTO complaints (client_phone, client_national_id, client_name, complaint_type_id, description, kiosk_id, priority)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const stmtGetComplaintById = db.prepare(`
  SELECT 
    c.*,
    ct.name_ar as type_name,
    k.location as kiosk_location,
    u.name as assigned_user_name
  FROM complaints c
  LEFT JOIN complaint_types ct ON c.complaint_type_id = ct.id
  LEFT JOIN kiosks k ON c.kiosk_id = k.id
  LEFT JOIN users u ON c.assigned_user_id = u.id
  WHERE c.id = ?
`);
const stmtAssignComplaint = db.prepare('UPDATE complaints SET assigned_user_id = ?, status = ? WHERE id = ?');
const stmtUpdateComplaintStatus = db.prepare('UPDATE complaints SET status = ? WHERE id = ?');
const stmtCloseComplaint = db.prepare('UPDATE complaints SET status = ?, closed_at = CURRENT_TIMESTAMP, is_satisfied = ? WHERE id = ?');
const stmtReopenComplaint = db.prepare('UPDATE complaints SET status = ?, is_reopened = 1, assigned_user_id = NULL WHERE id = ?');

// Complaint Type statements
const stmtGetAllComplaintTypes = db.prepare('SELECT * FROM complaint_types ORDER BY level ASC, display_order ASC');
const stmtGetComplaintTypeById = db.prepare('SELECT * FROM complaint_types WHERE id = ?');

// Kiosk statements
const stmtGetKioskByLink = db.prepare('SELECT * FROM kiosks WHERE unique_link = ?');
const stmtGetAllKiosks = db.prepare('SELECT * FROM kiosks ORDER BY location');
const stmtGetKioskById = db.prepare('SELECT * FROM kiosks WHERE id = ?');
const stmtCreateKiosk = db.prepare('INSERT INTO kiosks (unique_link, location) VALUES (?, ?)');
const stmtUpdateKiosk = db.prepare('UPDATE kiosks SET location = ? WHERE id = ?');
const stmtDeleteKiosk = db.prepare('DELETE FROM kiosks WHERE id = ?');
const stmtToggleKioskStatus = db.prepare('UPDATE kiosks SET is_disabled = ? WHERE id = ?');

// Attachment statements
const stmtCreateAttachment = db.prepare('INSERT INTO attachments (complaint_id, file_path, file_type, uploaded_by) VALUES (?, ?, ?, ?)');
const stmtGetComplaintAttachments = db.prepare('SELECT * FROM attachments WHERE complaint_id = ? ORDER BY upload_date DESC');

// Comment statements
const stmtCreateComment = db.prepare('INSERT INTO comments (complaint_id, user_id, comment_text, is_internal) VALUES (?, ?, ?, ?)');
const stmtGetComplaintComments = db.prepare(`
  SELECT c.*, u.name as user_name
  FROM comments c
  LEFT JOIN users u ON c.user_id = u.id
  WHERE c.complaint_id = ?
  ORDER BY c.created_at DESC
`);

// Status History statements
const stmtCreateStatusHistory = db.prepare('INSERT INTO status_history (complaint_id, user_id, old_status, new_status, change_description) VALUES (?, ?, ?, ?, ?)');
const stmtGetComplaintStatusHistory = db.prepare(`
  SELECT sh.*, u.name as user_name
  FROM status_history sh
  LEFT JOIN users u ON sh.user_id = u.id
  WHERE sh.complaint_id = ?
  ORDER BY sh.created_at DESC
`);

// Auto Assignment statements
const stmtGetAutoAssignmentRules = db.prepare(`
  SELECT aar.*, u.name as user_name
  FROM auto_assignment_rules aar
  LEFT JOIN users u ON aar.user_id = u.id
  WHERE aar.complaint_type_id = ? AND aar.is_active = 1
`);
const stmtCreateAutoAssignmentRule = db.prepare('INSERT INTO auto_assignment_rules (complaint_type_id, user_id, is_active) VALUES (?, ?, ?)');
const stmtDeleteAutoAssignmentRule = db.prepare('DELETE FROM auto_assignment_rules WHERE id = ?');

// Notification statements
const stmtCreateNotification = db.prepare('INSERT INTO notifications (user_id, complaint_id, type, message) VALUES (?, ?, ?, ?)');
const stmtMarkNotificationAsRead = db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?');

// Registration Link statements
const stmtCreateRegistrationLink = db.prepare('INSERT INTO registration_links (token, expires_at, role) VALUES (?, ?, ?)');
const stmtGetRegistrationLink = db.prepare('SELECT * FROM registration_links WHERE token = ?');
const stmtUseRegistrationLink = db.prepare('UPDATE registration_links SET is_used = 1, user_id = ?, device_fingerprint = ? WHERE token = ?');

// Device statements
const stmtRegisterDevice = db.prepare('INSERT INTO user_devices (user_id, device_fingerprint, registration_token) VALUES (?, ?, ?)');
const stmtGetUserDevice = db.prepare('SELECT * FROM user_devices WHERE user_id = ? AND device_fingerprint = ? AND is_active = 1');

// Analytics statements
const stmtComplaintStatsTotal = db.prepare('SELECT COUNT(*) as count FROM complaints');
const stmtComplaintStatsByStatus = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE status = ?');
const stmtGetUserPerformance = db.prepare(`
  SELECT 
    u.id,
    u.name,
    COUNT(c.id) as total_complaints,
    SUM(CASE WHEN c.status = 'closed' THEN 1 ELSE 0 END) as closed_complaints,
    AVG(
      CASE 
        WHEN c.status = 'closed' AND c.closed_at IS NOT NULL 
        THEN (julianday(c.closed_at) - julianday(c.created_at)) * 24 
        ELSE NULL 
      END
    ) as avg_hours_to_close
  FROM users u
  LEFT JOIN complaints c ON u.id = c.assigned_user_id
  WHERE u.role = 'user' AND u.status = 'active'
  GROUP BY u.id, u.name
  ORDER BY total_complaints DESC
`);
const stmtGetUserStats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
    AVG(
      CASE 
        WHEN status = 'closed' AND closed_at IS NOT NULL 
        THEN (julianday(closed_at) - julianday(created_at)) * 24 
        ELSE NULL 
      END
    ) as avgHoursToClose
  FROM complaints
  WHERE assigned_user_id = ?
`);

// ==================== USER QUERIES ====================

export const getUserByEmail = (email: string) => {
  return stmtGetUserByEmail.get(email);
};

export const getUserById = (id: number) => {
  return stmtGetUserById.get(id);
};

export const getAllUsers = () => {
  return stmtGetAllUsers.all();
};

export const getActiveUsers = () => {
  return stmtGetActiveUsers.all('active', 'user');
};

export const createUser = (name: string, email: string, password: string, role: string) => {
  return stmtCreateUser.run(name, email, password, role, 'active');
};

export const updateUserStatus = (userId: number, status: string) => {
  return stmtUpdateUserStatus.run(status, userId);
};

// ==================== COMPLAINT QUERIES ====================

export const createComplaint = (data: {
  client_phone: string;
  client_national_id: string;
  client_name: string;
  complaint_type_id: number;
  description: string;
  kiosk_id: number;
  priority: string;
}) => {
  return stmtCreateComplaint.run(
    data.client_phone,
    data.client_national_id,
    data.client_name,
    data.complaint_type_id,
    data.description,
    data.kiosk_id,
    data.priority
  );
};

export const getComplaintById = (id: number) => {
  return stmtGetComplaintById.get(id);
};

export const getAllComplaints = (filters?: {
  status?: string;
  assigned_user_id?: number;
  complaint_type_id?: number;
  date_from?: string;
  date_to?: string;
}) => {
  let query = `
    SELECT 
      c.*,
      ct.name_ar as type_name,
      k.location as kiosk_location,
      u.name as assigned_user_name
    FROM complaints c
    LEFT JOIN complaint_types ct ON c.complaint_type_id = ct.id
    LEFT JOIN kiosks k ON c.kiosk_id = k.id
    LEFT JOIN users u ON c.assigned_user_id = u.id
    WHERE 1=1
  `;
  
  const params: any[] = [];

  if (filters?.status) {
    query += ' AND c.status = ?';
    params.push(filters.status);
  }

  if (filters?.assigned_user_id) {
    query += ' AND c.assigned_user_id = ?';
    params.push(filters.assigned_user_id);
  }

  if (filters?.complaint_type_id) {
    query += ' AND c.complaint_type_id = ?';
    params.push(filters.complaint_type_id);
  }

  if (filters?.date_from) {
    // Use indexed range comparison instead of DATE()
    query += ' AND c.created_at >= ?';
    params.push(filters.date_from + ' 00:00:00');
  }

  if (filters?.date_to) {
    // Use indexed range comparison instead of DATE()
    query += ' AND c.created_at <= ?';
    params.push(filters.date_to + ' 23:59:59');
  }

  query += ' ORDER BY c.created_at ASC';

  return db.prepare(query).all(...params);
};

export const getUserComplaints = (userId: number) => {
  return db.prepare(`
    SELECT 
      c.*,
      ct.name_ar as type_name,
      k.location as kiosk_location
    FROM complaints c
    LEFT JOIN complaint_types ct ON c.complaint_type_id = ct.id
    LEFT JOIN kiosks k ON c.kiosk_id = k.id
    WHERE c.assigned_user_id = ?
    ORDER BY c.created_at ASC
  `).all(userId);
};

export const assignComplaint = (complaintId: number, userId: number) => {
  return stmtAssignComplaint.run(userId, 'assigned', complaintId);
};

export const updateComplaintStatus = (complaintId: number, status: string) => {
  return stmtUpdateComplaintStatus.run(status, complaintId);
};

export const closeComplaint = (complaintId: number, isSatisfied: boolean) => {
  return stmtCloseComplaint.run('closed', isSatisfied ? 1 : 0, complaintId);
};

export const reopenComplaint = (complaintId: number) => {
  return stmtReopenComplaint.run('reopened', complaintId);
};

// ==================== COMPLAINT TYPE QUERIES ====================

export const getAllComplaintTypes = () => {
  return stmtGetAllComplaintTypes.all();
};

export const getComplaintTypeById = (id: number) => {
  return stmtGetComplaintTypeById.get(id);
};

// ==================== KIOSK QUERIES ====================

export const getKioskByLink = (link: string) => {
  return stmtGetKioskByLink.get(link);
};

export const getAllKiosks = () => {
  return stmtGetAllKiosks.all();
};

export const getKioskById = (id: number) => {
  return stmtGetKioskById.get(id);
};

export const createKiosk = (uniqueLink: string, location: string) => {
  return stmtCreateKiosk.run(uniqueLink, location);
};

export const updateKiosk = (id: number, location: string) => {
  return stmtUpdateKiosk.run(location, id);
};

export const deleteKiosk = (id: number) => {
  return stmtDeleteKiosk.run(id);
};

export const toggleKioskStatus = (id: number, isDisabled: boolean) => {
  return stmtToggleKioskStatus.run(isDisabled ? 1 : 0, id);
};

// ==================== ATTACHMENT QUERIES ====================

export const createAttachment = (complaintId: number, filePath: string, fileType: string, uploadedBy: string) => {
  return stmtCreateAttachment.run(complaintId, filePath, fileType, uploadedBy);
};

export const getComplaintAttachments = (complaintId: number) => {
  return stmtGetComplaintAttachments.all(complaintId);
};

// ==================== COMMENT QUERIES ====================

export const createComment = (complaintId: number, userId: number, commentText: string, isInternal: boolean) => {
  return stmtCreateComment.run(complaintId, userId, commentText, isInternal ? 1 : 0);
};

export const getComplaintComments = (complaintId: number) => {
  return stmtGetComplaintComments.all(complaintId);
};

// ==================== STATUS HISTORY QUERIES ====================

export const createStatusHistory = (
  complaintId: number,
  userId: number,
  oldStatus: string,
  newStatus: string,
  description: string
) => {
  return stmtCreateStatusHistory.run(complaintId, userId, oldStatus, newStatus, description);
};

export const getComplaintStatusHistory = (complaintId: number) => {
  return stmtGetComplaintStatusHistory.all(complaintId);
};

// ==================== AUTO ASSIGNMENT QUERIES ====================

export const getAutoAssignmentRules = (complaintTypeId: number) => {
  return stmtGetAutoAssignmentRules.all(complaintTypeId);
};

export const createAutoAssignmentRule = (complaintTypeId: number, userId: number) => {
  return stmtCreateAutoAssignmentRule.run(complaintTypeId, userId, 1);
};

export const deleteAutoAssignmentRule = (id: number) => {
  return stmtDeleteAutoAssignmentRule.run(id);
};

// ==================== NOTIFICATION QUERIES ====================

export const createNotification = (userId: number, complaintId: number | null, type: string, message: string) => {
  return stmtCreateNotification.run(userId, complaintId, type, message);
};

export const getUserNotifications = (userId: number, unreadOnly = false) => {
  let query = `
    SELECT n.*, c.id as complaint_number
    FROM notifications n
    LEFT JOIN complaints c ON n.complaint_id = c.id
    WHERE n.user_id = ?
  `;
  
  if (unreadOnly) {
    query += ' AND n.is_read = 0';
  }
  
  query += ' ORDER BY n.created_at DESC LIMIT 50';
  
  return db.prepare(query).all(userId);
};

export const markNotificationAsRead = (notificationId: number) => {
  return stmtMarkNotificationAsRead.run(notificationId);
};

// ==================== REGISTRATION LINK QUERIES ====================

export const createRegistrationLink = (token: string, expiresAt: string, role: string = 'user') => {
  return stmtCreateRegistrationLink.run(token, expiresAt, role);
};

export const getRegistrationLink = (token: string) => {
  return stmtGetRegistrationLink.get(token);
};

export const useRegistrationLink = (token: string, userId: number, deviceFingerprint: string) => {
  return stmtUseRegistrationLink.run(userId, deviceFingerprint, token);
};

// ==================== DEVICE REGISTRATION QUERIES ====================

export const registerDevice = (userId: number, deviceFingerprint: string, registrationToken: string) => {
  return stmtRegisterDevice.run(userId, deviceFingerprint, registrationToken);
};

export const getUserDevice = (userId: number, deviceFingerprint: string) => {
  return stmtGetUserDevice.get(userId, deviceFingerprint);
};

// ==================== ANALYTICS QUERIES ====================

export const getComplaintStats = () => {
  return {
    total: stmtComplaintStatsTotal.get(),
    new: stmtComplaintStatsByStatus.get('new'),
    assigned: stmtComplaintStatsByStatus.get('assigned'),
    in_progress: stmtComplaintStatsByStatus.get('in_progress'),
    resolved: stmtComplaintStatsByStatus.get('resolved'),
    closed: stmtComplaintStatsByStatus.get('closed'),
    reopened: stmtComplaintStatsByStatus.get('reopened'),
  };
};

export const getUserPerformance = () => {
  return stmtGetUserPerformance.all();
};

export const getUserStats = (userId: number) => {
  const stats = stmtGetUserStats.get(userId) as { total: number; closed: number; avgHoursToClose: number | null };

  return {
    total: stats.total || 0,
    closed: stats.closed || 0,
    avgHoursToClose: stats.avgHoursToClose || 0,
  };
};

// ==================== PAGINATION QUERIES ====================

export const getComplaintsPaginated = (filters?: {
  status?: string;
  priority?: string;
  assigned_user_id?: number;
  complaint_type_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = filters?.page || 1;
  const pageSize = Math.min(filters?.pageSize || 20, 100); // Max 100 items per page
  const offset = (page - 1) * pageSize;

  let query = `
    SELECT 
      c.*,
      ct.name_ar as type_name,
      k.location as kiosk_location,
      u.name as assigned_user_name
    FROM complaints c
    LEFT JOIN complaint_types ct ON c.complaint_type_id = ct.id
    LEFT JOIN kiosks k ON c.kiosk_id = k.id
    LEFT JOIN users u ON c.assigned_user_id = u.id
    WHERE 1=1
  `;

  let countQuery = `
    SELECT COUNT(*) as total
    FROM complaints c
    WHERE 1=1
  `;

  const params: any[] = [];

  if (filters?.status) {
    query += ' AND c.status = ?';
    countQuery += ' AND c.status = ?';
    params.push(filters.status);
  }

  if (filters?.priority) {
    query += ' AND c.priority = ?';
    countQuery += ' AND c.priority = ?';
    params.push(filters.priority);
  }

  if (filters?.assigned_user_id) {
    query += ' AND c.assigned_user_id = ?';
    countQuery += ' AND c.assigned_user_id = ?';
    params.push(filters.assigned_user_id);
  }

  if (filters?.complaint_type_id) {
    query += ' AND c.complaint_type_id = ?';
    countQuery += ' AND c.complaint_type_id = ?';
    params.push(filters.complaint_type_id);
  }

  if (filters?.date_from) {
    // Use indexed range comparison instead of DATE()
    query += ' AND c.created_at >= ?';
    countQuery += ' AND c.created_at >= ?';
    params.push(filters.date_from + ' 00:00:00');
  }

  if (filters?.date_to) {
    // Use indexed range comparison instead of DATE()
    query += ' AND c.created_at <= ?';
    countQuery += ' AND c.created_at <= ?';
    params.push(filters.date_to + ' 23:59:59');
  }

  if (filters?.search) {
    query += ' AND (c.client_name LIKE ? OR c.client_phone LIKE ? OR c.description LIKE ?)';
    countQuery += ' AND (c.client_name LIKE ? OR c.client_phone LIKE ? OR c.description LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';

  const complaints = db.prepare(query).all(...params, pageSize, offset);
  const { total } = db.prepare(countQuery).get(...params) as { total: number };

  return {
    complaints,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getUsersPaginated = (filters?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) => {
  const page = filters?.page || 1;
  const pageSize = Math.min(filters?.pageSize || 20, 100); // Max 100 items per page
  const offset = (page - 1) * pageSize;

  let query = 'SELECT id, name, email, role, status, created_at FROM users WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
  const params: any[] = [];

  if (filters?.search) {
    query += ' AND (name LIKE ? OR email LIKE ?)';
    countQuery += ' AND (name LIKE ? OR email LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters?.role) {
    query += ' AND role = ?';
    countQuery += ' AND role = ?';
    params.push(filters.role);
  }

  if (filters?.status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(filters.status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

  const users = db.prepare(query).all(...params, pageSize, offset);
  const { total } = db.prepare(countQuery).get(...params) as { total: number };

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

export const getKiosksPaginated = (filters?: {
  search?: string;
  is_disabled?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  const page = filters?.page || 1;
  const pageSize = Math.min(filters?.pageSize || 20, 100); // Max 100 items per page
  const offset = (page - 1) * pageSize;

  let query = 'SELECT * FROM kiosks WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as total FROM kiosks WHERE 1=1';
  const params: any[] = [];

  if (filters?.search) {
    query += ' AND (location LIKE ? OR unique_link LIKE ?)';
    countQuery += ' AND (location LIKE ? OR unique_link LIKE ?)';
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm);
  }

  if (filters?.is_disabled !== undefined) {
    query += ' AND is_disabled = ?';
    countQuery += ' AND is_disabled = ?';
    params.push(filters.is_disabled ? 1 : 0);
  }

  query += ' ORDER BY location ASC LIMIT ? OFFSET ?';

  const kiosks = db.prepare(query).all(...params, pageSize, offset);
  const { total } = db.prepare(countQuery).get(...params) as { total: number };

  return {
    kiosks,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

// ==================== TRANSACTION WRAPPERS FOR MULTI-STEP OPERATIONS ====================

/**
 * Submit a complaint with attachments and auto-assignment in a single transaction
 */
export const submitComplaintWithAttachments = (data: {
  client_phone: string;
  client_national_id: string;
  client_name: string;
  complaint_type_id: number;
  description: string;
  kiosk_id: number;
  priority: string;
  attachments?: Array<{ path: string; type: string }>;
  complaintType: any;
  autoAssignmentRules?: any[];
  activeUsers?: any[];
}) => {
  const transaction = db.transaction(() => {
    // Create complaint
    const complaintResult = stmtCreateComplaint.run(
      data.client_phone,
      data.client_national_id,
      data.client_name,
      data.complaint_type_id,
      data.description,
      data.kiosk_id,
      data.priority
    );

    const complaintId = complaintResult.lastInsertRowid as number;

    // Save attachments
    if (data.attachments && data.attachments.length > 0) {
      for (const attachment of data.attachments) {
        stmtCreateAttachment.run(complaintId, attachment.path, attachment.type, 'client');
      }
    }

    // Auto-assignment if enabled
    if (data.complaintType.auto_assignment_enabled && data.autoAssignmentRules && data.autoAssignmentRules.length > 0) {
      const assignedUserId = data.autoAssignmentRules[0].user_id;
      stmtAssignComplaint.run(assignedUserId, 'assigned', complaintId);
      
      // Send notification to assigned user
      stmtCreateNotification.run(
        assignedUserId,
        complaintId,
        'assignment',
        `تم تكليفك بشكوى جديدة رقم #${complaintId}`
      );
    } else if (data.activeUsers) {
      // Send notification to all admins
      const admins = data.activeUsers.filter((u: any) => u.role === 'admin');
      for (const admin of admins) {
        stmtCreateNotification.run(
          admin.id,
          complaintId,
          'new_complaint',
          `شكوى جديدة رقم #${complaintId} بحاجة إلى مراجعة`
        );
      }
    }

    return complaintId;
  });

  return transaction();
};

/**
 * Update complaint status with history and notifications in a single transaction
 */
export const updateComplaintStatusWithHistory = (data: {
  complaintId: number;
  userId: number;
  oldStatus: string;
  newStatus: string;
  description: string;
  complaint: any;
}) => {
  const transaction = db.transaction(() => {
    // Update status
    stmtUpdateComplaintStatus.run(data.newStatus, data.complaintId);

    // Create history record
    stmtCreateStatusHistory.run(data.complaintId, data.userId, data.oldStatus, data.newStatus, data.description);

    // Notify assigned user if admin changed status
    if (data.complaint.assigned_user_id) {
      stmtCreateNotification.run(
        data.complaint.assigned_user_id,
        data.complaintId,
        'status_change',
        `تم تغيير حالة الشكوى #${data.complaintId} إلى ${data.newStatus}`
      );
    }
  });

  return transaction();
};

/**
 * Assign complaint with status history and notification in a single transaction
 */
export const assignComplaintWithNotification = (data: {
  complaintId: number;
  userId: number;
  adminId: number;
  oldStatus: string;
}) => {
  const transaction = db.transaction(() => {
    // Assign complaint (also updates status to 'assigned')
    stmtAssignComplaint.run(data.userId, 'assigned', data.complaintId);

    // Create status history if status changed
    if (data.oldStatus !== 'assigned') {
      stmtCreateStatusHistory.run(
        data.complaintId,
        data.adminId,
        data.oldStatus,
        'assigned',
        'تم تكليف الشكوى إلى موظف'
      );
    }

    // Notify user
    stmtCreateNotification.run(
      data.userId,
      data.complaintId,
      'assignment',
      `تم تكليفك بالشكوى #${data.complaintId}`
    );
  });

  return transaction();
};

/**
 * Create comment with notification in a single transaction
 */
export const createCommentWithNotification = (data: {
  complaintId: number;
  userId: number;
  commentText: string;
  isInternal: boolean;
  complaint: any;
}) => {
  const transaction = db.transaction(() => {
    // Create comment
    stmtCreateComment.run(data.complaintId, data.userId, data.commentText, data.isInternal ? 1 : 0);

    // Notify assigned user if not the commenter
    if (data.complaint.assigned_user_id && data.complaint.assigned_user_id !== data.userId) {
      stmtCreateNotification.run(
        data.complaint.assigned_user_id,
        data.complaintId,
        'comment',
        `تعليق جديد على الشكوى #${data.complaintId}`
      );
    }
  });

  return transaction();
};
