import { useState, useEffect } from 'react';
import { Eye, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';

export interface VerificationRequest {
  userId: string;
  email: string;
  fullName: string;
  role: string;
  specificName: string; // Unit Number or Company Name
  createdAt: string;
  pendingDocsCount: number;
}

interface VerificationTableProps {
  onSelect: (request: VerificationRequest) => void;
}

export function VerificationTable({ onSelect }: VerificationTableProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<VerificationRequest[]>('/admin/verifications');
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch verification requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate uppercase tracking-tight">Pending Verifications</h3>
          <p className="text-xs text-gray-500">Review submitted clearance documents and military credentials.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-tactical' : ''}`} />
          Refresh Queue
        </Button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-sm border border-border">Loading queue...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-sm border border-border p-12 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-slate">All Clear!</h3>
          <p className="text-gray-500 mt-2">No pending verification requests at this time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-sm border border-border overflow-hidden overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[700px]">
            <thead className="bg-slate/5 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">User / Entity</th>
                <th className="px-6 py-3">Role Requested</th>
                <th className="px-6 py-3">Submitted</th>
                <th className="px-6 py-3">Pending Docs</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr key={req.userId} className="hover:bg-slate/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate">{req.fullName}</div>
                    <div className="text-xs text-gray-500">{req.email}</div>
                    {req.specificName !== 'N/A' && (
                      <div className="text-xs text-tactical mt-0.5">{req.specificName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${req.role === 'MILITARY_UNIT' ? 'bg-green-50 text-green-700 border-green-200' :
                        req.role === 'SELLER' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                      {req.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                      {req.pendingDocsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelect(req)}
                      className="flex items-center gap-2 ml-auto text-tactical hover:text-slate font-bold text-xs uppercase"
                    >
                      Review <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}