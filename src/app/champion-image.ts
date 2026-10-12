const DATA_DRAGON_IMAGE_BASE = 'https://ddragon.leagueoflegends.com/cdn/14.5.1/img/champion';

/** Champions dont l'identifiant Data Dragon diffère du nom affiché. */
const DATA_DRAGON_IDS: Record<string, string> = {
  Wukong: 'MonkeyKing',
};

/** URL de l'icône Data Dragon d'un champion, à partir de son nom affiché. */
export function championImageUrl(name: string): string {
  const trimmed = name.trim();
  const id = DATA_DRAGON_IDS[trimmed] ?? trimmed.replaceAll(' ', '');
  return `${DATA_DRAGON_IMAGE_BASE}/${id}.png`;
}
