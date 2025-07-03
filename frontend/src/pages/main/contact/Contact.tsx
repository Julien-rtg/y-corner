import { useState } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendContactMessage } from '@/services/contact/contact';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Paperclip, X } from 'lucide-react';

const contactFormSchema = z.object({
  subject: z.string().min(3, { message: "L'objet doit contenir au moins 3 caractères" }),
  message: z.string().min(10, { message: "Le message doit contenir au moins 10 caractères" }),
  email: z.string().email({ message: "L'adresse email n'est pas valide" }).optional(),
  name: z.string().optional(),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

function Contact() {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      subject: "",
      message: "",
      email: "",
      name: "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      await sendContactMessage(data, files);
      
      form.reset();
      setFiles([]);
      toast.success('Votre message a été envoyé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast.error('Une erreur est survenue lors de l\'envoi du message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[800px] mx-auto">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl font-bold">Contact</h1>
              <p className="text-muted-foreground">
                Vous avez une question ou une suggestion ? N'hésitez pas à nous contacter.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Formulaire de contact</CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous pour nous envoyer un message.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objet</FormLabel>
                          <FormControl>
                            <Input placeholder="Objet de votre message" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <Input placeholder="Votre nom" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="votre.email@exemple.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Votre message" 
                              className="min-h-[200px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="file-upload">Pièces jointes</Label>
                        <div className="mt-2">
                          <div className="flex items-center justify-center w-full">
                            <label
                              htmlFor="file-upload"
                              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Paperclip className="w-8 h-8 mb-2 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground">
                                  <span className="font-semibold">Cliquez pour ajouter</span> ou glissez-déposez
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PNG, JPG, PDF (MAX. 10 Mo)
                                </p>
                              </div>
                              <Input
                                id="file-upload"
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {files.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Fichiers sélectionnés</h4>
                          <ul className="space-y-2">
                            {files.map((file, index) => (
                              <li key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                                <div className="flex items-center space-x-2 truncate">
                                  <Paperclip className="h-4 w-4" />
                                  <span className="text-sm truncate">{file.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {(file.size / 1024 / 1024).toFixed(2)} Mo
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <CardFooter className="px-0 pt-6">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autres moyens de nous contacter</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Email</h3>
                    <p className="text-muted-foreground">contact@y-corner.fr</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Téléphone</h3>
                    <p className="text-muted-foreground">+33 1 23 45 67 89</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Adresse</h3>
                    <p className="text-muted-foreground">123 Rue du Commerce<br />75015 Paris<br />France</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Horaires</h3>
                    <p className="text-muted-foreground">Du lundi au vendredi<br />9h00 - 18h00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Contact;