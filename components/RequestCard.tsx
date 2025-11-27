
import React, { useState } from 'react';
import { SalesRequest, Role, RequestStatus, RoleLabels } from '../types';
import StatusBadge from './StatusBadge';

interface Props {
  request: SalesRequest;
  currentRole: Role;
  onApprove: (id: string, note?: string) => void;
  onReject: (id: string, reason: string) => void;
  roleLabels: RoleLabels;
}

const RequestCard: React.FC<Props> = ({ request, currentRole, onApprove, onReject, roleLabels }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionNote, setActionNote] = useState('');

  // Determine if the current user can act on this request
  const canAct =
    (currentRole === Role.APPROVER_L1 && request.status === RequestStatus.PENDING_L1) ||
    (currentRole === Role.APPROVER_L2 && request.status === RequestStatus.PENDING_L2);

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
                                        event.action === 'Approved' ? 'text-green-600' : 'text-gray-500'
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
