import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { signIn, signInWithGoogle } from '../services/authService';

const schema = z.object({
	email: z.string().email('Enter a valid email'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
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
		<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
			<form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
				<h1 className="text-center text-2xl font-semibold">Sign in to FamMed</h1>
				<div>
					<label className="mb-1 block text-sm">Email</label>
					<input {...register('email')} type="email" className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" />
					{errors.email && <p className="mt-1 text-xs text-danger-600">{errors.email.message}</p>}
				</div>
				<div>
					<label className="mb-1 block text-sm">Password</label>
					<input {...register('password')} type="password" className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" />
					{errors.password && <p className="mt-1 text-xs text-danger-600">{errors.password.message}</p>}
				</div>
				<button disabled={loading} className="w-full rounded bg-primary-600 px-4 py-2 text-white disabled:opacity-60" type="submit">
					{loading ? 'Signing in...' : 'Sign in'}
				</button>
				<button type="button" className="w-full rounded border px-4 py-2" onClick={signInWithGoogle}>
					Continue with Google
				</button>
				<div className="flex justify-between text-sm">
					<Link to="/reset-password" className="text-primary-600">Forgot password?</Link>
					<Link to="/register" className="text-primary-600">Create account</Link>
				</div>
			</form>
		</div>
	);
};

export default Login;
