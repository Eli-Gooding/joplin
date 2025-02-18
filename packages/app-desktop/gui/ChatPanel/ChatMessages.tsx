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
                <StyledMessage
                    key={message.id}
                    theme={theme}
                    isAgent={message.sender === 'agent'}
                >
                    {message.content}
                </StyledMessage>
            ))}
            <div ref={messagesEndRef} />
        </StyledMessagesContainer>
    );
};

export default ChatMessages;
