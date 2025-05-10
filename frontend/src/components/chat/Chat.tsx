import { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from "react-use-websocket";
import chatService, { ChatMessage } from '@/services/chat';

export interface ChatProps {
    userId: number;
    recipientId: number;
}

function Chat({ userId, recipientId }: ChatProps) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<(ChatMessage | any)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const WS_URL = import.meta.env.VITE_WEBSOCKET_URL.replace('{id}', userId.toString());
    
    const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
        WS_URL,
        {
            share: false,
            shouldReconnect: () => true,
            onOpen: () => console.log('WebSocket connection established'),
            onClose: (event) => console.log('WebSocket connection closed', event),
            onError: (error) => console.error('WebSocket error:', error),
        },
    )

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const fetchedMessages = await chatService.getMessagesBetweenUsers(userId, recipientId);
                setMessages(fetchedMessages);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching messages:', err);
                setError('Impossible de charger les messages précédents');
                setLoading(false);
            }
        };
        
        fetchMessages();
    }, [userId, recipientId]);

    useEffect(() => {
        if (lastJsonMessage) {
            setMessages(prev => [...prev, lastJsonMessage]);
        }
    }, [lastJsonMessage])

    const handleSend = () => {
        if (message.trim() && readyState === ReadyState.OPEN) {
            sendJsonMessage({
                from: userId,
                to: recipientId,
                message: message
            });
            
            setMessages(prev => [...prev, {
                from: userId,
                message: message,
                sent: true
            }]);
            
            setMessage('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 mb-3 p-3 border rounded bg-white overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <p className="text-destructive text-center">{error}</p>
                ) : messages.length === 0 ? (
                    <p className="text-gray-400 text-center">Aucun message</p>
                ) : (
                    messages.map((msg, index) => {
                        let isFromCurrentUser = false;
                        let messageText = '';
                        let sender = '';
                        
                        if (msg.fromUserId !== undefined) {
                            isFromCurrentUser = parseInt(msg.fromUserId) === userId;
                            messageText = msg.message;
                            sender = isFromCurrentUser ? 'Vous' : `Utilisateur ${msg.fromUserId}`;
                        } else {
                            isFromCurrentUser = msg.from === userId || msg.sent === true;
                            messageText = msg.message;
                            sender = isFromCurrentUser ? 'Vous' : `Utilisateur ${msg.from}`;
                        }
                        
                        return (
                            <div key={index} className={`mb-2 p-2 rounded ${isFromCurrentUser ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-100 mr-auto max-w-[80%]'}`}>
                                <p className="text-xs text-gray-500">{sender}</p>
                                <p className="text-sm">{messageText}</p>
                                {msg.createdAt && (
                                    <p className="text-xs text-gray-400 text-right mt-1">{new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
            
            <div className="flex space-x-2">
                <input 
                    className="flex-1 p-2 border rounded bg-white" 
                    type="text" 
                    value={message} 
                    onChange={(e) => setMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Écrivez un message..."
                    disabled={readyState !== ReadyState.OPEN}
                />
                <button 
                    className={`px-3 py-2 rounded transition-colors ${readyState === ReadyState.OPEN ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`} 
                    onClick={handleSend}
                    disabled={readyState !== ReadyState.OPEN}
                >
                    Envoyer
                </button>
            </div>
        </div>
    );
}

export default Chat;