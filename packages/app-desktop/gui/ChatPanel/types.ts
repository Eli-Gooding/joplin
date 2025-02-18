import { ChatMessage } from './chat.reducer';
import { Dispatch } from 'redux';

export interface ChatPanelProps {
    isOpen: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
    themeId: number;
    dispatch: Dispatch;
    currentNoteContent?: string;
}

export interface ChatInputProps {
    onSendMessage: (content: string) => void;
    isLoading: boolean;
    themeId: number;
}

export interface ChatMessagesProps {
    messages: ChatMessage[];
    themeId: number;
}
