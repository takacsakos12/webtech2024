export interface Fighter {
  id: number;
  name: string;
  nickname?: string;
  country: string;
  birthDate: string;
  weightClass: string;
  organization: string;
  image: string;
  wins?: number;
  losses?: number;
  draws?: number;
  noContests?: number;
}
