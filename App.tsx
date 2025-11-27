

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Role, 
  RequestStatus, 
  SalesRequest, 
  DashboardStats,
  User,
  RoleLabels
} from './types';
import * as StorageService from './services/storageService';
import * as GeminiService from './services/geminiService';
import RequestCard from './components/RequestCard';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [roleLabels, setRoleLabels] = useState<RoleLabels | null>(null);
  const [view, setView] = useState<'dashboard' | 'admin'>('dashboard');
  
  const [requests, setRequests] = useState<SalesRequest[]>([]);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    icirs: '',
    customerName: '',
    territory: '',
    weight: '',
    destination: '',
    requestedPrice: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Data
  useEffect(() => {
    refreshMetadata();
    // Ensure default users exist if first run
    StorageService.getUsers();
  }, []);

  const refreshMetadata = () => {
      setRoleLabels(StorageService.getRoleLabels());
  };

  // Stats calculation
  const stats: DashboardStats = useMemo(() => {
    return requests.reduce((acc, curr) => {
      acc.totalRequests++;
      if (curr.status === RequestStatus.APPROVED) {
        acc.approved++;
        acc.approvedValue += curr.requestedPrice;
      }
      if (curr.status === RequestStatus.REJECTED) acc.rejected++;
      if (curr.status.startsWith('Pending')) acc.pendingValue += curr.requestedPrice;
      return acc;
    }, { totalRequests: 0, approved: 0, rejected: 0, pendingValue: 0, approvedValue: 0 });
  }, [requests]);

  const chartData = useMemo(() => {
     const data = [
        { name: 'Approved', value: stats.approved, color: '#10B981' },
        { name: 'Pending', value: requests.filter(r => r.status.startsWith('Pending')).length, color: '#F59E0B' },
        { name: 'Rejected', value: stats.rejected, color: '#EF4444' },
     ];
     return data.filter(d => d.value > 0);
  }, [stats, requests]);


  useEffect(() => {
    if (activeUser) {
        loadRequests();
        // Reset view to dashboard if user loses admin access
        if (activeUser.role !== Role.ADMIN && view === 'admin') {
            setView('dashboard');
        }
    }
  }, [activeUser]);

  const loadRequests = () => {
    if (!activeUser) return;
    const data = StorageService.fetchRequests(activeUser.role);
    setRequests(data);
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLogin = (user: User) => {
      setActiveUser(user);
      refreshMetadata(); // Ensure roles are fresh on login
  };

  const handleLogout = () => {
      setActiveUser(null);
      setView('dashboard');
      setRequests([]);
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    
    setIsSubmitting(true);
    
    const priceVal = parseFloat(formData.requestedPrice);
    
    const newReq = StorageService.createRequest({
        icirs: formData.icirs,
        customerName: formData.customerName,
        territory: formData.territory,
        weight: formData.weight,
        destination: formData.destination,
        requestedPrice: priceVal,
        submitterEmail: formData.email,
        status: RequestStatus.PENDING_L1,
        createdBy: activeUser.name, 
    });

    setRequests(prev => [newReq, ...prev]);
    setShowNewRequestModal(false);
    setFormData({ icirs: '', customerName: '', territory: '', weight: '', destination: '', requestedPrice: '', email: '' });
    showToast("Request submitted! AI is analyzing...");
    setIsSubmitting(false);

    // Trigger AI Analysis in background
    const analysis = await GeminiService.analyzeDeal(newReq.icirs, newReq.customerName, newReq.territory, newReq.weight, newReq.destination, priceVal);
    if (analysis) {
        StorageService.updateRequestAnalysis(newReq.id, analysis);
        loadRequests(); // Refresh to show AI data
        showToast("AI Risk Assessment completed!", 'info');
    }
  };

  const handleApprove = (id: string, note?: string) => {
    if (!activeUser) return;
    let nextStatus = RequestStatus.APPROVED;
    // Find request to get email
    const req = requests.find(r => r.id === id);
    const email = req?.submitterEmail || 'submitter';

    // Get display name for next level
    const l2Label = roleLabels ? roleLabels[Role.APPROVER_L2] : "Level 2";

    let successMsg = `Request finally approved! Automatic email sent to ${email}.`;

    if (activeUser.role === Role.APPROVER_L1) {
        nextStatus = RequestStatus.PENDING_L2;
        successMsg = `Approved! Escalated to ${l2Label}.`;
    }

    const updated = StorageService.updateRequestStatus(id, nextStatus, activeUser.role, note);
    if (updated) {
        loadRequests();
        showToast(successMsg);
    }
  };

  const handleReject = (id: string, reason: string) => {
    if (!activeUser) return;
    const updated = StorageService.updateRequestStatus(id, RequestStatus.REJECTED, activeUser.role, reason);
    if (updated) {
        loadRequests();
        showToast("Request rejected.");
    }
  };

  const handleHawbSubmit = (id: string, hawb: string, remarks: string) => {
      StorageService.submitHawbDetails(id, hawb, remarks);
      loadRequests();
      showToast("HAWB details submitted successfully!");
  };

  const handleReset = () => {
      StorageService.resetData();
      loadRequests();
      showToast("System reset. All data cleared.", 'info');
  };

  const handleExport = () => {
    if (requests.length === 0) {
        showToast("No data to export", "info");
        return;
    }

    const escapeCsv = (text: string | number | undefined) => {
        if (text === undefined || text === null) return '';
        const stringValue = String(text);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const headers = [
        "Request ID",
        "ICIRS",
        "Customer Name",
        "Territory",
        "Weight",
        "Destination",
        "Requested Price",
        "Status",
        "Submitter Email",
        "Created Date",
        "AI Risk Level",
        "AI Risk Score",
        "AI Summary",
        "Submitted HAWBs",
        "HAWB Remarks"
    ];

    const csvRows = requests.map(r => [
        escapeCsv(r.id),
        escapeCsv(r.icirs),
        escapeCsv(r.customerName),
        escapeCsv(r.territory),
        escapeCsv(r.weight),
        escapeCsv(r.destination),
        escapeCsv(r.requestedPrice),
        escapeCsv(r.status),
        escapeCsv(r.submitterEmail),
        escapeCsv(new Date(r.createdAt).toLocaleString()),
        escapeCsv(r.aiAnalysis?.riskLevel || "N/A"),
        escapeCsv(r.aiAnalysis?.riskScore || "N/A"),
        escapeCsv(r.aiAnalysis?.summary || "N/A"),
        escapeCsv(r.hawbSubmission?.hawbNumbers || "Pending"),
        escapeCsv(r.hawbSubmission?.remarks || "")
    ]);

    const csvContent = [
        headers.join(","),
        ...csvRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Requests_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Data exported to Excel (CSV) successfully!");
  };

  // Filter requests for the current view
  const visibleRequests = useMemo(() => {
    if (!activeUser) return [];
    if (activeUser.role === Role.ADMIN) return requests; // Admin sees all
    if (activeUser.role === Role.SALESPERSON) return requests;
    if (activeUser.role === Role.APPROVER_L1) {
        return requests.filter(r => r.status === RequestStatus.PENDING_L1);
    }
    if (activeUser.role === Role.APPROVER_L2) {
        return requests.filter(r => r.status === RequestStatus.PENDING_L2);
    }
    return [];
  }, [requests, activeUser]);

  const approvalHistory = useMemo(() => {
    if (!activeUser) return [];
    if (activeUser.role === Role.SALESPERSON) return [];
    return requests.filter(r => {
        if (activeUser.role === Role.APPROVER_L1) return r.status !== RequestStatus.PENDING_L1 && r.status !== RequestStatus.DRAFT;
        if (activeUser.role === Role.APPROVER_L2) return r.status === RequestStatus.APPROVED || r.status === RequestStatus.REJECTED;
        return false;
    });
  }, [requests, activeUser]);

  // --- RENDER ---

  // Show Login Screen if not authenticated
  if (!activeUser || !roleLabels) {
      return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium animate-bounce ${notification.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
            <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} mr-2`}></i>
            {notification.message}
        </div>
      )}

      {/* Sidebar / Navigation */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                <i className="fas fa-layer-group mr-2 text-blue-400"></i>
                FlowTrack
            </h1>
            <p className="text-xs text-slate-400 mt-1">AI-Powered Approvals</p>
        </div>
        
        <div className="p-6 flex-1">
            {/* User Profile Summary */}
            <div className="mb-8 flex items-center gap-3 bg-slate-800 p-3 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm">
                    {activeUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                    <div className="text-sm font-medium truncate">{activeUser.name}</div>
                    <div className="text-xs text-slate-400 truncate">{roleLabels[activeUser.role]}</div>
                </div>
            </div>

            <nav className="space-y-2">
                <div 
                    onClick={() => setView('dashboard')}
                    className={`px-4 py-2 rounded-md flex items-center gap-3 cursor-pointer ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                    <i className="fas fa-chart-pie w-5"></i>
                    <span>Dashboard</span>
                </div>
                
                {activeUser.role === Role.ADMIN && (
                    <div 
                        onClick={() => setView('admin')}
                        className={`px-4 py-2 rounded-md flex items-center gap-3 cursor-pointer ${view === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <i className="fas fa-users-cog w-5"></i>
                        <span>Admin Panel</span>
                    </div>
                )}
            </nav>
        </div>
        
        <div className="p-6 border-t border-slate-800 space-y-4">
             <button 
                onClick={handleLogout} 
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
                <i className="fas fa-sign-out-alt"></i> Log Out
            </button>
            <button onClick={handleReset} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-2 justify-center w-full">
                <i className="fas fa-trash"></i> Reset Demo Data
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    {view === 'admin' ? 'Administration' : (activeUser.role === Role.SALESPERSON ? 'My Dashboard' : 'Approval Queue')}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                    Welcome back, <span className="font-semibold text-gray-700">{activeUser.name}</span>
                </p>
            </div>
            
            {view === 'dashboard' && (
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleExport}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center gap-2 text-sm"
                        title="Download Data in Excel Format"
                    >
                        <i className="fas fa-file-excel"></i> Export to Excel
                    </button>

                    {activeUser.role === Role.SALESPERSON && (
                        <button 
                            onClick={() => setShowNewRequestModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i> New Request
                        </button>
                    )}
                </div>
            )}
        </header>

        {view === 'admin' && activeUser.role === Role.ADMIN ? (
            <AdminPanel onLabelsUpdate={refreshMetadata} />
        ) : (
            <>
                {/* Salesperson Stats */}
                {activeUser.role === Role.SALESPERSON && requests.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-sm font-medium uppercase">Pending Value</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">${stats.pendingValue.toLocaleString()}</div>
                            <div className="text-green-500 text-xs mt-2 font-medium"><i className="fas fa-arrow-up"></i> Active Pipeline</div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-gray-500 text-sm font-medium uppercase">Approval Rate</div>
                                <div className="text-3xl font-bold text-gray-900 mt-2">
                                    {stats.totalRequests ? Math.round((stats.approved / stats.totalRequests) * 100) : 0}%
                                </div>
                            </div>
                            <div className="h-16 w-16">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} innerRadius={15} outerRadius={25} paddingAngle={5} dataKey="value">
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="text-gray-500 text-sm font-medium uppercase">Closed Won</div>
                            <div className="text-3xl font-bold text-gray-900 mt-2">${stats.approvedValue.toLocaleString()}</div>
                            <div className="text-gray-400 text-xs mt-2">Total approved volume</div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    <h3 className="text-lg font-bold text-gray-700 border-l-4 border-blue-500 pl-3">
                        {activeUser.role === Role.SALESPERSON ? 'Recent Requests' : 'Pending Approvals'}
                    </h3>
                    
                    {visibleRequests.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
                                <i className="fas fa-inbox"></i>
                            </div>
                            <p className="text-gray-500 font-medium">No requests found in this queue.</p>
                            {activeUser.role === Role.SALESPERSON && (
                                <p className="text-gray-400 text-sm mt-1">Click "New Request" to get started.</p>
                            )}
                        </div>
                    ) : (
                        visibleRequests.map(req => (
                            <RequestCard 
                                key={req.id} 
                                request={req} 
                                currentRole={activeUser.role}
                                activeUserName={activeUser.name}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                onSubmitHawb={handleHawbSubmit}
                                roleLabels={roleLabels}
                            />
                        ))
                    )}

                    {/* Manager History Section */}
                    {(activeUser.role === Role.APPROVER_L1 || activeUser.role === Role.APPROVER_L2) && approvalHistory.length > 0 && (
                        <>
                        <h3 className="text-lg font-bold text-gray-700 border-l-4 border-gray-300 pl-3 mt-12 opacity-70">
                            Recently Processed
                        </h3>
                        <div className="opacity-70 grayscale hover:grayscale-0 transition-all duration-300">
                            {approvalHistory.map(req => (
                                <div key={req.id} className="mt-4">
                                <RequestCard 
                                    request={req} 
                                    currentRole={activeUser.role}
                                    activeUserName={activeUser.name}
                                    onApprove={()=>{}} // Disable actions
                                    onReject={()=>{}}
                                    onSubmitHawb={handleHawbSubmit}
                                    roleLabels={roleLabels}
                                    />
                                </div>
                            ))}
                        </div>
                        </>
                    )}
                </div>
            </>
        )}
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">New Sales Request</h3>
                <button onClick={() => setShowNewRequestModal(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-times"></i>
                </button>
            </div>
            
            <form onSubmit={handleCreateRequest} className="p-6 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ICIRS</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. IC-2024-001"
                            value={formData.icirs}
                            onChange={e => setFormData({...formData, icirs: e.target.value})}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested Price ($)</label>
                        <input 
                            type="number" 
                            required
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                            value={formData.requestedPrice}
                            onChange={e => setFormData({...formData, requestedPrice: e.target.value})}
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. Global Logistics Inc."
                        value={formData.customerName}
                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                    />
                </div>
                
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Territory</label>
                    <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. North America / East Coast"
                        value={formData.territory}
                        onChange={e => setFormData({...formData, territory: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. 500kg"
                            value={formData.weight}
                            onChange={e => setFormData({...formData, weight: e.target.value})}
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                        <input 
                            type="text" 
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. New York, NY"
                            value={formData.destination}
                            onChange={e => setFormData({...formData, destination: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Email</label>
                    <input 
                        type="email" 
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. sales@example.com"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                    <p className="text-xs text-gray-500 mt-1">You will receive an email upon final approval.</p>
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        type="button"
                        onClick={() => setShowNewRequestModal(false)}
                        className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isSubmitting ? <i className="fas fa-spinner fa-spin"></i> : 'Submit Request'}
                    </button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
