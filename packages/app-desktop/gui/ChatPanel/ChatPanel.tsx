import * as React from 'react';
import { connect } from 'react-redux';
import { StyledRoot } from './styles';
import { ChatPanelProps } from './types';
import { themeStyle } from '@joplin/lib/theme';
import { AppState } from '../../app.reducer';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { addMessage, setLoading } from './chat.reducer';

const ChatPanel: React.FC<ChatPanelProps> = ({
    isOpen,
    messages,
    isLoading,
    themeId,
    dispatch,
}) => {
    const theme = themeStyle(themeId);

    const handleSendMessage = async (content: string) => {
        const messageId = Date.now().toString();
        
        // Add user message
        dispatch(addMessage({
            id: messageId,
            content,
            sender: 'user',
            timestamp: Date.now(),
        }));

        // Set loading state
        dispatch(setLoading(true));

        try {
            // TODO: Implement actual agent communication here
            // For now, just echo the message back
            setTimeout(() => {
                dispatch(addMessage({
                    id: Date.now().toString(),
                    content: `Echo: ${content}`,
                    sender: 'agent',
                    timestamp: Date.now(),
                }));
                dispatch(setLoading(false));
            }, 1000);
        } catch (error) {
            console.error('Error sending message:', error);
            dispatch(setLoading(false));
        }
    };

    if (!isOpen) return null;

    return (
        <StyledRoot theme={theme}>
            <ChatMessages
                messages={messages}
                themeId={themeId}
            />
            <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                themeId={themeId}
            />
        </StyledRoot>
    );
};

const mapStateToProps = (state: AppState) => ({
    themeId: state.settings.theme,
    // Add other necessary state mappings here
    // currentNoteContent: state.notes.selectedNoteContent, // TODO: Add this mapping
});

export default connect(mapStateToProps)(ChatPanel);
