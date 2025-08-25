import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const defaultAdmins = [
        'jdefosse@pcbs.fr',
        'jeromedefosse@me.com',
        'flascano@pcbs.fr',
        'ygautronneau@pcbs.fr',
        'mtardif@pcbs.fr',
        'cpajot@pcbs.fr'
    ];

    const initialUsers = defaultAdmins.reduce((acc, email) => {
        const name = email.split('@')[0];
        acc[email] = { name, email, password: 'AdminPCBS', profile: 'admin' };
        return acc;
    }, {});

    const [users, setUsers] = useState(initialUsers);
    const [currentUser, setCurrentUser] = useState(null);

    // Load persisted users and session
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
            try {
                const parsed = JSON.parse(storedUsers);
                setUsers((prev) => ({ ...prev, ...parsed }));
            } catch (_) {
                /* ignore parse errors */
            }
        }
        const storedCurrent = localStorage.getItem('currentUser');
        if (storedCurrent) {
            try {
                setCurrentUser(JSON.parse(storedCurrent));
            } catch (_) {
                /* ignore parse errors */
            }
        }
    }, []);

    // Persist user list
    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('users', JSON.stringify(users));
    }, [users]);

    // Persist current session
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    function registerUser({ name, email, password, profile }) {
        setUsers((prev) => ({
            ...prev,
            [email]: { name, email, password, profile }
        }));
    }

    function login(email, password) {
        const user = users[email];
        if (user && user.password === password) {
            setCurrentUser(user);
            return true;
        }
        return false;
    }

    function logout() {
        setCurrentUser(null);
    }

    return (
        <AuthContext.Provider value={{ users, currentUser, registerUser, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
