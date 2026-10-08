import React, { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  doc
} from 'firebase/firestore';
import { AlertCircle, Check, Clock3, UserRound, X } from 'lucide-react';
import { auth, db } from '../../lib/firebase';

interface RegistrationRequest {
  id: string;
  email: string;
  submittedAt: Timestamp | null;
}

export const ApprovalRequests: React.FC = () => {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUid, setProcessingUid] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const pendingRequests = query(
      collection(db, 'users'),
      where('approvalStatus', '==', 'pending')
    );

    return onSnapshot(
      pendingRequests,
      (snapshot) => {
        setRequests(snapshot.docs.map((requestSnapshot) => {
          const data = requestSnapshot.data();
          return {
            id: requestSnapshot.id,
            email: typeof data.email === 'string' ? data.email : 'Unknown email',
            submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt : null
          };
        }));
        setErrorMessage('');
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load registration requests', error);
        setErrorMessage('Registration requests could not be loaded. Check your connection and Firestore rules.');
        setIsLoading(false);
      }
    );
  }, []);

  const reviewRequest = async (uid: string, approvalStatus: 'approved' | 'rejected') => {
    const adminUid = auth.currentUser?.uid;
    if (!adminUid) {
      setErrorMessage('Your administrator session has expired. Sign in again to review requests.');
      return;
    }

    setProcessingUid(uid);
    setErrorMessage('');
    try {
      await updateDoc(doc(db, 'users', uid), {
        approvalStatus,
        reviewedBy: adminUid,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(`Failed to ${approvalStatus} registration request`, error);
      setErrorMessage(`The request could not be ${approvalStatus}. Check your connection and administrator permissions.`);
    } finally {
      setProcessingUid(null);
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
      <div>
        <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <UserRound className="w-4 h-4 text-sky-400" aria-hidden="true" />
          Registration Requests
          <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] text-sky-300">
            {requests.length}
          </span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Approve an account to grant access, or reject it to keep it locked.
        </p>
      </div>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-slate-400">Loading registration requests...</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
          There are no pending registration requests.
        </p>
      ) : (
        <ul className="divide-y divide-slate-800">
          {requests.map((request) => (
            <li key={request.id} className="flex flex-col gap-3 py-4 first:pt-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="break-all text-sm font-bold text-white">{request.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  {request.submittedAt
                    ? `Requested ${request.submittedAt.toDate().toLocaleString()}`
                    : 'Submission time unavailable'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={processingUid !== null}
                  onClick={() => void reviewRequest(request.id, 'rejected')}
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-xs font-bold text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Reject
                </button>
                <button
                  type="button"
                  disabled={processingUid !== null}
                  onClick={() => void reviewRequest(request.id, 'approved')}
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 text-xs font-bold text-slate-950 transition-colors hover:bg-sky-400 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Approve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
