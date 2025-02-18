import styled from 'styled-components';
import { ThemeAppearance } from '@joplin/lib/themes/type';


export const StyledRoot = styled.div<{ theme: ThemeAppearance }>`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 300px;
    background-color: ${props => props.theme.backgroundColor};
    border-left: 1px solid ${props => props.theme.dividerColor};
`;

export const StyledMessagesContainer = styled.div<{ theme: ThemeAppearance }>`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
`;

export const StyledMessage = styled.div<{ theme: ThemeAppearance; isAgent: boolean; sender?: string }>`
    margin-bottom: 16px;
    padding: 8px 12px;
    border-radius: 8px;
    max-width: 80%;
    white-space: pre-wrap;
    ${props => {
        if (props.sender === 'error') {
            return `
                background-color: ${props.theme.backgroundColor};
                border: 1px solid ${props.theme.colorError};
                color: ${props.theme.colorError};
                margin-right: auto;
                margin-left: auto;
            `;
        }
        return props.isAgent ? `
            background-color: ${props.theme.backgroundColor3};
            margin-right: auto;
        ` : `
            background-color: ${props.theme.backgroundColor2};
            margin-left: auto;
        `;
    }}
`;

export const StyledInputContainer = styled.div<{ theme: ThemeAppearance }>`
    padding: 16px;
    border-top: 1px solid ${props => props.theme.dividerColor};
`;

export const StyledInput = styled.textarea<{ theme: ThemeAppearance }>`
    width: 100%;
    min-height: 40px;
    max-height: 120px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid ${props => props.theme.dividerColor};
    background-color: ${props => props.theme.backgroundColor};
    color: ${props => props.theme.color};
    resize: vertical;
    &:focus {
        outline: none;
        border-color: ${props => props.theme.colorBorder};
    }
`;

export const StyledSendButton = styled.button<{ theme: ThemeAppearance; disabled: boolean }>`
    margin-top: 8px;
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    background-color: ${props => props.disabled ? props.theme.backgroundColor3 : props.theme.backgroundColor2};
    color: ${props => props.theme.color};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    &:hover {
        opacity: ${props => props.disabled ? 1 : 0.8};
    }
`;
