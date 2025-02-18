import * as React from 'react';
import { StyledMessagesContainer, StyledMessage } from './styles';
import { ChatMessagesProps } from './types';
import { themeStyle } from '@joplin/lib/theme';

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, themeId }) => {
    const theme = themeStyle(themeId);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <StyledMessagesContainer theme={theme}>
            {messages.map((message) => (
                <div key={message.id}>
                    <StyledMessage
                        theme={theme}
                        isAgent={message.sender === 'agent'}
                        sender={message.sender}
                    >
                        {message.content}
                    </StyledMessage>
                    {message.metadata?.contexts && (
                        <div style={{ marginTop: '8px', fontSize: '0.9em', color: theme.colorFaded }}>
                            <div>Extracted Context:</div>
                            {message.metadata.contexts.map((context, index) => (
                                <div key={index} style={{ 
                                    marginTop: '4px', 
                                    padding: '4px', 
                                    backgroundColor: theme.backgroundColor3,
                                    borderRadius: '4px',
                                    fontSize: '0.9em'
                                }}>
                                    {context.content.substring(0, 100)}...
                                </div>
                            ))}
                        </div>
                    )}
                    {message.metadata?.error && (
                        <div style={{ 
                            marginTop: '8px', 
                            color: theme.colorError,
                            padding: '4px',
                            backgroundColor: `${theme.colorError}20`,
                            borderRadius: '4px'
                        }}>
                            Error: {message.metadata.error}
                        </div>
                    )}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </StyledMessagesContainer>
    );
};

export default ChatMessages;
