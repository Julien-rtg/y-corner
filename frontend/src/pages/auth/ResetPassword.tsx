import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const resetSchema = z.object({
  email: z.string().email('Veuillez entrer un email valide'),
});

type ResetForm = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const auth = new AuthentificationService();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await auth.requestPasswordReset(data.email);
      toast.success('Si un compte existe avec cet email, vous recevrez des instructions de réinitialisation du mot de passe.');
      setEmailSent(true);
      // Afficher un message différent si l'email a été envoyé
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (error) {
      toast.error('Échec de l\'envoi des instructions de réinitialisation. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {emailSent ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold">Email envoyé</h1>
            <p className="text-muted-foreground mt-2">Vérifiez votre boîte de réception pour les instructions de réinitialisation.</p>
            <p className="text-muted-foreground mt-2">Vous serez redirigé vers la page de connexion dans quelques secondes...</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-3xl font-bold">Réinitialiser votre mot de passe</h1>
              <p className="text-muted-foreground mt-2">Entrez votre email pour recevoir les instructions de réinitialisation</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nom@exemple.com"
                  className="bg-white"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer les instructions
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link to="/login" className="text-primary hover:underline">
                Se connecter
              </Link>
            </p>
          </>
        )}      
      </div>
    </div>
  );
}