import React from 'react';
import type { Card as CardType } from '../types';

interface CardProps {
    card: CardType;
    selected?: boolean;
    isBack?: boolean;
    noHover?: boolean;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ card, selected, isBack, noHover, onClick, style }) => {
    return (
        <div
            className={`card ${selected ? 'selected' : ''} ${isBack ? 'back' : ''} ${noHover ? 'no-hover' : ''}`}
            onClick={onClick}
            style={{
                backgroundImage: isBack ? undefined : `url('${card.image}')`,
                ...style
            }}
        />
    );
};
