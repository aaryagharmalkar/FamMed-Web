import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { signUp } from '../services/authService';

const schema = z
	.object({
		fullName: z.string().min(2, 'Enter full name'),
		email: z.string().email('Enter a valid email'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string(),
	})
	.refine((value) => value.password === value.confirmPassword, {
		message: 'Passwords must match',
		path: ['confirmPassword'],
	});

const Register = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({ resolver: zodResolver(schema) });

	const onSubmit = async (values) => {
		setLoading(true);
		const { error } = await signUp(values.email, values.password, values.fullName);
		if (error) toast.error(error.message || 'Registration failed');
		else {
			toast.success('Account created');
			navigate('/');
		}
		setLoading(false);
	};

	return (
		<div className="grid min-h-screen grid-cols-1 lg:grid-cols-[40%_60%]" style={{ background: 'var(--bg)' }}>
			<section className="relative hidden px-10 py-10 text-white lg:flex lg:flex-col" style={{ background: 'linear-gradient(160deg, var(--primary) 0%, #0f766e 100%)' }}>
				<div className="badge" style={{ width: 'fit-content', background: 'rgba(255,255,255,0.2)', color: '#fff' }}>💊 MedTrack</div>
				<div className="my-auto max-w-md">
					<h1 className="text-5xl font-extrabold text-white">Create your family health command center.</h1>
					<p className="mt-5 text-base text-blue-100">Set up profiles, add medicines, and build routines that keep everyone safe and on schedule.</p>
				</div>
				<div className="space-y-3 text-sm">
					<div className="flex items-center gap-2"><CheckCircle2 size={16} /> One account for your whole family</div>
					<div className="flex items-center gap-2"><CheckCircle2 size={16} /> Smart reminders and analytics</div>
					<div className="flex items-center gap-2"><CheckCircle2 size={16} /> Secure cloud history and access</div>
				</div>
			</section>

			<section className="flex items-center justify-center px-4 py-8 sm:px-6">
				<form onSubmit={handleSubmit(onSubmit)} className="card w-full max-w-[420px] space-y-4">
					<div className="text-center">
						<p className="badge badge-primary">Start Free</p>
						<h2 className="mt-3">Create your account</h2>
						<p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>Join MedTrack and keep your family on track.</p>
					</div>

					<div>
						<label className="mb-1 block text-sm font-medium">Full name</label>
						<input {...register('fullName')} className={`h-12 w-full px-3 ${errors.fullName ? 'border-red-500' : ''}`} />
						{errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
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

					<div>
						<label className="mb-1 block text-sm font-medium">Confirm password</label>
						<div className={`flex h-12 items-center rounded-[10px] border px-3 ${errors.confirmPassword ? 'border-red-500' : ''}`} style={{ borderColor: errors.confirmPassword ? '#ef4444' : 'var(--border)' }}>
							<input {...register('confirmPassword')} type={showConfirmPassword ? 'text' : 'password'} className="h-full w-full border-none p-0 shadow-none focus:shadow-none" />
							<button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="text-slate-500">
								{showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
							</button>
						</div>
						{errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
					</div>

					<button disabled={loading} className="btn-primary h-12 w-full disabled:opacity-60" type="submit">
						{loading ? 'Creating account...' : 'Create Account'}
					</button>

					<p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
						Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
					</p>
				</form>
			</section>
		</div>
	);
};

export default Register;
