import { useState, useEffect } from 'react';
import useWebSocket, { ReadyState } from "react-use-websocket"

export interface ChatProps {
    userId: number;
    recipientId: number;
}

function Chat({ userId, recipientId }: ChatProps) {
    const [message, setMessage] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
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

    // Run when the connection state (readyState) changes
    useEffect(() => {
        const connectionStatusMap = {
            [ReadyState.CONNECTING]: 'Connecting',
            [ReadyState.OPEN]: 'Open',
            [ReadyState.CLOSING]: 'Closing',
            [ReadyState.CLOSED]: 'Closed',
            [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
        };
        
        setConnectionStatus(connectionStatusMap[readyState]);
        console.log("Connection state changed to:", connectionStatusMap[readyState]);
    }, [readyState])

    // Run when a new WebSocket message is received (lastJsonMessage)
    useEffect(() => {
        if (lastJsonMessage) {
            console.log('Received message:', lastJsonMessage);
            setMessages(prev => [...prev, lastJsonMessage]);
        }
    }, [lastJsonMessage])

    const handleSend = () => {
        if (message.trim() && readyState === ReadyState.OPEN) {
            console.log('Sending message to user:', recipientId);
            // Format the message according to your backend's expected format
            sendJsonMessage({
                from: userId,
                to: recipientId,
                message: message
            });
            
            // Add the sent message to our local messages list
            setMessages(prev => [...prev, {
                from: userId,
                message: message,
                sent: true
            }]);
            
            setMessage(''); // Clear input after sending
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="mb-2">
                <p className="text-xs font-medium">Status: <span className={`font-bold ${connectionStatus === 'Open' ? 'text-green-500' : 'text-red-500'}`}>{connectionStatus}</span></p>
            </div>
            <div className="flex-1 mb-3 p-3 border rounded bg-white overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-gray-400 text-center">Aucun message</p>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`mb-2 p-2 rounded ${msg.sent || msg.from === userId ? 'bg-blue-100 ml-auto max-w-[80%]' : 'bg-gray-100 mr-auto max-w-[80%]'}`}>
                            <p className="text-xs text-gray-500">{msg.from === userId ? 'Vous' : `Utilisateur ${msg.from}`}</p>
                            <p className="text-sm">{msg.message}</p>
                        </div>
                    ))
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