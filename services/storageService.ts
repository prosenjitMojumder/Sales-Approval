
import { SalesRequest, RequestStatus, Role, User, RoleLabels, HawbSubmission, AppNotification } from "../types";

const STORAGE_KEY = "flowtrack_requests";
const USERS_KEY = "flowtrack_users";
const ROLES_KEY = "flowtrack_roles";
const NOTIFICATIONS_KEY = "flowtrack_notifications";

const getRequests = (): SalesRequest[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveRequests = (requests: SalesRequest[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
};

export const createRequest = (request: Omit<SalesRequest, "id" | "createdAt" | "updatedAt" | "history">): SalesRequest => {
  const requests = getRequests();
  const newRequest: SalesRequest = {
    ...request,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      {
        action: "Created",
        timestamp: new Date().toISOString(),
        actor: Role.SALESPERSON,
        note: "Request submitted for approval",
      },
    ],
  };
  
  requests.unshift(newRequest);
  saveRequests(requests);
  return newRequest;
};

// --- NOTIFICATIONS SYSTEM ---

export const getNotifications = (username: string): AppNotification[] => {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    return all
        .filter((n: AppNotification) => n.recipientUsername === username)
        .sort((a: AppNotification, b: AppNotification) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const saveNotifications = (notifications: AppNotification[]) => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const markNotificationRead = (id: string) => {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const index = all.findIndex((n: AppNotification) => n.id === id);
    if (index !== -1) {
        all[index].isRead = true;
        saveNotifications(all);
    }
};

export const markAllNotificationsRead = (username: string) => {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const updated = all.map((n: AppNotification) => {
        if (n.recipientUsername === username) {
            return { ...n, isRead: true };
        }
        return n;
    });
    saveNotifications(updated);
};

const createNotification = (recipient: string, message: string, type: 'success' | 'error' | 'info', requestId?: string) => {
    const all = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]");
    const newNote: AppNotification = {
        id: crypto.randomUUID(),
        recipientUsername: recipient,
        message,
        type,
        timestamp: new Date().toISOString(),
        isRead: false,
        requestId
    };
    all.unshift(newNote);
    saveNotifications(all);
};

// --- REQUEST UPDATES ---

export const updateRequestStatus = (
  id: string, 
  status: RequestStatus, 
  actor: Role, 
  note?: string
): SalesRequest | null => {
  const requests = getRequests();
  const index = requests.findIndex((r) => r.id === id);
  
  if (index === -1) return null;

  const currentRequest = requests[index];
  
  const updatedRequest: SalesRequest = {
    ...currentRequest,
    status,
    updatedAt: new Date().toISOString(),
    rejectionReason: status === RequestStatus.REJECTED ? note : undefined,
    history: [
      ...currentRequest.history,
      {
        action: status === RequestStatus.REJECTED ? "Rejected" : "Approved",
        timestamp: new Date().toISOString(),
        actor,
        note,
      },
    ],
  };

  requests[index] = updatedRequest;
  saveRequests(requests);

  // TRIGGER NOTIFICATIONS
  // Notify the creator if the request is finally Approved (Accepted by all) or Rejected (by anyone)
  if (status === RequestStatus.APPROVED) {
      createNotification(
          updatedRequest.createdBy, 
          `Good news! Request ${updatedRequest.icirs} for ${updatedRequest.customerName} has been fully APPROVED.`, 
          'success', 
          id
      );
  } else if (status === RequestStatus.REJECTED) {
      createNotification(
          updatedRequest.createdBy, 
          `Alert: Request ${updatedRequest.icirs} for ${updatedRequest.customerName} was REJECTED.`, 
          'error', 
          id
      );
  }

  return updatedRequest;
};

export const updateRequestAnalysis = (id: string, analysis: any) => {
    const requests = getRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return;
    
    requests[index].aiAnalysis = analysis;
    saveRequests(requests);
};

export const submitHawbDetails = (id: string, hawbNumbers: string, remarks: string) => {
    const requests = getRequests();
    const index = requests.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const submission: HawbSubmission = {
        hawbNumbers,
        remarks,
        submittedAt: new Date().toISOString()
    };

    requests[index].hawbSubmission = submission;
    requests[index].status = RequestStatus.COMPLETED;
    requests[index].updatedAt = new Date().toISOString();
    
    // Log the completion in history
    requests[index].history.push({
        action: "Completed",
        timestamp: new Date().toISOString(),
        actor: Role.SALESPERSON,
        note: "HAWB details submitted. Request closed."
    });
    
    saveRequests(requests);
    return requests[index];
};

export const fetchRequests = (role: Role): SalesRequest[] => {
  const all = getRequests();
  
  // Filter based on what the role needs to see
  if (role === Role.SALESPERSON) {
    return all; 
  }
  
  // Managers technically can see everything, but mainly care about pending
  return all;
};

export const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(NOTIFICATIONS_KEY);
    // We don't reset users here to prevent lockout, or we could reset to defaults
}

// --- USER MANAGEMENT ---

export const getUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_KEY);
  if (stored) return JSON.parse(stored);
  
  // Seed default users if none exist
  const defaults: User[] = [
    { id: '1', name: 'System Admin', username: 'admin', password: 'password123', role: Role.ADMIN },
    { id: '2', name: 'John Sales', username: 'john', password: 'password123', role: Role.SALESPERSON },
    { id: '3', name: 'Sarah Manager', username: 'sarah', password: 'password123', role: Role.APPROVER_L1 },
    { id: '4', name: 'Mike VP', username: 'mike', password: 'password123', role: Role.APPROVER_L2 },
    { id: '5', name: 'David Director', username: 'david', password: 'password123', role: Role.APPROVER_L3 },
  ];
  saveUsers(defaults);
  return defaults;
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const saveUser = (user: User) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
        users[idx] = user;
    } else {
        users.push(user);
    }
    saveUsers(users);
};

export const deleteUser = (id: string) => {
    const users = getUsers().filter(u => u.id !== id);
    saveUsers(users);
};

// --- ROLE MANAGEMENT ---

export const getRoleLabels = (): RoleLabels => {
  const stored = localStorage.getItem(ROLES_KEY);
  if (stored) return JSON.parse(stored);

  return {
    [Role.ADMIN]: 'Administrator',
    [Role.SALESPERSON]: 'Salesperson',
    [Role.APPROVER_L1]: 'Regional Manager (L1)',
    [Role.APPROVER_L2]: 'VP of Sales (L2)',
    [Role.APPROVER_L3]: 'Global Director (L3)',
  };
};

export const saveRoleLabels = (labels: RoleLabels) => {
  localStorage.setItem(ROLES_KEY, JSON.stringify(labels));
};
