export interface LevelMiniDTO {
  id: string;
  order: number;
  tasks: "flash" | "test" | "dictation";
}

export interface LevelDTO {
  id: string;
  order: number;
  tasks: "flash" | "test" | "dictation";
  requiredScore: number;
}
