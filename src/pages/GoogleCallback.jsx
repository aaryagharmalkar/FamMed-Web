import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCompleteGoogleConnect } from '../hooks/useGoogleCalendar';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const completeConnect = useCompleteGoogleConnect();

  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) {
      navigate('/medicines', { replace: true });
      return;
    }

    completeConnect.mutate(code, {
      onSettled: () => {
        navigate('/medicines', { replace: true });
      },
    });
  }, [completeConnect, navigate, searchParams]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="text-sm text-slate-600">Connecting Google Calendar...</p>
    </div>
  );
};

export default GoogleCallback;
