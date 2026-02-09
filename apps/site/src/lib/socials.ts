export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  href: string;
  icon: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "@ishanichuri",
    href: "https://www.linkedin.com/in/ishanichuri/",
    icon: "/icons/linkedin-brands-solid-full.svg"
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@ishanichuri",
    href: "https://www.instagram.com/ishanichuri/",
    icon: "/icons/instagram-brands-solid-full.svg"
  },
  {
    id: "behance",
    label: "Behance",
    handle: "ishanichuri",
    href: "https://www.behance.net/ishanichuri",
    icon: "/icons/behance-brands-solid-full.svg"
  },
  {
    id: "email",
    label: "Email",
    handle: "ishanichuri@gmail.com",
    href: "mailto:ishanichuri@gmail.com",
    icon: "/icons/at-solid-full.svg"
  }
];

