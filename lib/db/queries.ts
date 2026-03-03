import db from './schema';

// User Queries
export const getUserByEmail = (email: string) => {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
};

export const getUserById = (id: number) => {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
};

export const getAllUsers = () => {
  return db.prepare('SELECT id, name, email, role, status, created_at FROM users').all();
};

export const getActiveUsers = () => {
  return db.prepare('SELECT id, name, email, role, status FROM users WHERE status = ? AND role = ?')
    .all('active', 'user');
};

export const createUser = (name: string, email: string, password: string, role: string) => {
  return db.prepare(`
    INSERT INTO users (name, email, password, role, status)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, email, password, role, 'active');
};

export const updateUserStatus = (userId: number, status: string) => {
  return db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
};

// Complaint Queries
export const createComplaint = (data: {
  client_phone: string;
  client_national_id: string;
  client_name: string;
  complaint_type_id: number;
  description: string;
  kiosk_id: number;
  priority: string;
}) => {
  return db.prepare(`
    INSERT INTO complaints (client_phone, client_national_id, client_name, complaint_type_id, description, kiosk_id, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
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
  return db.prepare(`
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
  `).get(id);
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
    query += ' AND DATE(c.created_at) >= DATE(?)';
    params.push(filters.date_from);
  }

  if (filters?.date_to) {
    query += ' AND DATE(c.created_at) <= DATE(?)';
    params.push(filters.date_to);
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
  return db.prepare(`
    UPDATE complaints 
    SET assigned_user_id = ?, status = 'assigned' 
    WHERE id = ?
  `).run(userId, complaintId);
};

export const updateComplaintStatus = (complaintId: number, status: string) => {
  return db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, complaintId);
};

export const closeComplaint = (complaintId: number, isSatisfied: boolean) => {
  return db.prepare(`
    UPDATE complaints 
    SET status = 'closed', closed_at = CURRENT_TIMESTAMP, is_satisfied = ? 
    WHERE id = ?
  `).run(isSatisfied ? 1 : 0, complaintId);
};

export const reopenComplaint = (complaintId: number) => {
  return db.prepare(`
    UPDATE complaints 
    SET status = 'reopened', is_reopened = 1, assigned_user_id = NULL 
    WHERE id = ?
  `).run(complaintId);
};

// Complaint Types Queries
export const getAllComplaintTypes = () => {
  return db.prepare('SELECT * FROM complaint_types ORDER BY level ASC, display_order ASC').all();
};

export const getComplaintTypeById = (id: number) => {
  return db.prepare('SELECT * FROM complaint_types WHERE id = ?').get(id);
};

// Kiosk Queries
export const getKioskByLink = (link: string) => {
  return db.prepare('SELECT * FROM kiosks WHERE unique_link = ?').get(link);
};

export const getAllKiosks = () => {
  return db.prepare('SELECT * FROM kiosks ORDER BY location').all();
};

export const getKioskById = (id: number) => {
  return db.prepare('SELECT * FROM kiosks WHERE id = ?').get(id);
};

export const createKiosk = (uniqueLink: string, location: string) => {
  return db.prepare('INSERT INTO kiosks (unique_link, location) VALUES (?, ?)').run(uniqueLink, location);
};

export const updateKiosk = (id: number, location: string) => {
  return db.prepare('UPDATE kiosks SET location = ? WHERE id = ?').run(location, id);
};

export const deleteKiosk = (id: number) => {
  return db.prepare('DELETE FROM kiosks WHERE id = ?').run(id);
};

// Attachment Queries
export const createAttachment = (complaintId: number, filePath: string, fileType: string, uploadedBy: string) => {
  return db.prepare(`
    INSERT INTO attachments (complaint_id, file_path, file_type, uploaded_by)
    VALUES (?, ?, ?, ?)
  `).run(complaintId, filePath, fileType, uploadedBy);
};

export const getComplaintAttachments = (complaintId: number) => {
  return db.prepare('SELECT * FROM attachments WHERE complaint_id = ? ORDER BY upload_date DESC').all(complaintId);
};

// Comment Queries
export const createComment = (complaintId: number, userId: number, commentText: string, isInternal: boolean) => {
  return db.prepare(`
    INSERT INTO comments (complaint_id, user_id, comment_text, is_internal)
    VALUES (?, ?, ?, ?)
  `).run(complaintId, userId, commentText, isInternal ? 1 : 0);
};

export const getComplaintComments = (complaintId: number) => {
  return db.prepare(`
    SELECT c.*, u.name as user_name
    FROM comments c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.complaint_id = ?
    ORDER BY c.created_at DESC
  `).all(complaintId);
};

// Status History Queries
export const createStatusHistory = (
  complaintId: number,
  userId: number,
  oldStatus: string,
  newStatus: string,
  description: string
) => {
  return db.prepare(`
    INSERT INTO status_history (complaint_id, user_id, old_status, new_status, change_description)
    VALUES (?, ?, ?, ?, ?)
  `).run(complaintId, userId, oldStatus, newStatus, description);
};

export const getComplaintStatusHistory = (complaintId: number) => {
  return db.prepare(`
    SELECT sh.*, u.name as user_name
    FROM status_history sh
    LEFT JOIN users u ON sh.user_id = u.id
    WHERE sh.complaint_id = ?
    ORDER BY sh.created_at DESC
  `).all(complaintId);
};

// Auto Assignment Queries
export const getAutoAssignmentRules = (complaintTypeId: number) => {
  return db.prepare(`
    SELECT aar.*, u.name as user_name
    FROM auto_assignment_rules aar
    LEFT JOIN users u ON aar.user_id = u.id
    WHERE aar.complaint_type_id = ? AND aar.is_active = 1
  `).all(complaintTypeId);
};

export const createAutoAssignmentRule = (complaintTypeId: number, userId: number) => {
  return db.prepare(`
    INSERT INTO auto_assignment_rules (complaint_type_id, user_id, is_active)
    VALUES (?, ?, ?)
  `).run(complaintTypeId, userId, 1);
};

export const deleteAutoAssignmentRule = (id: number) => {
  return db.prepare('DELETE FROM auto_assignment_rules WHERE id = ?').run(id);
};

// Notification Queries
export const createNotification = (userId: number, complaintId: number | null, type: string, message: string) => {
  return db.prepare(`
    INSERT INTO notifications (user_id, complaint_id, type, message)
    VALUES (?, ?, ?, ?)
  `).run(userId, complaintId, type, message);
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
  return db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId);
};

// Registration Link Queries
export const createRegistrationLink = (token: string, expiresAt: string, role: string = 'user') => {
  return db.prepare(`
    INSERT INTO registration_links (token, expires_at, role)
    VALUES (?, ?, ?)
  `).run(token, expiresAt, role);
};

export const getRegistrationLink = (token: string) => {
  return db.prepare('SELECT * FROM registration_links WHERE token = ?').get(token);
};

export const useRegistrationLink = (token: string, userId: number, deviceFingerprint: string) => {
  return db.prepare(`
    UPDATE registration_links 
    SET is_used = 1, user_id = ?, device_fingerprint = ?
    WHERE token = ?
  `).run(userId, deviceFingerprint, token);
};

// Device Registration Queries
export const registerDevice = (userId: number, deviceFingerprint: string, registrationToken: string) => {
  return db.prepare(`
    INSERT INTO user_devices (user_id, device_fingerprint, registration_token)
    VALUES (?, ?, ?)
  `).run(userId, deviceFingerprint, registrationToken);
};

export const getUserDevice = (userId: number, deviceFingerprint: string) => {
  return db.prepare(`
    SELECT * FROM user_devices 
    WHERE user_id = ? AND device_fingerprint = ? AND is_active = 1
  `).get(userId, deviceFingerprint);
};

// Analytics Queries
export const getComplaintStats = () => {
  return {
    total: db.prepare('SELECT COUNT(*) as count FROM complaints').get(),
    new: db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'new'").get(),
    assigned: db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'assigned'").get(),
    in_progress: db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'in_progress'").get(),
    resolved: db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'resolved'").get(),
    closed: db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'closed'").get(),
    reopened: db.prepare("SELECT COUNT(*) as count FROM complaints WHERE status = 'reopened'").get(),
  };
};

export const getUserPerformance = () => {
  return db.prepare(`
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
  `).all();
};

// Pagination Queries
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
    query += ' AND DATE(c.created_at) >= DATE(?)';
    countQuery += ' AND DATE(c.created_at) >= DATE(?)';
    params.push(filters.date_from);
  }

  if (filters?.date_to) {
    query += ' AND DATE(c.created_at) <= DATE(?)';
    countQuery += ' AND DATE(c.created_at) <= DATE(?)';
    params.push(filters.date_to);
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

// Kiosk disable/enable
export const toggleKioskStatus = (id: number, isDisabled: boolean) => {
  return db.prepare('UPDATE kiosks SET is_disabled = ? WHERE id = ?').run(isDisabled ? 1 : 0, id);
};

// User Statistics
export const getUserStats = (userId: number) => {
  const stats = db.prepare(`
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
  `).get(userId) as { total: number; closed: number; avgHoursToClose: number | null };

  return {
    total: stats.total || 0,
    closed: stats.closed || 0,
    avgHoursToClose: stats.avgHoursToClose || 0,
  };
};
