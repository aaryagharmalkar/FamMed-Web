import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useConnectGoogleCalendar, useGoogleConnectionStatus } from '../../hooks/useGoogleCalendar';

const GoogleCalendarConnect = ({ compact = false }) => {
  const { data: status, isLoading, isError, error, refetch, isFetching } = useGoogleConnectionStatus();
  const connectMutation = useConnectGoogleCalendar();

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <Loader2 size={14} className="animate-spin" />
        Checking Google connection...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5" />
          <div>
            <p className="font-medium">Google connection check failed</p>
            <p className="text-xs opacity-90">{error?.message || 'Please verify backend setup and try again.'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded border border-amber-400 bg-white px-3 py-2 text-xs font-medium text-amber-800 disabled:opacity-60 dark:border-amber-600 dark:bg-slate-900 dark:text-amber-200"
          >
            <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
            Retry check
          </button>
          <button
            type="button"
            onClick={() => connectMutation.mutate()}
            disabled={connectMutation.isPending}
            className="rounded bg-sky-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
          >
            {connectMutation.isPending ? 'Redirecting...' : 'Connect anyway'}
          </button>
        </div>
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className={`flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ${compact ? '' : 'w-full'}`}>
        <CheckCircle2 size={16} />
        <span>Google Calendar connected {status?.email ? `as ${status.email}` : ''}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => connectMutation.mutate()}
      disabled={connectMutation.isPending}
      className={`rounded bg-sky-600 px-3 py-2 text-sm text-white disabled:opacity-60 ${compact ? '' : 'w-full'}`}
    >
      {connectMutation.isPending ? 'Redirecting...' : 'Connect Google Calendar'}
    </button>
  );
};

export default GoogleCalendarConnect;
