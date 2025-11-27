
import React, { useState } from 'react';
import { SalesRequest, Role, RequestStatus, RoleLabels } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  request: SalesRequest;
  currentRole: Role;
  activeUserName: string;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, reason: string) => void;
  onSubmitHawb: (id: string, hawb: string, remarks: string) => void;
  roleLabels: RoleLabels;
}

const RequestCard: React.FC<Props> = ({ request, currentRole, activeUserName, onApprove, onReject, onSubmitHawb, roleLabels }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionNote, setActionNote] = useState('');
  
  // HAWB State
  const [hawbNumbers, setHawbNumbers] = useState(request.hawbSubmission?.hawbNumbers || '');
  const [hawbRemarks, setHawbRemarks] = useState(request.hawbSubmission?.remarks || '');
  const [isSubmittingHawb, setIsSubmittingHawb] = useState(false);

  // Determine if the current user can act on this request
  const canAct =
    (currentRole === Role.APPROVER_L1 && request.status === RequestStatus.PENDING_L1) ||
    (currentRole === Role.APPROVER_L2 && request.status === RequestStatus.PENDING_L2) ||
    (currentRole === Role.APPROVER_L3 && request.status === RequestStatus.PENDING_L3);

  // Can submit HAWB if approved AND current user is the creator
  const canSubmitHawb = 
    request.status === RequestStatus.APPROVED && 
    request.createdBy === activeUserName;

  const handleApproveClick = () => {
    onApprove(request.id, actionNote);
    setActionNote('');
  };

  const handleRejectClick = () => {
    if (actionNote.trim()) {
      onReject(request.id, actionNote);
      setActionNote('');
    } else {
      alert("Please provide a justification for rejection.");
    }
  };

  const handleHawbSubmitClick = () => {
      if (!hawbNumbers.trim()) {
          alert("Please enter at least one HAWB number.");
          return;
      }
      setIsSubmittingHawb(true);
      onSubmitHawb(request.id, hawbNumbers, hawbRemarks);
      setIsSubmittingHawb(false);
  };

  const getRiskColor = (level?: string) => {
    if (level === 'High') return 'text-red-600';
    if (level === 'Medium') return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                {request.icirs}
              </span>
              <StatusBadge status={request.status} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{request.customerName}</h3>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3 text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">Territory</span>
                    <span className="font-medium text-gray-700">{request.territory}</span>
                </div>
                 <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">Destination</span>
                    <span className="font-medium text-gray-700">{request.destination}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-gray-400 text-xs">Weight</span>
                    <span className="font-medium text-gray-700">{request.weight}</span>
                </div>
            </div>
            
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
              Submitted by <span className="font-medium text-gray-600">{request.createdBy}</span> 
              <span className="text-gray-300">|</span> 
              <span className="text-gray-500">{request.submitterEmail}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
               {new Date(request.createdAt).toLocaleDateString()} at {new Date(request.createdAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right pl-4 border-l border-gray-100 ml-4">
            <div className="text-2xl font-bold text-gray-900">
              ${request.requestedPrice.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mt-1">Req. Price</div>
          </div>
        </div>

        {/* AI Analysis Section */}
        {request.aiAnalysis ? (
           <div className="mt-5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
               <i className="fas fa-sparkles text-indigo-500"></i>
               <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Gemini Analysis</h4>
            </div>
            <div className="flex items-center gap-4 text-sm">
                <div className="flex flex-col">
                    <span className="text-gray-500 text-xs">Risk Level</span>
                    <span className={`font-bold ${getRiskColor(request.aiAnalysis.riskLevel)}`}>
                        {request.aiAnalysis.riskLevel} ({request.aiAnalysis.riskScore}/100)
                    </span>
                </div>
                <div className="w-px h-8 bg-indigo-200"></div>
                <div className="flex-1">
                    <p className="text-gray-700 italic">"{request.aiAnalysis.summary}"</p>
                </div>
            </div>
          </div>
        ) : (
             <div className="mt-4 h-12 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center text-xs text-gray-400">
                <i className="fas fa-circle-notch fa-spin mr-2"></i> Analyzing deal data...
             </div>
        )}

        {/* HAWB Submission Section - Visible if Approved OR Completed */}
        {(request.status === RequestStatus.APPROVED || request.status === RequestStatus.COMPLETED) && (
            <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                    <i className="fas fa-shipping-fast text-blue-600"></i>
                    <h4 className="text-sm font-bold text-gray-800">Post-Approval Fulfillment</h4>
                </div>

                {canSubmitHawb ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                         <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">HAWB Number(s)</label>
                            <input 
                                type="text"
                                className="w-full text-sm border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Enter HAWB numbers..."
                                value={hawbNumbers}
                                onChange={(e) => setHawbNumbers(e.target.value)}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks / Notes</label>
                             <textarea 
                                className="w-full text-sm border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Additional details..."
                                rows={2}
                                value={hawbRemarks}
                                onChange={(e) => setHawbRemarks(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleHawbSubmitClick}
                            disabled={isSubmittingHawb}
                            className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-md hover:bg-blue-700 transition-colors"
                        >
                            {request.hawbSubmission ? 'Update HAWB Details' : 'Submit HAWB & Close Request'}
                        </button>
                    </div>
                ) : (
                    request.hawbSubmission ? (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-xs text-gray-500">HAWB Numbers</span>
                                    <span className="font-mono font-medium text-gray-800">{request.hawbSubmission.hawbNumbers}</span>
                                </div>
                                <div>
                                    <span className="block text-xs text-gray-500">Submitted At</span>
                                    <span className="text-gray-800">{new Date(request.hawbSubmission.submittedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            {request.hawbSubmission.remarks && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                    <span className="block text-xs text-gray-500">Remarks</span>
                                    <span className="text-gray-800 italic">{request.hawbSubmission.remarks}</span>
                                </div>
                            )}
                             {request.status === RequestStatus.COMPLETED && (
                                <div className="mt-3 text-center">
                                    <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded font-medium">Request Completed</span>
                                </div>
                            )}
                        </div>
                    ) : (
                         <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded text-center">
                            Pending HAWB submission by requester.
                        </div>
                    )
                )}
            </div>
        )}

        <div className="mt-4">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 focus:outline-none transition-colors"
            >
                {isExpanded ? 'Hide History' : 'Show Approval History'}
                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
            </button>
            
            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600 animate-in fade-in">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="fas fa-history text-gray-400"></i> History Log
                    </h5>
                    <ul className="space-y-3 pl-2 border-l-2 border-gray-100">
                        {request.history.map((event, idx) => (
                            <li key={idx} className="relative pl-4">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white bg-gray-300"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400">{new Date(event.timestamp).toLocaleString(undefined, {dateStyle:'short', timeStyle:'short'})}</span>
                                    {/* Display dynamic role name if available, fallback to stored string */}
                                    <span className="font-medium text-gray-800">
                                        {roleLabels[event.actor] || event.actor}
                                    </span>
                                    <span className={`text-xs ${
                                        event.action === 'Rejected' ? 'text-red-600' :
                                        event.action === 'Approved' ? 'text-green-600' : 
                                        event.action === 'Completed' ? 'text-gray-700' : 'text-gray-500'
                                    }`}>{event.action}</span>
                                    {event.note && <span className="text-gray-600 text-xs italic mt-0.5 bg-gray-50 p-2 rounded block border border-gray-100">"{event.note}"</span>}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* Action Section for Approvers */}
        {canAct && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                Approval/Rejection Justification
            </label>
            <textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter a note justifying your decision (Required for rejection, recommended for approval)..."
                className="w-full text-sm border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none mb-3"
                rows={2}
            />
            <div className="flex items-center gap-3">
                <button
                onClick={handleApproveClick}
                className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm transition-colors flex justify-center items-center gap-2"
                >
                <i className="fas fa-check"></i> Approve
                </button>
                <button
                onClick={handleRejectClick}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-100"
                >
                Reject
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
