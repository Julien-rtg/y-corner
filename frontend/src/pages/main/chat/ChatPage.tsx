import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User, Clock } from 'lucide-react';
import Chat from '@/components/chat/Chat';
import { Button } from '@/components/ui/button';
import { getToken, getUser } from '@/utils/getToken';
import { api } from '@/lib/api';

interface Conversation {
    id: number;
    recipientId: number;
    recipientName: string;
    lastMessage: string;
    lastMessageDate: string;
    unreadCount: number;
}

function ChatPage() {
    const params = useParams();
    const navigate = useNavigate();
    const user = getUser();
    const [recipientId, setRecipientId] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        // Get recipient ID from URL params if available
        if (params.recipientId) {
            setRecipientId(parseInt(params.recipientId));
        }
        
        // Fetch all conversations for the current user
        const fetchConversations = async () => {
            if (!user || !user.id) return;
            
            try {
                setLoading(true);
                const data = await api(`/api/chat/conversations?userId=${user.id}`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${getToken()}` },
                }, import.meta.env.VITE_API_URL || '');
                
                setConversations(data as Conversation[]);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Une erreur est survenue');
                setLoading(false);
            }
        };
        
        fetchConversations();
    }, [params, user]);

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

    const selectConversation = (id: number) => {
        navigate(`/chat/${id}`);
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

    if (recipientId) {
        const conversation = conversations.find(c => c.recipientId === recipientId);
        const recipientName = conversation ? conversation.recipientName : `Utilisateur #${recipientId}`;
        
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <Button
                        variant="outline"
                        className="mb-6 hover:bg-muted transition-colors group"
                        onClick={() => navigate('/chat')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
                        <span className="font-medium">Retour aux conversations</span>
                    </Button>

                    <div className="bg-card shadow-xl rounded-xl overflow-hidden flex flex-col border">
                        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <MessageCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Conversation avec {recipientName}</h2>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 p-4 bg-card h-[500px]">
                            <Chat userId={user.id} recipientId={recipientId} />
                        </div>
                    </div>
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
                    <div className="space-y-4">
                        {conversations.map((conversation) => (
                            <div 
                                key={conversation.id}
                                className="bg-card shadow hover:shadow-md rounded-xl p-4 border transition-all cursor-pointer"
                                onClick={() => selectConversation(conversation.recipientId)}
                            >
                                <div className="flex items-start">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-4">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold truncate">{conversation.recipientName}</h3>
                                            <span className="text-xs text-muted-foreground flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {formatDate(conversation.lastMessageDate)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate mt-1">{conversation.lastMessage}</p>
                                    </div>
                                    {conversation.unreadCount > 0 && (
                                        <div className="ml-2 bg-primary text-primary-foreground rounded-full h-5 min-w-5 flex items-center justify-center text-xs font-medium px-1.5">
                                            {conversation.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatPage;