// src/pages/Unauthorized.tsx
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ShieldAlert className="w-20 h-20 text-amber-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          You don't have permission to access this page. 
          Please contact your administrator if you believe this is an error.
        </p>
        <button 
          onClick={() => navigate(-1)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Go Back
        </button>
      </div>
    </div>
  );
}