import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
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
		<div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
			<form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card dark:border-slate-700 dark:bg-slate-800">
				<h1 className="text-center text-2xl font-semibold">Create your FamMed account</h1>
				<input {...register('fullName')} placeholder="Full name" className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" />
				{errors.fullName && <p className="text-xs text-danger-600">{errors.fullName.message}</p>}
				<input {...register('email')} placeholder="Email" type="email" className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" />
				{errors.email && <p className="text-xs text-danger-600">{errors.email.message}</p>}
				<input {...register('password')} placeholder="Password" type="password" className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" />
				{errors.password && <p className="text-xs text-danger-600">{errors.password.message}</p>}
				<input {...register('confirmPassword')} placeholder="Confirm password" type="password" className="w-full rounded border p-2 dark:border-slate-600 dark:bg-slate-900" />
				{errors.confirmPassword && <p className="text-xs text-danger-600">{errors.confirmPassword.message}</p>}
				<button disabled={loading} className="w-full rounded bg-primary-600 px-4 py-2 text-white" type="submit">
					{loading ? 'Creating account...' : 'Create account'}
				</button>
				<p className="text-center text-sm">
					Already have an account? <Link to="/login" className="text-primary-600">Sign in</Link>
				</p>
			</form>
		</div>
	);
};

export default Register;
