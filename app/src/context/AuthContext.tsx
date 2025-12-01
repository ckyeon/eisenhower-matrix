import React, { createContext, useContext, useState, useEffect } from 'react';


interface User {
    id: string;
    nickname: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, refreshToken: string, user: User) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = (newToken: string, newRefreshToken: string, newUser: User) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            try {
                // Use fetch or axios directly to avoid circular dependency if api.ts imports AuthContext (it doesn't, but good practice)
                // However, since api.ts doesn't import AuthContext, we can't use api instance easily if we want to avoid circular deps if we did.
                // But here we can just use fetch for simplicity or import api.
                // Let's use fetch to be safe and simple for this one-off call.
                await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch (error) {
                console.error('Logout failed:', error);
            }
        }

        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
