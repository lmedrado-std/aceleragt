
"use client"

import { cn } from "@/lib/utils";

const Avatar1 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#F0D6A7"/>
        <path d="M40 40C28.9543 40 20 48.9543 20 60H60C60 48.9543 51.0457 40 40 40Z" fill="#D2A86D"/>
        <path d="M40 30C45.5228 30 50 25.5228 50 20C50 14.4772 45.5228 10 40 10C34.4772 10 30 14.4772 30 20C30 25.5228 34.4772 30 40 30Z" fill="#A86454"/>
    </svg>
);

const Avatar2 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#C4E8C5"/>
        <path d="M40 60C51.0457 60 60 51.0457 60 40C60 28.9543 51.0457 20 40 20C28.9543 20 20 28.9543 20 40C20 51.0457 28.9543 60 40 60Z" fill="#90D292"/>
        <path d="M40 40L60 20H20L40 40Z" fill="#54A858"/>
    </svg>
);

const Avatar3 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#A7DDF0"/>
        <rect x="20" y="20" width="40" height="40" rx="20" fill="#6DB1D2"/>
        <circle cx="40" cy="40" r="10" fill="#4B89A8"/>
    </svg>
);

const Avatar4 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#F0A7A7"/>
        <path d="M20 60L40 20L60 60H20Z" fill="#D26D6D"/>
        <path d="M30 60L40 40L50 60H30Z" fill="#A85454"/>
    </svg>
);

const Avatar5 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#D1A7F0"/>
        <path d="M40 20L60 60H20L40 20Z" fill="#A96DD2"/>
        <path d="M40 40L50 60H30L40 40Z" fill="#8454A8"/>
    </svg>
);

const Avatar6 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#F0E3A7"/>
        <path d="M40 20C28.9543 20 20 28.9543 20 40V60H60V40C60 28.9543 51.0457 20 40 20Z" fill="#D2C06D"/>
        <rect x="35" y="45" width="10" height="15" fill="#A89654"/>
    </svg>
);

const Avatar7 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#A7F0D1"/>
        <path d="M20 20L60 20L40 60L20 20Z" fill="#6DD2A9"/>
        <path d="M30 20L50 20L40 40L30 20Z" fill="#54A884"/>
    </svg>
);

const Avatar8 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#A7B8F0"/>
        <rect x="20" y="30" width="40" height="20" fill="#6D84D2"/>
        <rect x="30" y="20" width="20" height="40" fill="#5465A8"/>
    </svg>
);

const Avatar9 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#F0A7D1"/>
        <path d="M20 20C20 42.0914 37.9086 60 60 60" stroke="#D26DA9" strokeWidth="8"/>
        <path d="M60 20C37.9086 20 20 37.9086 20 60" stroke="#A85484" strokeWidth="8"/>
    </svg>
);

const Avatar10 = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="40" cy="40" r="40" fill="#B2F0A7"/>
        <rect x="25" y="25" width="30" height="30" fill="#80D26D" transform="rotate(45 40 40)"/>
        <circle cx="40" cy="40" r="10" fill="#5AA854"/>
    </svg>
);


const avatarComponents: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  avatar1: Avatar1,
  avatar2: Avatar2,
  avatar3: Avatar3,
  avatar4: Avatar4,
  avatar5: Avatar5,
  avatar6: Avatar6,
  avatar7: Avatar7,
  avatar8: Avatar8,
  avatar9: Avatar9,
  avatar10: Avatar10,
};

interface SellerAvatarProps {
  avatarId: string;
  className?: string;
}

export function SellerAvatar({ avatarId, className }: SellerAvatarProps) {
  const AvatarComponent = avatarComponents[avatarId] || Avatar1; // Fallback to Avatar1

  return (
    <div className={cn("rounded-full overflow-hidden", className)}>
      <AvatarComponent />
    </div>
  );
}
