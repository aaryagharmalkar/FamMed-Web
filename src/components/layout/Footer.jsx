const Footer = () => (
	<footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
		FamMed v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
	</footer>
);

export default Footer;
