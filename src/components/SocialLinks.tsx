import { Facebook, Instagram, Linkedin, Twitter, Youtube, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinksProps {
  links: SocialLink[];
  caption?: string;
}

const getPlatformIcon = (platform: string) => {
  const icons: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
    twitter: Twitter,
    youtube: Youtube,
  };
  return icons[platform.toLowerCase()] || Globe;
};

export default function SocialLinks({ links, caption }: SocialLinksProps) {
  if (links.length === 0) return null;

  return (
    <div className="space-y-4">
      {caption && (
        <p className="text-sm text-muted-foreground text-center">{caption}</p>
      )}
      <div className="flex flex-wrap gap-3 justify-center">
        {links.map((link, index) => {
          const Icon = getPlatformIcon(link.platform);
          return (
            <Button
              key={index}
              variant="outline"
              size="icon"
              className="w-12 h-12 rounded-full hover:bg-primary hover:text-primary-foreground hover:border-primary transition-smooth"
              onClick={() => window.open(link.url, '_blank')}
            >
              <Icon className="w-5 h-5" />
            </Button>
          );
        })}
      </div>
    </div>
  );
}
