
'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useLanguage } from '../LanguageProvider';

interface WelcomeHeaderProps {
    name: string;
    email: string;
    photoURL?: string | null;
    onEditProfile: () => void;
}

const avatarColors = [
    '#F44336', // red
    '#E91E63', // pink
    '#9C27B0', // purple
    '#673AB7', // deep purple
    '#3F51B5', // indigo
    '#2196F3', // blue
    '#03A9F4', // light blue
    '#00BCD4', // cyan
    '#009688', // teal
    '#4CAF50', // green
    '#8BC34A', // light green
    '#CDDC39', // lime
    '#FFC107', // amber
    '#FF9800', // orange
    '#FF5722', // deep orange
    '#795548', // brown
    '#607D8B', // blue grey
];

const generateAvatarColor = (name: string) => {
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % avatarColors.length);
  return avatarColors[index];
};


export function WelcomeHeader({ name, email, photoURL, onEditProfile }: WelcomeHeaderProps) {
    const { t } = useLanguage();
    const userInitial = name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase();
    const avatarColor = generateAvatarColor(name || email);

    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={photoURL ?? ''} alt={name} />
                    <AvatarFallback 
                        className="text-2xl text-white font-bold"
                        style={{ backgroundColor: avatarColor }}
                    >
                        {userInitial}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h1 className="text-3xl font-bold">{t('welcome_message', { name: name || 'User' })}</h1>
                </div>
            </div>
            <Button variant="outline" onClick={onEditProfile}>
                <Edit className="h-4 w-4 mr-2" />
                {t('edit_profile')}
            </Button>
        </div>
    )
}
