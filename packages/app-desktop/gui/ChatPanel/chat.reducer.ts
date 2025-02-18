import { AnyAction } from 'redux';

import { ExtractedContext } from '../../services/langchain/contextExtractor';

export interface ChatMessage {
    id: string;
    content: string;
    sender: 'user' | 'agent';
    timestamp: number;
    metadata?: {
        contexts?: ExtractedContext[];
        error?: string;
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

// Reducer
export default function reducer(state: ChatState = defaultState, action: AnyAction): ChatState {
    switch (action.type) {
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
