import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, ArrowRight, Loader2 } from 'lucide-react';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [nickname, setNickname] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const response = await api.post('/auth/login', { nickname, password });
                login(response.data.token, response.data.refreshToken, response.data.user);
                navigate('/');
            } else {
                if (password !== confirmPassword) {
                    setError('Passwords do not match.');
                    setIsLoading(false);
                    return;
                }
                await api.post('/auth/signup', { nickname, password });
                const response = await api.post('/auth/login', { nickname, password });
                login(response.data.token, response.data.refreshToken, response.data.user);
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-slate-950">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-md p-8 glass rounded-2xl shadow-2xl animate-fade-in">
                <div className="flex flex-col items-center mb-8">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg mb-4">
                        <LayoutGrid size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                        Eisenhower Matrix
                    </h1>
                    <p className="text-slate-400 mt-2">
                        {isLogin ? 'Welcome back, productive mind.' : 'Start organizing your life today.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nickname</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-white placeholder-slate-600"
                            placeholder="Enter your nickname"
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-white placeholder-slate-600"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="space-y-1 animate-fade-in">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-white placeholder-slate-600"
                                placeholder="Confirm your password"
                                required
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-500 hover:to-purple-500 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); setConfirmPassword(''); }}
                        className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        {isLogin ? (
                            <>Don't have an account? <span className="text-blue-400 hover:underline">Sign Up</span></>
                        ) : (
                            <>Already have an account? <span className="text-blue-400 hover:underline">Sign In</span></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
