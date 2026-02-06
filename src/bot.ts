import type { Card } from './types';



export const getBotThrow = (hand: Card[]): Card[] => {
    // 1. Try to find sequences
    const sequences = findSequences(hand);
    if (sequences.length >= 3) {
        return sequences;
    }

    // 2. Try to find sets
    const sets = findSets(hand);
    if (sets.length >= 2) {
        return sets;
    }

    // 3. Throw the highest value card
    const sortedHand = [...hand].sort((a, b) => b.value - a.value);
    return [sortedHand[0]];
};

const findSequences = (hand: Card[]): Card[] => {
    const suits = Array.from(new Set(hand.map(c => c.suit)));
    let bestSequence: Card[] = [];

    suits.forEach(suit => {
        const suitCards = hand.filter(c => c.suit === suit).sort((a, b) => a.value - b.value);
        let currentSequence: Card[] = [];

        for (let i = 0; i < suitCards.length; i++) {
            // Handle wrap around for A, 2, 3... and ..., Q, K, A
            // For simplicity, standard linear sequence:
            if (currentSequence.length === 0 || suitCards[i].value === currentSequence[currentSequence.length - 1].value + 1) {
                currentSequence.push(suitCards[i]);
            } else {
                if (currentSequence.length >= 3 && currentSequence.length > bestSequence.length) {
                    bestSequence = [...currentSequence];
                }
                currentSequence = [suitCards[i]];
            }
        }
        if (currentSequence.length >= 3 && currentSequence.length > bestSequence.length) {
            bestSequence = [...currentSequence];
        }
    });

    return bestSequence;
};

const findSets = (hand: Card[]): Card[] => {
    const rankGroups: Record<string, Card[]> = {};
    hand.forEach(card => {
        if (!rankGroups[card.rank]) rankGroups[card.rank] = [];
        rankGroups[card.rank].push(card);
    });

    let bestSet: Card[] = [];
    Object.values(rankGroups).forEach(group => {
        if (group.length >= 2 && group.length > bestSet.length) {
            bestSet = group;
        }
    });

    return bestSet;
};

export const getBotDraw = (hand: Card[], lastThrown: Card[]): Card | 'deck' => {
    if (lastThrown.length === 0) return 'deck';

    // Check if any thrown card helps form a sequence
    for (const card of lastThrown) {
        const handWithCard = [...hand, card];
        const newSequences = findSequences(handWithCard);
        const oldSequences = findSequences(hand);

        if (newSequences.length > oldSequences.length) {
            return card;
        }

        // Check if any thrown card helps form a set
        const newSets = findSets(handWithCard);
        const oldSets = findSets(hand);
        if (newSets.length > oldSets.length) {
            return card;
        }
    }

    // Otherwise, take if a very low card is available
    const sortedThrown = [...lastThrown].sort((a, b) => a.value - b.value);
    if (sortedThrown[0].value <= 3) return sortedThrown[0];

    return 'deck';
};

