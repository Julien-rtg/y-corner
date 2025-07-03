import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, User } from 'lucide-react';
import Chat from '@/components/chat/Chat';
import { Button } from '@/components/ui/button';
import { getToken, getUser } from '@/utils/getToken';
import { api } from '@/lib/api';
import chatService from '@/services/chat/chat';
import { UnreadMessagesContext } from '@/App';

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
    unreadCount?: number;
}

function ChatPage({ sendJsonMessage, lastJsonMessage, readyState }: any) {
    const navigate = useNavigate();
    const user = getUser();
    const { refreshUnreadCount } = useContext(UnreadMessagesContext);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConversationsAndUnreadCounts = async () => {
        if (!user || !user.id) return;

        try {
            setLoading(true);
            const data = await api(`/api/chat/conversations?userId=${user.id}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${getToken()}` },
            }, import.meta.env.VITE_API_URL || '');

            const conversationsData = data as Conversation[];

            const unreadResponse = await chatService.getUnreadMessageCount(user.id);

            const conversationsWithUnread = conversationsData.map(conv => ({
                ...conv,
                unreadCount: unreadResponse.unreadCounts[conv.recipientId] || 0
            }));

            setConversations(conversationsWithUnread);
            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Une erreur est survenue');
            setLoading(false);
        }
    };

    const refreshUnreadCountsOnly = async () => {
        if (!user || !user.id) return;

        try {
            const unreadResponse = await chatService.getUnreadMessageCount(user.id);

            setConversations(prevConversations =>
                prevConversations.map(conv => ({
                    ...conv,
                    unreadCount: unreadResponse.unreadCounts[conv.recipientId] || 0
                }))
            );
        } catch (err) {
            console.error('Error refreshing unread counts:', err);
        }
    };

    useEffect(() => {
        fetchConversationsAndUnreadCounts();
    }, []);

    useEffect(() => {
        if (lastJsonMessage && typeof lastJsonMessage === 'object' && 'type' in lastJsonMessage) {
            if (lastJsonMessage.type === 'new_message') {
                refreshUnreadCountsOnly();
            }
        }
    }, [lastJsonMessage]);

    const handleGoBack = () => {
        navigate(-1);
    };

    const selectConversation = (conversation: Conversation) => {
        setSelectedConversation(conversation);

        if (user && user.id && conversation.recipientId) {
            chatService.markMessagesAsSeen(parseInt(conversation.recipientId), user.id);

            setConversations(prevConversations => {
                const updatedConversations = prevConversations.map(conv =>
                    conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv
                );
                if (conversation.unreadCount && conversation.unreadCount > 0) {
                    refreshUnreadCount();
                }

                return updatedConversations;
            });
        }
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

                {loading && (
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                )}

                {!loading && (
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
                                                    <div className="flex items-center">
                                                        <h3 className="font-semibold truncate">Utilisateur {conversation.recipientId}</h3>
                                                        {(conversation.unreadCount ?? 0) > 0 && (
                                                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full ml-2">
                                                                {conversation.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
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
                                                    sendJsonMessage={sendJsonMessage}
                                                    lastJsonMessage={lastJsonMessage}
                                                    readyState={readyState}
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
            )}
        </div>
    );
}

export default ChatPage;