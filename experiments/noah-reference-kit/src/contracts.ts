export type ReferenceImage = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export type ReferenceLink = {
  id: string;
  label: string;
  href: `#${string}`;
  iconKey?: string;
  badge?: string;
  isActive?: boolean;
  isDisabled?: boolean;
};

export type ReferenceHeaderModel = {
  brandLabel: string;
  logo?: ReferenceImage;
  announcement?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

export type ReferenceNavigationModel = {
  ariaLabel: string;
  items: readonly ReferenceLink[];
  mobileMode: "bottom-bar" | "drawer";
  desktopMode: "sidebar" | "topbar";
};

export type ReferenceShellModel = {
  header: ReferenceHeaderModel;
  navigation: ReferenceNavigationModel;
  contentLabel: string;
};

export type ReferencePromotionSlide = {
  id: string;
  title: string;
  description?: string;
  image: ReferenceImage;
  href: `#${string}`;
  startsAt?: string;
  endsAt?: string;
  isFeatured?: boolean;
};

export type ReferenceHighlightTab = {
  id: string;
  label: string;
  iconKey?: string;
  isActive?: boolean;
};

export type ReferenceTournamentCard = {
  id: string;
  title: string;
  subtitle?: string;
  image: ReferenceImage;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "active" | "ended";
  participantCount?: number;
  prizeLabel?: string;
  actionLabel: string;
  href: `#${string}`;
};

export type ReferencePromotionSectionModel = {
  ariaLabel: string;
  slides: readonly ReferencePromotionSlide[];
  tabs: readonly ReferenceHighlightTab[];
  autoplay: false;
};

export type ReferenceTournamentSectionModel = {
  heading: string;
  items: readonly ReferenceTournamentCard[];
  emptyMessage: string;
};
