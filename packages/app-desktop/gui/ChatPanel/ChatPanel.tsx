import * as React from 'react';
import { connect } from 'react-redux';
import { StyledRoot } from './styles';
import { ChatPanelProps } from './types';
import { themeStyle } from '@joplin/lib/theme';
import Note from '@joplin/lib/models/Note';
import { AppState } from '../../app.reducer';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { addMessage, setLoading, updateEditStatus } from './chat.reducer';

const ChatPanel: React.FC<ChatPanelProps> = ({
    isOpen,
    messages,
    isLoading,
    themeId,
    dispatch,
    currentNoteContent,
    currentNoteId,
}) => {
    const theme = themeStyle(themeId);

    const handleSendMessage = async (content: string) => {
        console.log('[ChatPanel] Starting to process message:', { content, hasNoteContent: !!currentNoteContent });
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
            console.log('[ChatPanel] Importing LangChainService...');
            const LangChainService = (await import('../../services/langchain/langchainService')).LangChainService;
            console.log('[ChatPanel] Creating new LangChainService instance...');
            const langchainService = new LangChainService();
            
            console.log('[ChatPanel] Processing message with LangChain service...');
            const { response, contexts, suggestedEdit } = await langchainService.processMessage(
                content,
                currentNoteContent || '',
                currentNoteId
            );
            console.log('[ChatPanel] Received response:', { responseLength: response.length, numContexts: contexts.length });

            // Add agent response
            dispatch(addMessage({
                id: Date.now().toString(),
                content: response,
                sender: 'agent',
                timestamp: Date.now(),
                metadata: {
                    contexts,
                    ...(suggestedEdit ? { suggestedEdit, editStatus: 'pending' } : {}),
                },
            }));
        } catch (error: any) {
            console.error('[ChatPanel] Error processing message:', error);
            console.error('[ChatPanel] Error stack:', error.stack);

            // Determine user-friendly error message
            let errorMessage = 'An error occurred while processing your message.';
            let actionMessage = 'Please try again later or contact support if the issue persists.';
            
            if (error.message?.includes('OPENAI_API_KEY is required')) {
                errorMessage = 'OpenAI API key is not configured.';
                actionMessage = 'To use the chat functionality:\n1. Go to Settings > LangChain\n2. Enter your OpenAI API key\n3. Try sending your message again';
            } else if (error.message?.includes('Invalid LANGCHAIN_API_KEY')) {
                errorMessage = 'Invalid LangSmith API key format.';
                actionMessage = 'Please check your LangSmith API key format in Settings > LangChain.';
            }

            // Add error message to chat
            dispatch(addMessage({
                id: Date.now().toString(),
                content: `⚠️ ${errorMessage}\n\n${actionMessage}`,
                sender: 'error',
                timestamp: Date.now(),
            }));
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleAcceptEdit = async (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (!message?.metadata?.suggestedEdit) return;

        try {
            const { suggestedEdit } = message.metadata;
            console.log('[ChatPanel] Accepting edit:', { messageId, suggestedEdit });

            // Update the note content
            await Note.save({
                id: suggestedEdit.noteId,
                body: suggestedEdit.newContent,
            });
            
            // Update the edit status
            dispatch(updateEditStatus(messageId, 'accepted'));
        } catch (error) {
            console.error('[ChatPanel] Error accepting edit:', error);
            // Add error message
            dispatch(addMessage({
                id: Date.now().toString(),
                content: 'Failed to apply changes: ' + (error.message || 'Unknown error'),
                sender: 'error',
                timestamp: Date.now(),
            }));
        }
    };

    const handleRejectEdit = (messageId: string) => {
        dispatch(updateEditStatus(messageId, 'rejected'));
    };

    if (!isOpen) return null;

    return (
        <StyledRoot theme={theme}>
            <ChatMessages
                messages={messages}
                themeId={themeId}
                onAcceptEdit={handleAcceptEdit}
                onRejectEdit={handleRejectEdit}
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
    currentNoteId: state.selectedNoteIds[0], // Get the first selected note ID
});

export default connect(mapStateToProps)(ChatPanel);
