import { createContext, useContext, useState } from 'react';

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
