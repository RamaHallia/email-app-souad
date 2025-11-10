'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthFormProps {
    onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
    const router = useRouter();
    const { signIn, signUp } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setLoading(true);

        console.log('🚀 Début de la soumission du formulaire');
        console.log('📧 Email:', email);
        console.log('🔐 Mode:', isLogin ? 'Connexion' : 'Inscription');

        try {
            if (isLogin) {
                console.log('🔄 Tentative de connexion...');
                const { error } = await signIn(email, password);
                
                if (error) {
                    console.error('❌ Erreur de connexion:', error.message);
                    setError(error.message);
                    setLoading(false);
                } else {
                    console.log('✅ Connexion réussie !');
                    console.log('👤 Utilisateur connecté');
                    console.log('⏳ Attente de la mise à jour du contexte...');
                    
                    // Attendre 2 secondes pour que le contexte soit bien mis à jour
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    console.log('🚀 Redirection vers le dashboard');
                    router.push('/dashboard');
                    onSuccess?.();
                }
            } else {
                if (!fullName.trim()) {
                    console.warn('⚠️ Nom complet manquant');
                    setError('Veuillez entrer votre nom complet');
                    setLoading(false);
                    return;
                }
                
                console.log('🔄 Tentative d\'inscription...');
                console.log('👤 Nom complet:', fullName);
                
                const { error } = await signUp(email, password, fullName);
                
                if (error) {
                    console.error('❌ Erreur d\'inscription:', error.message);
                    setError(error.message);
                } else {
                    console.log('✅ Inscription réussie !');
                    console.log('📧 Email de confirmation envoyé à:', email);
                    setSuccessMessage('Un email de confirmation a été envoyé. Vérifiez votre boîte mail.');
                }
                setLoading(false);
            }
        } catch (err) {
            console.error('💥 Erreur inattendue:', err);
            setError('Une erreur est survenue. Veuillez réessayer.');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">
                {isLogin ? 'Connexion' : 'Inscription'}
            </h2>

            {/* Messages */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {successMessage && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {successMessage}
                </div>
            )}

            {/* Loader pendant la connexion */}
            {loading && isLogin && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <div className="text-sm text-blue-800">
                            <div className="font-semibold">Connexion en cours...</div>
                            <div className="text-xs">Veuillez patienter quelques instants</div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nom complet (uniquement pour inscription) */}
                {!isLogin && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Nom complet</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Jean Dupont"
                                required={!isLogin}
                                disabled={loading}
                            />
                        </div>
                    </div>
                )}

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="exemple@email.com"
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Mot de passe */}
                <div>
                    <label className="block text-sm font-medium mb-1">Mot de passe</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                            required
                            minLength={6}
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Bouton submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>{isLogin ? 'Connexion...' : 'Inscription...'}</span>
                        </>
                    ) : (
                        isLogin ? 'Se connecter' : "S'inscrire"
                    )}
                </button>
            </form>

            {/* Toggle entre connexion et inscription */}
            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={() => {
                        console.log('🔄 Changement de mode:', !isLogin ? 'Connexion' : 'Inscription');
                        setIsLogin(!isLogin);
                        setError(null);
                        setSuccessMessage(null);
                        setShowPassword(false);
                    }}
                    className="text-blue-600 hover:underline text-sm"
                    disabled={loading}
                >
                    {isLogin ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
                </button>
            </div>
        </div>
    );
}