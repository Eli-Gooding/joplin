import * as React from 'react';
import { StyledMessagesContainer, StyledMessage, StyledButton } from './styles';
import { ChatMessagesProps } from './types';
import { themeStyle } from '@joplin/lib/theme';


const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, themeId, onAcceptEdit, onRejectEdit }) => {
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
                            {message.metadata.error}
                        </div>
                    )}
                    {message.metadata?.suggestedEdit && (
                        <div style={{
                            marginTop: '12px',
                            padding: '8px',
                            backgroundColor: theme.backgroundColor3,
                            borderRadius: '4px',
                        }}>
                            <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                                Suggested Changes:
                            </div>
                            <pre style={{
                                margin: '0',
                                padding: '8px',
                                backgroundColor: theme.backgroundColor2,
                                borderRadius: '4px',
                                overflowX: 'auto',
                                fontSize: '0.9em',
                            }}>
                                {message.content.split('\n').map((line, i) => {
                                    // Skip the ```diff line
                                    if (line === '```diff') return null;
                                    
                                    const isAddition = line.startsWith('+');
                                    const isDeletion = line.startsWith('-');
                                    
                                    // Skip if it's just the closing ```
                                    if (line === '```') return null;
                                    
                                    return (
                                        <div key={i} style={{
                                            backgroundColor: isAddition ? `${theme.colorCorrect}20` :
                                                isDeletion ? `${theme.colorError}20` : 'transparent',
                                            color: isAddition ? theme.colorCorrect :
                                                isDeletion ? theme.colorError : theme.color,
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre',
                                            padding: '2px 4px',
                                        }}>
                                            {line}
                                        </div>
                                    );
                                }).filter(Boolean)}
                            </pre>
                            {message.metadata.editStatus === 'pending' && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    marginTop: '8px',
                                }}>
                                    <StyledButton
                                        theme={theme}
                                        onClick={() => onAcceptEdit(message.id)}
                                        style={{
                                            backgroundColor: theme.backgroundColor4,
                                            color: theme.color4,
                                        }}
                                    >
                                        Accept Changes
                                    </StyledButton>
                                    <StyledButton
                                        theme={theme}
                                        onClick={() => onRejectEdit(message.id)}
                                        style={{
                                            backgroundColor: `${theme.colorError}20`,
                                            color: theme.colorError,
                                        }}
                                    >
                                        Reject Changes
                                    </StyledButton>
                                </div>
                            )}
                            {message.metadata.editStatus === 'accepted' && (
                                <div style={{
                                    marginTop: '8px',
                                    color: theme.color4,
                                }}>
                                    ✓ Changes accepted
                                </div>
                            )}
                            {message.metadata.editStatus === 'rejected' && (
                                <div style={{
                                    marginTop: '8px',
                                    color: theme.colorError,
                                }}>
                                    ✕ Changes rejected
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </StyledMessagesContainer>
    );
};

export default ChatMessages;

