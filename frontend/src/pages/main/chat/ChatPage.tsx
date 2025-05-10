import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User, Clock } from 'lucide-react';
import Chat from '@/components/chat/Chat';
import { Button } from '@/components/ui/button';
import { getToken, getUser } from '@/utils/getToken';
import { api } from '@/lib/api';

interface Message {
    id: string;
    fromUserId: string;
    toUserId: string;
    message: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    recipientId: string;
    messages: Message[];
    lastMessageDate: string;
}

function ChatPage() {
    const navigate = useNavigate();
    const user = getUser();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchConversations = async () => {
            if (!user || !user.id) return;
            
            try {
                setLoading(true);
                const data = await api(`/api/chat/conversations?userId=${user.id}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${getToken()}` },
                }, import.meta.env.VITE_API_URL || '');

                const conversationsData = data as Conversation[];
                setConversations(conversationsData);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
                setLoading(false);
            }
        };
        
        fetchConversations();
    }, []);

    const handleGoBack = () => {
        navigate(-1);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        }).format(date);
    };

    const selectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);
    };

    if (!user || !user.id) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
                    <p>Veuillez vous connecter pour accéder à la messagerie.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-destructive text-center">
                    <h2 className="text-2xl font-bold mb-2">Erreur</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Mes conversations</h1>
                    <Button
                        variant="outline"
                        className="hover:bg-muted transition-colors group"
                        onClick={handleGoBack}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
                        <span className="font-medium">Retour</span>
                    </Button>
                </div>

                {conversations.length === 0 ? (
                    <div className="bg-card shadow rounded-xl p-8 text-center">
                        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <h2 className="text-xl font-semibold mb-2">Aucune conversation</h2>
                        <p className="text-muted-foreground">Vous n'avez pas encore de conversations. Contactez un vendeur pour démarrer une discussion.</p>
                    </div>
                ) : (
                    <div className="flex gap-6">
                        {/* Left side - Conversations list */}
                        <div className="w-1/3 space-y-4">
                            {conversations.map((conversation) => (
                                <div
                                    key={conversation.id}
                                    className={`bg-card shadow rounded-xl p-4 cursor-pointer transition-colors ${selectedConversation?.id === conversation.id ? 'bg-accent' : 'hover:bg-accent/50'}`}
                                    onClick={() => selectConversation(conversation)}
                                >
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold truncate">Utilisateur {conversation.recipientId}</h3>
                                                <span className="text-xs text-muted-foreground flex items-center">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatDate(conversation.lastMessageDate)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate mt-1">{conversation.messages[conversation.messages.length-1].message}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Right side - Selected conversation */}
                        <div className="w-2/3">
                            {selectedConversation ? (
                                <div className="bg-card shadow rounded-xl p-6">
                                    <div className="mb-4 pb-3 border-b">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                                <User className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <h2 className="font-semibold">Utilisateur {selectedConversation.recipientId}</h2>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="h-[500px]">
                                        {user && user.id && (
                                            <Chat 
                                                userId={user.id} 
                                                recipientId={parseInt(selectedConversation.recipientId)} 
                                            />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-card shadow rounded-xl p-8 text-center h-[500px] flex flex-col items-center justify-center">
                                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <h2 className="text-xl font-semibold mb-2">Sélectionnez une conversation</h2>
                                    <p className="text-muted-foreground">Cliquez sur une conversation à gauche pour afficher les messages.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;