import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login, users } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    function handleSubmit(e) {
        e.preventDefault();
        if (login(form.email, form.password)) {
            const profile = users[form.email].profile;
            router.push(`/${profile}`);
        } else {
            setError('Identifiants invalides');
        }
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Connexion</h1>
            {error && <p className="text-red-500 mb-2">{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    className="border p-1 mr-2"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                />
                <input
                    className="border p-1 mr-2"
                    type="password"
                    placeholder="Mot de passe"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                />
                <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                    Se connecter
                </button>
            </form>
        </div>
    );
}
