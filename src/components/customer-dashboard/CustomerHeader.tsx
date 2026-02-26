
'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { LogOut, RefreshCw, Languages, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAppContext } from '../AppContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useLanguage } from '../LanguageProvider';


export function CustomerHeader() {
    const { user, logout } = useAuth();
    const { fetchData, loading } = useAppContext();
    const { language, setLanguage, t } = useLanguage();
    const userInitial = user?.displayName ? user.displayName.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : '?');
    const languageNames: Record<string, string> = {
        en: "English",
        he: "עברית"
    }

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container mx-auto flex h-16 max-w-6xl items-center sm:justify-between">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                         <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-gradient text-white font-bold text-lg">
                            Z
                        </div>
                        <span className="inline-block font-bold text-lg">ZoomCut</span>
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-end">
                    <nav className="flex items-center gap-2">
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <Languages />
                                    <span className="hidden sm:inline-block mx-2">{languageNames[language]}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('he')}>עברית</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="outline" onClick={() => fetchData()} disabled={loading}>
                            <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            {t('refresh_status_button')}
                        </Button>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
                                    <Avatar>
                                        <AvatarImage src={user?.photoURL ?? ''} alt={user?.displayName ?? ''} />
                                        <AvatarFallback>{userInitial}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user?.displayName ?? 'User'}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/settings">
                                        <Settings className="mr-2 h-4 w-4" />
                                        {t('settings_menu_item')}
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={logout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                {t('logout_button')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                    </nav>
                </div>
            </div>
        </header>
    )
}
