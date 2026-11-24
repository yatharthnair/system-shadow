import {
  Apple,
  BedDouble,
  Briefcase,
  Dumbbell,
  Gamepad2,
  House,
  Radio,
  Users,
} from 'lucide-react-native';

/** Icon per quest category (presentation only; categories are defined in features/quests). */
export const CATEGORY_ICONS = {
  fitness: Dumbbell,
  nutrition: Apple,
  family: House,
  social: Users,
  career: Briefcase,
  gaming: Gamepad2,
  livestreaming: Radio,
  recovery: BedDouble,
};
