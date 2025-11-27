
import React from 'react';
import { RequestStatus } from '../types';

interface Props {
  status: RequestStatus;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  let icon = 'fa-circle';

  switch (status) {
    case RequestStatus.APPROVED:
      colorClass = 'bg-green-100 text-green-800 border border-green-200';
      icon = 'fa-check-circle';
      break;
    case RequestStatus.REJECTED:
      colorClass = 'bg-red-100 text-red-800 border border-red-200';
      icon = 'fa-times-circle';
      break;
    case RequestStatus.PENDING_L1:
      colorClass = 'bg-blue-50 text-blue-700 border border-blue-200';
      icon = 'fa-clock';
      break;
    case RequestStatus.PENDING_L2:
      colorClass = 'bg-purple-50 text-purple-700 border border-purple-200';
      icon = 'fa-clock';
      break;
    case RequestStatus.PENDING_L3:
      colorClass = 'bg-orange-50 text-orange-700 border border-orange-200';
      icon = 'fa-clock';
      break;
    default:
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <i className={`fas ${icon} mr-1.5`}></i>
      {status}
    </span>
  );
};

export default StatusBadge;