import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { AuthentificationService } from '@/services/authentification/authentification';

const loginSchema = z.object({
    email: z.string().email('Veuillez entrer un email valide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
    const auth = new AuthentificationService();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            await auth.login(data.email, data.password);
            window.location.href = '/';
            toast.success('Connexion réussie !');
        } catch (error) {
            toast.error('Échec de connexion. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Bon retour</h1>
                    <p className="text-muted-foreground mt-2">Entrez vos identifiants pour accéder à votre compte</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="nom@exemple.com"
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password')}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="flex items-center justify-end mt-2">
                        <Link
                            to="/reset-password"
                            className="text-sm text-primary hover:underline font-medium"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    <Button type="submit" variant="default" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Se connecter
                    </Button>
                </form>

                <p className="text-center text-sm text-muted-foreground">
                    Vous n'avez pas de compte ?{' '}
                    <Link to="/register" className="text-primary hover:underline">
                        S'inscrire
                    </Link>
                </p>
            </div>
        </div>
    );
}