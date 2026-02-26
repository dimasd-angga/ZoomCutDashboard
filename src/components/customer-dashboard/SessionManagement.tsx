'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/components/LanguageProvider';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Activity, MonitorSmartphone, RefreshCw, ChevronsUpDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SessionRecord {
  id: string;
  sessionId?: string;
  deviceId?: string | null;
  deviceLabel?: string | null;
  userAgent?: string | null;
  source?: string | null;
  isActive?: boolean;
  lastActivity?: any;
}

const parseTimestamp = (value: any) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  try {
    return new Date(value);
  } catch {
    return null;
  }
};

const formatDate = (value: any) => {
  const date = parseTimestamp(value);
  if (!date) return '—';
  return date.toLocaleString();
};

export function SessionManagement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = React.useState<SessionRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [detachingId, setDetachingId] = React.useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedSessionId = window.localStorage.getItem('firebase_session_id');
    setCurrentSessionId(storedSessionId);

    const handleStorage = () => {
      const updatedSessionId = window.localStorage.getItem('firebase_session_id');
      setCurrentSessionId(updatedSessionId);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const fetchSessions = React.useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/sessions?uid=${user.uid}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const payload = await response.json();
      const mapped: SessionRecord[] = Array.isArray(payload?.sessions)
        ? payload.sessions.map((session: any) => ({
            id: session.id || session.sessionId,
            sessionId: session.sessionId ?? session.id,
            deviceId: session.deviceId ?? null,
            deviceLabel: session.deviceLabel ?? null,
            userAgent: session.userAgent ?? null,
            source: session.source ?? 'dashboard',
            isActive: session.isActive ?? false,
            lastActivity: session.lastActivity ?? null,
          }))
        : [];
      setSessions(mapped);
    } catch (error: any) {
      console.error('[SessionManagement] Failed to fetch sessions', error);
      toast({
        variant: 'destructive',
        title: t('session_management_error_title'),
        description: error?.message || t('session_management_error_desc'),
      });
    } finally {
      setLoading(false);
    }
  }, [toast, t, user]);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDetach = async (session: SessionRecord) => {
    if (!user || !session.sessionId) return;
    try {
      setDetachingId(session.sessionId);
      const isPluginSession = Boolean(session.deviceId);
      const response = await fetch('/api/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: user.uid,
          sessionId: session.sessionId,
          email: user.email,
          ...(isPluginSession
            ? { detachDevice: true }
            : {}),
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      toast({
        title: t('session_management_detach_success_title'),
        description: isPluginSession
          ? t('session_management_detach_success_desc')
          : t('session_management_detach_dashboard_desc'),
      });
      fetchSessions();
    } catch (error: any) {
      console.error('[SessionManagement] Failed to detach session', error);
      toast({
        variant: 'destructive',
        title: t('session_management_error_title'),
        description: error?.message || t('session_management_error_desc'),
      });
    } finally {
      setDetachingId(null);
    }
  };

  const pluginSessions = sessions.filter((session) => Boolean(session.deviceId));
  const dashboardSessions = sessions.filter((session) => !session.deviceId);

  return (
    <Card className="bg-card">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <div className="flex w-full cursor-pointer items-center">
                    <CardHeader className="flex w-full flex-row items-start justify-between">
                        <div className="flex items-center gap-3">
                        <MonitorSmartphone className="h-6 w-6" />
                        <div>
                            <CardTitle>{t('session_management_title')}</CardTitle>
                            <CardDescription>{t('session_management_desc')}</CardDescription>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fetchSessions(); }} disabled={loading}>
                              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                              {t('session_management_refresh')}
                          </Button>
                          <ChevronsUpDown className="h-4 w-4" />
                        </div>
                    </CardHeader>
                </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border p-4 space-y-1">
                        <p className="text-sm text-muted-foreground">
                        {t('session_management_total_sessions')}
                        </p>
                        <p className="text-2xl font-semibold">{sessions.length}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                        <p className="text-sm text-muted-foreground">
                        {t('session_management_plugin_sessions')}
                        </p>
                        <p className="text-2xl font-semibold">{pluginSessions.length}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                        <p className="text-sm text-muted-foreground">
                        {t('session_management_dashboard_sessions')}
                        </p>
                        <p className="text-2xl font-semibold">{dashboardSessions.length}</p>
                    </div>
                    <div className="rounded-lg border p-4 space-y-1">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        {t('session_management_active_sessions')}
                        </p>
                        <p className="text-2xl font-semibold">
                        {sessions.filter((session) => session.isActive).length}
                        </p>
                    </div>
                    </div>

                    <Separator />

                    {sessions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {t('session_management_empty_state')}
                    </p>
                    ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => {
                        const isCurrentSession =
                            Boolean(currentSessionId) && session.sessionId === currentSessionId;
                        return (
                        <div
                            key={session.sessionId ?? session.id}
                            className="flex flex-col md:flex-row md:items-center md:justify-between rounded-lg border p-4 gap-4"
                        >
                            <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Badge variant={session.deviceId ? 'default' : 'secondary'}>
                                {session.deviceId
                                    ? t('session_management_source_plugin')
                                    : t('session_management_source_dashboard')}
                                </Badge>
                                {isCurrentSession && (
                                <Badge variant="outline">
                                    {t('session_management_current_session')}
                                </Badge>
                                )}
                                <span className="text-sm text-muted-foreground">
                                {session.deviceLabel || session.userAgent || '—'}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {t('session_management_last_active', {
                                date: formatDate(session.lastActivity),
                                })}
                            </p>
                            <p className="text-xs text-muted-foreground break-all">
                                {session.deviceId
                                ? `${t('session_management_device_id')}: ${session.deviceId}`
                                : t('session_management_no_device_id')}
                            </p>
                            </div>
                            <div className="flex items-center gap-2">
                            <Badge variant={session.isActive ? 'default' : 'outline'}>
                                {session.isActive
                                ? t('session_management_status_active')
                                : t('session_management_status_inactive')}
                            </Badge>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={detachingId === session.sessionId || isCurrentSession}
                                onClick={() => handleDetach(session)}
                            >
                                {detachingId === session.sessionId
                                ? t('session_management_detaching')
                                : t('session_management_detach_button')}
                            </Button>
                            </div>
                        </div>
                        );
                        })}
                    </div>
                    )}
                </CardContent>
            </CollapsibleContent>
        </Collapsible>
    </Card>
  );
}
