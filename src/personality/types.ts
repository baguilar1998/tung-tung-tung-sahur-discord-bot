export type Intent =
  | "summon"
  | "greeting"
  | "lore"
  | "awake"
  | "sleep"
  | "hungry"
  | "scared"
  | "weapon"
  | "rival"
  | "fame"
  | "homecoming"
  | "compliment"
  | "insult"
  | "bored"
  | "help"
  | "time"
  | "fallback";

export type Rival =
  | "patapim"
  | "tralalero"
  | "bombardiro"
  | "cappuccina"
  | "hotspot"
  | "other";

export type FameTopic = "fortnite" | "roblox" | "copyright" | "film";

export interface Classification {
  intent: Intent;
  rival: Rival | null;
  fame: FameTopic | null;
}
