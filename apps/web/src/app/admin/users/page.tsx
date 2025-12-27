'use client';

import { useState, useEffect } from 'react';
import { Users, Shield, ShieldCheck, ShieldAlert, UserCog } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Note: User management requires Keycloak Admin API access
// This is a placeholder that shows the concept - actual implementation
// would need backend endpoints to communicate with Keycloak

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  enabled: boolean;
  createdTimestamp: number;
}

// Placeholder data - in production this would come from the API
const PLACEHOLDER_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@electrovault.local',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['admin'],
    enabled: true,
    createdTimestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: '2',
    username: 'moderator',
    email: 'mod@electrovault.local',
    firstName: 'Moderator',
    lastName: 'User',
    roles: ['moderator'],
    enabled: true,
    createdTimestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    id: '3',
    username: 'contributor1',
    email: 'contributor@electrovault.local',
    firstName: 'Max',
    lastName: 'Mustermann',
    roles: ['contributor'],
    enabled: true,
    createdTimestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
];

function getRoleBadge(role: string) {
  const config = {
    admin: { variant: 'destructive' as const, icon: ShieldAlert, label: 'Admin' },
    moderator: { variant: 'warning' as const, icon: ShieldCheck, label: 'Moderator' },
    contributor: { variant: 'default' as const, icon: Shield, label: 'Contributor' },
    viewer: { variant: 'secondary' as const, icon: Users, label: 'Viewer' },
  };

  const roleConfig = config[role as keyof typeof config] || config.viewer;
  const Icon = roleConfig.icon;

  return (
    <Badge variant={roleConfig.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {roleConfig.label}
    </Badge>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading - in production this would call the API
    const loadUsers = async () => {
      setLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers(PLACEHOLDER_USERS);
      setLoading(false);
    };
    loadUsers();
  }, []);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes('admin')).length,
    moderators: users.filter((u) => u.roles.includes('moderator')).length,
    contributors: users.filter((u) => u.roles.includes('contributor')).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Benutzerverwaltung</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Benutzer und deren Rollen
        </p>
      </div>

      {/* Info Banner */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <UserCog className="h-6 w-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100">
                Keycloak-Integration
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Die Benutzerverwaltung erfolgt über Keycloak. Für erweiterte Funktionen wie
                das Erstellen neuer Benutzer oder das Ändern von Passwörtern, verwenden Sie
                die Keycloak Admin-Konsole unter{' '}
                <a
                  href="http://localhost:8080/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  http://localhost:8080/admin
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Moderatoren</CardTitle>
            <ShieldCheck className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.moderators}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contributors}</div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Benutzer</CardTitle>
          <CardDescription>
            Liste aller registrierten Benutzer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Registriert</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Keine Benutzer gefunden
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            @{user.username}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <span key={role}>{getRoleBadge(role)}</span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.enabled ? 'default' : 'destructive'}>
                          {user.enabled ? 'Aktiv' : 'Deaktiviert'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdTimestamp).toLocaleDateString('de-DE')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Roles Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>Rollen-Übersicht</CardTitle>
          <CardDescription>
            Beschreibung der verfügbaren Benutzerrollen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {getRoleBadge('admin')}
              <div>
                <p className="font-medium">Administrator</p>
                <p className="text-sm text-muted-foreground">
                  Vollzugriff auf alle Funktionen, Benutzerverwaltung, Systemeinstellungen
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              {getRoleBadge('moderator')}
              <div>
                <p className="font-medium">Moderator</p>
                <p className="text-sm text-muted-foreground">
                  Kann Inhalte prüfen, freigeben und bearbeiten. Zugriff auf Admin-Bereich
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              {getRoleBadge('contributor')}
              <div>
                <p className="font-medium">Contributor</p>
                <p className="text-sm text-muted-foreground">
                  Kann neue Bauteile erstellen und eigene Beiträge bearbeiten
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              {getRoleBadge('viewer')}
              <div>
                <p className="font-medium">Viewer</p>
                <p className="text-sm text-muted-foreground">
                  Kann alle öffentlichen Inhalte lesen (Standard-Rolle)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
