import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { signIn, signInWithGoogle } from '../services/authService';

const schema = z.object({
	email: z.string().email('Enter a valid email'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({ resolver: zodResolver(schema) });

	const onSubmit = async (values) => {
		setLoading(true);
		const { error } = await signIn(values.email, values.password);
		if (error) toast.error(error.message || 'Login failed');
		else {
			toast.success('Welcome back');
			navigate('/');
		}
		setLoading(false);
	};

	return (
		<div className="grid min-h-screen grid-cols-1 lg:grid-cols-[40%_60%]" style={{ background: 'var(--bg)' }}>
			<section className="relative hidden px-10 py-10 text-white lg:flex lg:flex-col" style={{ background: 'linear-gradient(160deg, var(--primary) 0%, #0f766e 100%)' }}>
				<div className="badge" style={{ width: 'fit-content', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>💊 MedTrack</div>
				<div className="my-auto max-w-md">
					<h1 className="text-5xl font-extrabold text-white">Welcome back to your family care space.</h1>
					<p className="mt-5 text-base text-blue-100">Track medicines, monitor adherence, and keep everyone on schedule with calm confidence.</p>
				</div>
				<div className="space-y-3 text-sm">
					<div className="flex items-center gap-2"><CheckCircle2 size={16} /> Smart reminders and dose tracking</div>
					<div className="flex items-center gap-2"><CheckCircle2 size={16} /> AI prescription extraction</div>
					<div className="flex items-center gap-2"><CheckCircle2 size={16} /> Secure cloud sync for families</div>
				</div>
			</section>

			<section className="flex items-center justify-center px-4 py-8 sm:px-6">
				<form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-[420px] space-y-4">
					<div className="text-center">
						<p className="badge badge-primary">Secure Sign In</p>
						<h2 className="mt-3">Welcome back</h2>
						<p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Sign in to manage your family's medicines.</p>
					</div>

					<button type="button" className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold" style={{ borderColor: 'var(--border)' }} onClick={signInWithGoogle}>
						<span>G</span>
						Continue with Google
					</button>

					<div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
						<div className="h-px flex-1" style={{ background: 'var(--border)' }} />
						or
						<div className="h-px flex-1" style={{ background: 'var(--border)' }} />
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium">Email</label>
						<input {...register('email')} type="email" className={`h-12 w-full px-3 ${errors.email ? 'border-red-500' : ''}`} />
						{errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
					</div>
					<div>
						<label className="mb-1 block text-sm font-medium">Password</label>
						<div className={`flex h-12 items-center rounded-[10px] border px-3 ${errors.password ? 'border-red-500' : ''}`} style={{ borderColor: errors.password ? '#ef4444' : 'var(--border)' }}>
							<input {...register('password')} type={showPassword ? 'text' : 'password'} className="h-full w-full border-none p-0 shadow-none focus:shadow-none" />
							<button type="button" onClick={() => setShowPassword((v) => !v)} className="text-slate-500">
								{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
						{errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
					</div>

					<button disabled={loading} className="btn-primary h-12 w-full disabled:opacity-60" type="submit">
						{loading ? 'Signing in...' : 'Sign In'}
					</button>

					<div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted)' }}>
						<Link to="/reset-password" className="font-semibold" style={{ color: 'var(--primary)' }}>Forgot password?</Link>
						<span className="inline-flex items-center gap-1 text-xs"><ShieldCheck size={14} /> Encrypted</span>
					</div>

					<p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
						Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign up</Link>
					</p>
				</form>
			</section>
		</div>
	);
};

export default Login;
