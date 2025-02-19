import { AnyAction } from 'redux';

import { ExtractedContext } from '../../services/langchain/contextExtractor';
import { DiffOperation } from '../../services/langchain/diffGenerator';

export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'agent' | 'error';
    timestamp: number;
    metadata?: {
        contexts?: ExtractedContext[];
        error?: string;
        suggestedEdit?: DiffOperation;
        editStatus?: 'pending' | 'accepted' | 'rejected';
    };
}

export interface ChatState {
    isOpen: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
}

const defaultState: ChatState = {
    isOpen: false,
    messages: [],
    isLoading: false,
};

// Action Types
export const TOGGLE_CHAT = 'CHAT_TOGGLE';
export const ADD_MESSAGE = 'CHAT_ADD_MESSAGE';
export const SET_LOADING = 'CHAT_SET_LOADING';
export const UPDATE_EDIT_STATUS = 'CHAT_UPDATE_EDIT_STATUS';

// Action Creators
export const toggleChat = () => ({
    type: TOGGLE_CHAT as typeof TOGGLE_CHAT,
});

export const addMessage = (message: ChatMessage) => ({
    type: ADD_MESSAGE as typeof ADD_MESSAGE,
    message,
});

export const setLoading = (isLoading: boolean) => ({
    type: SET_LOADING as typeof SET_LOADING,
    isLoading,
});

export const updateEditStatus = (messageId: string, status: 'accepted' | 'rejected') => ({
    type: UPDATE_EDIT_STATUS as typeof UPDATE_EDIT_STATUS,
    messageId,
    status,
});

// Reducer
export default function reducer(state: ChatState = defaultState, action: AnyAction): ChatState {
    switch (action.type) {
        case UPDATE_EDIT_STATUS:
            return {
                ...state,
                messages: state.messages.map(message =>
                    message.id === action.messageId
                        ? {
                            ...message,
                            metadata: {
                                ...message.metadata,
                                editStatus: action.status,
                            },
                        }
                        : message
                ),
            };

        case TOGGLE_CHAT:
            return {
                ...state,
                isOpen: !state.isOpen,
            };

        case ADD_MESSAGE:
            return {
                ...state,
                messages: [...state.messages, action.message],
            };

        case SET_LOADING:
            return {
                ...state,
                isLoading: action.isLoading,
            };

        default:
            return state;
    }
}
