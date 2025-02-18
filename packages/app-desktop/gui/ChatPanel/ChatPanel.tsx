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
        const langchainService = new LangChainService();
        
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
            // Process message with LangChain service
            const { response, contexts } = await langchainService.processMessage(content, currentNoteContent || '');

            // Add agent response
            dispatch(addMessage({
                id: Date.now().toString(),
                content: response,
                sender: 'agent',
                timestamp: Date.now(),
                metadata: { contexts },
            }));
        } catch (error) {
            console.error('Error processing message:', error);
            // Add error message
            dispatch(addMessage({
                id: Date.now().toString(),
                content: 'Sorry, there was an error processing your message.',
                sender: 'agent',
                timestamp: Date.now(),
                metadata: { error: error.message },
            }));
        } finally {
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
