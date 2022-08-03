import React from 'react';

import './styles.scss';

type MenuButtonProps = {
    buttons:{
        text: string,
        icon: string | JSX.Element;
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    }[];
}

const MenuButtons = ({buttons}: MenuButtonProps): JSX.Element => {
    return (
        <div className='button-menu d-flex flex-column'>
            {buttons.map((button) => (
                <button
                    key={button.text}
                    className='button-menu__btn d-flex'
                    onClick={button.onClick}
                >
                    <span className='button-menu__btn-icon'>
                        {typeof button.icon === 'string' ? <i className={button.icon}/> : button.icon}
                    </span>
                    <span className='button-menu__btn-text'>{button.text}</span>
                </button>
            ))}
        </div>
    );
};

export default MenuButtons;
