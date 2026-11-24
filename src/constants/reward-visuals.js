import { Crown, Flame, Gem, Hexagon, Medal, Moon, ScrollText, Shield, Skull, Swords, Target, Trophy, Zap } from 'lucide-react-native';

/** Icon per inventory item type (presentation only). */
export const ITEM_TYPE_ICONS = {
  trophy: Trophy,
  shard: Gem,
  sigil: Hexagon,
  relic: Crown,
  emblem: Medal,
};

export const ITEM_TYPE_LABELS = {
  trophy: 'Trophy',
  shard: 'Shard',
  sigil: 'Sigil',
  relic: 'Relic',
  emblem: 'Emblem',
};

/** Icon per achievement group. */
export const ACHIEVEMENT_GROUP_ICONS = {
  quests: ScrollText,
  streaks: Flame,
  growth: Zap,
  mastery: Target,
  bosses: Skull,
  challenges: Swords,
  secret: Moon,
};

export const TITLE_ICON = Shield;
export const BOSS_ICON = Skull;
