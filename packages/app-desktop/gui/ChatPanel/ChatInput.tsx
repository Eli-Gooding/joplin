import * as React from 'react';
import { StyledInputContainer, StyledInput, StyledSendButton } from './styles';
import { ChatInputProps } from './types';
import { themeStyle } from '@joplin/lib/theme';
import { _ } from '@joplin/lib/locale';

/**
 * ChatInput Component
 * Renders a textarea with a send button for chat messages
 * 
 * @param onSendMessage - Callback function to handle sending messages
 * @param isLoading - Whether the chat is in a loading state
 * @param themeId - Theme ID for styling
 */
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, themeId }) => {
    // State to hold the current message text
    const [message, setMessage] = React.useState('');
    
    // Get theme styles
    const theme = themeStyle(themeId);

    /**
     * Handles form submission
     * Prevents default form behavior and sends message if valid
     */
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isLoading) {
            onSendMessage(message.trim());
            setMessage(''); // Clear input after sending
        }
    };

    /**
     * Handles keyboard events
     * Sends message on Enter (without Shift)
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <StyledInputContainer theme={theme}>
            <form onSubmit={handleSubmit}>
                <StyledInput
                    theme={theme}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={_('Type your message...')}
                    disabled={isLoading}
                    rows={1}
                    aria-label={_('Chat message input')}
                />
                <StyledSendButton
                    theme={theme}
                    type="submit"
                    disabled={!message.trim() || isLoading}
                    aria-label={_('Send message')}
                >
                    {isLoading ? _('Thinking...') : _('Send')}
                </StyledSendButton>
            </form>
        </StyledInputContainer>
    );
};

export default ChatInput;
