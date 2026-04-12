import { useState } from 'react';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/authService';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    if (error) toast.error(error.message || 'Unable to send reset email');
    else toast.success('Reset link sent');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <input className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        <button disabled={loading} className="w-full rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-50" type="submit">
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
