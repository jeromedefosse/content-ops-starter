import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';

export default function PatientPage() {
    const { currentUser } = useAuth();

    if (!currentUser || currentUser.profile !== 'patient') {
        return (
            <div className="p-6">
                <p>Accès non autorisé.</p>
                <Link href="/login" className="text-blue-500 underline">
                    Se connecter
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Espace Patient</h1>
            <p>Bienvenue {currentUser.name}</p>
        </div>
    );
}
