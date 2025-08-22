import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [users, setUsers] = useState({
        'admin@example.com': {
            name: 'Admin',
            email: 'admin@example.com',
            password: 'admin',
            profile: 'admin'
        }
    });
    const [currentUser, setCurrentUser] = useState(null);

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
