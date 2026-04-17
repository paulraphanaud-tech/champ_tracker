export interface Champion {
    id: number;
    name: string;
    role: ChampionRole;
    lane: ChampionLane;
    difficulty: number;
    isFavorite: boolean;
    notes: string;
}

export enum ChampionRole {
    Assassin = 'assassin',
    Fighter = 'fighter',
    Mage = 'mage',
    Marksman = 'marksman',
    Support = 'support',
    Tank = 'tank',
}

export enum ChampionLane {
    Top = 'top',
    Jungle = 'jungle',
    Mid = 'mid',
    Bot = 'bot',
    Support = 'support',
}
