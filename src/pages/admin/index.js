import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

const rolePermissions = {
    admin: ['patient', 'surgeon', 'admin'],
    surgeon: ['patient'],
    patient: []
};

export default function AdminPage() {
    const { currentUser, registerUser, users } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', profile: 'patient' });

    if (!currentUser || currentUser.profile !== 'admin') {
        return (
            <div className="p-6">
                <p>Accès non autorisé.</p>
                <Link href="/login" className="text-blue-500 underline">
                    Se connecter
                </Link>
            </div>
        );
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!rolePermissions[currentUser.profile].includes(form.profile)) {
            return;
        }
        registerUser(form);
        setForm({ name: '', email: '', password: '', profile: 'patient' });
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Interface Administrateur</h1>
            <form onSubmit={handleSubmit} className="mb-6">
                <input
                    className="border p-1 mr-2"
                    type="text"
                    placeholder="Nom"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                />
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
                <select
                    className="border p-1 mr-2"
                    value={form.profile}
                    onChange={(e) => setForm({ ...form, profile: e.target.value })}
                >
                    <option value="patient">Patient</option>
                    <option value="surgeon">Chirurgien</option>
                    <option value="admin">Administrateur</option>
                </select>
                <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
                    Créer
                </button>
            </form>
            <div className="grid grid-cols-3 gap-4">
                {['patient', 'surgeon', 'admin'].map((profile) => (
                    <div key={profile}>
                        <h2 className="font-semibold capitalize mb-2">{profile}s</h2>
                        <ul className="list-disc list-inside">
                            {Object.values(users)
                                .filter((u) => u.profile === profile)
                                .map((user, idx) => (
                                    <li key={idx}>{user.name}</li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}
