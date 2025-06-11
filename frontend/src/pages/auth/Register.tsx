import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthentificationService } from '@/services/authentification';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const registerSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  birthDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Format de date invalide',
  }),
  email: z.string().email('Veuillez entrer un email valide'),
  address: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  postalCode: z.string().regex(/^\d{5}$/, 'Le code postal doit contenir 5 chiffres'),
  city: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const authService = new AuthentificationService();
  const { register, handleSubmit, formState: { errors }, control } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const registerData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        birthDate: data.birthDate,
        address: data.address,
        city: data.city,
        country: 'France',
        postalCode: data.postalCode
      };
      
      const response = await authService.register(registerData);
      
      if (response.status === 201) {
        toast.success('Inscription réussie ! Veuillez vous connecter.');
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      if (error.response?.data?.message) {
        toast.error(`Échec de l'inscription: ${error.response.data.message}`);
      } else {
        toast.error('Échec de l\'inscription. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Créer un compte</h1>
          <p className="text-muted-foreground mt-2">Entrez vos informations pour commencer</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                placeholder="Dupont"
                className="bg-white"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                placeholder="Jean"
                className="bg-white"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="birthDate">Date de naissance</Label>
              <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="birthDate"
                        className={`w-full justify-start text-left font-normal bg-white ${!field.value && "text-muted-foreground"}`}
                      >
                        {field.value ? (
                          format(new Date(field.value), 'dd MMMM yyyy', { locale: fr })
                        ) : (
                          "Sélectionner une date"
                        )}
                        <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const adjustedDate = new Date(date);
                            adjustedDate.setDate(adjustedDate.getDate() + 1);
                            field.onChange(adjustedDate.toISOString().split('T')[0]);
                          } else {
                            field.onChange('');
                          }
                        }}
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.birthDate && (
                <p className="text-xs text-destructive">{errors.birthDate.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                className="bg-white"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              placeholder="123 rue de Paris"
              className="bg-white"
              {...register('address')}
            />
            {errors.address && (
              <p className="text-xs text-destructive">{errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="postalCode">Code postal</Label>
              <Input
                id="postalCode"
                placeholder="75000"
                className="bg-white"
                {...register('postalCode')}
              />
              {errors.postalCode && (
                <p className="text-xs text-destructive">{errors.postalCode.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                placeholder="Paris"
                className="bg-white"
                {...register('city')}
              />
              {errors.city && (
                <p className="text-xs text-destructive">{errors.city.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                className="bg-white"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                className="bg-white"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Créer un compte
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}