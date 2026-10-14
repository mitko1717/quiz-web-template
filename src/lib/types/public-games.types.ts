export interface PublicGame {
  slug: string;
  name: string;
  description: string;
  tgBotLink: string | null;
  webUrl?: string | null;
  logo: string | null;
  bannerImage: string | null;
  tagline: string | null;
}