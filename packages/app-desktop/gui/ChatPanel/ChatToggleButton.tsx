import * as React from 'react';
import { connect } from 'react-redux';
import Button, { ButtonLevel } from '../Button/Button';
import { _ } from '@joplin/lib/locale';
import { AppState } from '../../app.reducer';
import { toggleChat } from './chat.reducer';

interface Props {
    themeId: number;
    isOpen: boolean;
    dispatch: any;
}

const ChatToggleButton: React.FC<Props> = ({ dispatch, isOpen }) => {
    const handleClick = () => {
        dispatch(toggleChat());
    };

    return (
        <Button
            level={ButtonLevel.SidebarSecondary}
            iconName="fas fa-comments"
            tooltip={isOpen ? _('Hide Chat') : _('Show Chat')}
            onClick={handleClick}
        />
    );
};

const mapStateToProps = (state: AppState) => ({
    themeId: state.settings.theme,
    isOpen: state.chat.isOpen,
});

export default connect(mapStateToProps)(ChatToggleButton);
