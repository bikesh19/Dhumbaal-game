import type { Card } from './types';
import { RANK_VALUE, RANKS, SUITS } from './types';

export const createDeck = (): Card[] => {
    const deck: Card[] = [];
    SUITS.forEach((suit) => {
        RANKS.forEach((rank) => {
            deck.push({
                id: `${suit}-${rank}`,
                suit,
                rank,
                value: RANK_VALUE[rank],
                image: `/card img/${suit}/${suit} ${rank === 'A' ? 'ace' : rank === 'J' ? 'jack' : rank === 'Q' ? 'queen' : rank === 'K' ? 'king' : rank}.jpg`,
            });
        });
    });
    return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
};

export const isValidSet = (cards: Card[]): boolean => {
    if (cards.length < 2) return false;
    const firstRank = cards[0].rank;
    return cards.every((card) => card.rank === firstRank);
};

export const isValidSequence = (cards: Card[]): boolean => {
    if (cards.length < 3) return false;
    const sortedCards = [...cards].sort((a, b) => a.value - b.value);
    const suit = sortedCards[0].suit;

    for (let i = 0; i < sortedCards.length - 1; i++) {
        if (sortedCards[i].suit !== suit || sortedCards[i + 1].value !== sortedCards[i].value + 1) {
            return false;
        }
    }
    return true;
};

export const calculateHandValue = (cards: Card[]): number => {
    return cards.reduce((sum, card) => sum + card.value, 0);
};

export const getLowestHandScore = (playerHands: Card[][]): { index: number; score: number; cardCount: number } => {
    let lowestIndex = 0;
    let lowestScore = calculateHandValue(playerHands[0]);
    let lowestCardCount = playerHands[0].length;

    playerHands.forEach((hand, index) => {
        const score = calculateHandValue(hand);
        if (score < lowestScore) {
            lowestScore = score;
            lowestIndex = index;
            lowestCardCount = hand.length;
        } else if (score === lowestScore) {
            if (hand.length < lowestCardCount) {
                lowestIndex = index;
                lowestCardCount = hand.length;
            }
        }
    });

    return { index: lowestIndex, score: lowestScore, cardCount: lowestCardCount };
};
