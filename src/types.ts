export type Suit = 'spade' | 'heart' | 'diamond' | 'club';

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
    value: number;
    image: string;
}

export const SUITS: Suit[] = ['spade', 'heart', 'diamond', 'club'];
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const RANK_VALUE: Record<Rank, number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
};

export type Player = 'Player' | 'Bot';

export interface LogEntry {
    id: string;
    player: Player;
    action: 'throw' | 'draw' | 'jhyap';
    cards?: Card[];
    source?: 'deck' | 'discard';
    timestamp: number;
}
