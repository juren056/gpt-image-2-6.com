export const HOMEPAGE_PROMPT_CATEGORIES = [
  'cinematic',
  'nature',
  'people',
  'product',
  'food',
  'travel',
  'scifi',
  'fantasy',
] as const;

export type HomepagePromptCategory =
  (typeof HOMEPAGE_PROMPT_CATEGORIES)[number];

export interface HomepagePromptDefinition {
  id: string;
  category: HomepagePromptCategory;
  image: string;
}

const promptImage = (number: number) =>
  `/prompts/prompt-${String(number).padStart(2, '0')}.jpg`;
const promptPoster = (name: string) => `/prompts/${name}-poster.jpg`;

export const HOMEPAGE_PROMPTS = [
  {
    id: 'jellyfish_drift',
    category: 'nature',
    image: promptPoster('jellyfish-drift'),
  },
  {
    id: 'red_silk_salt',
    category: 'cinematic',
    image: promptPoster('red-silk-salt'),
  },
  {
    id: 'bottle_storm',
    category: 'fantasy',
    image: promptPoster('bottle-storm'),
  },
  { id: 'ink_bloom', category: 'cinematic', image: promptPoster('ink-bloom') },
  {
    id: 'levitating_speaker',
    category: 'product',
    image: promptPoster('levitating-speaker'),
  },
  {
    id: 'upward_waterfall',
    category: 'fantasy',
    image: promptPoster('upward-waterfall'),
  },
  {
    id: 'flower_field_flight',
    category: 'travel',
    image: promptPoster('flower-field-flight'),
  },
  {
    id: 'mechanical_hummingbird',
    category: 'scifi',
    image: promptPoster('mechanical-hummingbird'),
  },
  { id: 'astronaut_lake', category: 'cinematic', image: promptImage(1) },
  { id: 'neon_alley', category: 'cinematic', image: promptImage(2) },
  { id: 'desert_train', category: 'cinematic', image: promptImage(3) },
  { id: 'spotlight_dancer', category: 'cinematic', image: promptImage(8) },
  { id: 'wild_horses', category: 'cinematic', image: promptImage(11) },
  { id: 'glass_city', category: 'cinematic', image: promptImage(12) },
  { id: 'fern_dewdrops', category: 'nature', image: promptImage(4) },
  { id: 'underwater_wave', category: 'nature', image: promptImage(9) },
  { id: 'snow_cabin', category: 'nature', image: promptImage(10) },
  { id: 'bioluminescent_forest', category: 'nature', image: promptImage(14) },
  { id: 'crystal_cave', category: 'nature', image: promptImage(22) },
  { id: 'storm_cliffs', category: 'nature', image: promptImage(25) },
  { id: 'chef_plating', category: 'people', image: promptImage(5) },
  { id: 'mountain_hiker', category: 'people', image: promptImage(26) },
  { id: 'rainy_portrait', category: 'people', image: promptImage(27) },
  { id: 'elder_craftsperson', category: 'people', image: promptImage(28) },
  { id: 'boxer_backstage', category: 'people', image: promptImage(29) },
  { id: 'cellist_window', category: 'people', image: promptImage(30) },
  { id: 'perfume_reveal', category: 'product', image: promptImage(6) },
  { id: 'watch_mechanism', category: 'product', image: promptImage(31) },
  { id: 'coffee_packaging', category: 'product', image: promptImage(32) },
  { id: 'sneaker_launch', category: 'product', image: promptImage(33) },
  { id: 'skincare_water', category: 'product', image: promptImage(34) },
  { id: 'electric_bicycle', category: 'product', image: promptImage(35) },
  { id: 'ramen_steam', category: 'food', image: promptImage(36) },
  { id: 'citrus_splash', category: 'food', image: promptImage(37) },
  { id: 'chocolate_macro', category: 'food', image: promptImage(38) },
  { id: 'bread_morning', category: 'food', image: promptImage(39) },
  { id: 'sushi_counter', category: 'food', image: promptImage(40) },
  { id: 'summer_mocktail', category: 'food', image: promptImage(41) },
  { id: 'old_town_morning', category: 'travel', image: promptImage(42) },
  { id: 'alpine_clouds', category: 'travel', image: promptImage(7) },
  { id: 'night_monorail', category: 'travel', image: promptImage(20) },
  { id: 'winter_escape', category: 'travel', image: promptImage(43) },
  { id: 'coastal_road', category: 'travel', image: promptImage(44) },
  { id: 'market_walk', category: 'travel', image: promptImage(45) },
  { id: 'robot_gardener', category: 'scifi', image: promptImage(15) },
  { id: 'terrarium_city', category: 'scifi', image: promptImage(19) },
  { id: 'orbital_greenhouse', category: 'scifi', image: promptImage(46) },
  { id: 'holographic_archive', category: 'scifi', image: promptImage(47) },
  { id: 'floating_transit', category: 'scifi', image: promptImage(48) },
  { id: 'clockwork_valley', category: 'scifi', image: promptImage(24) },
  { id: 'paper_dragon', category: 'fantasy', image: promptImage(13) },
  { id: 'floating_islands', category: 'fantasy', image: promptImage(16) },
  { id: 'koi_constellations', category: 'fantasy', image: promptImage(21) },
  { id: 'umbrella_portal', category: 'fantasy', image: promptImage(23) },
  { id: 'silk_ribbons', category: 'fantasy', image: promptImage(18) },
  { id: 'miniature_bakery', category: 'fantasy', image: promptImage(17) },
] as const satisfies ReadonlyArray<HomepagePromptDefinition>;
