import { championImageUrl } from './champion-image';

describe('championImageUrl', () => {
  it('utilise le nom sans espaces comme identifiant Data Dragon', () => {
    expect(championImageUrl(' Miss Fortune ')).toBe(
      'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/MissFortune.png'
    );
  });

  it('utilise l\'identifiant MonkeyKing pour Wukong', () => {
    expect(championImageUrl('Wukong')).toBe(
      'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion/MonkeyKing.png'
    );
  });
});
