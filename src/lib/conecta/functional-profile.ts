import profiles from "@/data/pymes-functional-profiles.json";

export type FunctionalSubactivity = {
  code: string;
  name: string;
  tasks: string[];
  control: string;
  result: string;
};
export type FunctionalProfile = {
  source: string;
  modules: {
    code: string;
    name: string;
    responsibilities: { code: string; name: string; subactivities: FunctionalSubactivity[] }[];
  }[];
};

export function getFunctionalProfile(key?: string): FunctionalProfile | null {
  if (key === "gerente-pymes" || key === "macroproceso-contable") return profiles[key];
  return null;
}
