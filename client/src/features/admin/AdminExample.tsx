import React from 'react';
import {
  usePermissions,
  PermissionGate,
  RoleSwitch,
  LoadingSpinner
} from '@/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Exemple d'utilisation du système de permissions professionnel
 * Démontre les différentes approches de protection
 */
export function AdminExample() {
  const {
    can,
    canSync,
    isAdmin,
    isSuperAdmin,
    promoteUser,
    currentRole
  } = usePermissions();

  const [isPromoting, setIsPromoting] = React.useState(false);

  // Exemple d'action sécurisée
  const handlePromoteUser = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      alert('Seuls les super admins peuvent promouvoir des utilisateurs');
      return;
    }

    setIsPromoting(true);
    try {
      await promoteUser(userId, newRole);
      alert('Utilisateur promu avec succès !');
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  // Exemple d'action avec vérification asynchrone
  const handleDeleteUser = async () => {
    if (await can('manage_users')) {
      // Action de suppression autorisée
      console.log('Suppression autorisée');
    } else {
      alert('Permission insuffisante pour supprimer des utilisateurs');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Exemple du Système de Permissions</h1>

      {/* Informations de l'utilisateur actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Rôle actuel:</strong> {currentRole}</p>
          <p><strong>Est Admin:</strong> {isAdmin ? 'Oui' : 'Non'}</p>
          <p><strong>Est Super Admin:</strong> {isSuperAdmin ? 'Oui' : 'Non'}</p>
        </CardContent>
      </Card>

      {/* Exemple 1: Protection par permission simple */}
      <Card>
        <CardHeader>
          <CardTitle>Protection par Permission</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionGate
            permission="manage_users"
            fallback={<p className="text-red-500">❌ Accès refusé - Permission manage_users requise</p>}
          >
            <div className="space-y-2">
              <p className="text-green-600">✅ Accès autorisé - Vous pouvez gérer les utilisateurs</p>
              <Button onClick={handleDeleteUser}>
                Supprimer un utilisateur
              </Button>
            </div>
          </PermissionGate>
        </CardContent>
      </Card>

      {/* Exemple 2: Protection par permissions multiples */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Multiples (OU logique)</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionGate
            permissions={['view_analytics', 'manage_content']}
            requireAll={false}
            fallback={<p className="text-red-500">❌ Vous devez avoir au moins une des permissions : view_analytics OU manage_content</p>}
          >
            <p className="text-green-600">✅ Vous avez accès aux analytics ou à la gestion de contenu</p>
          </PermissionGate>
        </CardContent>
      </Card>

      {/* Exemple 3: Protection stricte (ET logique) */}
      <Card>
        <CardHeader>
          <CardTitle>Permissions Multiples (ET logique)</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionGate
            permissions={['manage_users', 'view_analytics']}
            requireAll={true}
            fallback={<p className="text-red-500">❌ Vous devez avoir manage_users ET view_analytics</p>}
          >
            <p className="text-green-600">✅ Vous avez toutes les permissions requises</p>
          </PermissionGate>
        </CardContent>
      </Card>

      {/* Exemple 4: Affichage conditionnel par rôle */}
      <Card>
        <CardHeader>
          <CardTitle>Affichage par Rôle</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleSwitch
            adminComponent={
              <div className="p-4 bg-blue-100 rounded">
                <h3 className="font-bold text-blue-800">Interface Administrateur</h3>
                <p>Vous avez accès aux outils d'administration</p>
                {isSuperAdmin && (
                  <div className="mt-2 p-2 bg-purple-100 rounded">
                    <p className="text-purple-800">🔥 Outils Super Admin disponibles</p>
                    <Button
                      onClick={() => handlePromoteUser('user-123', 'admin')}
                      disabled={isPromoting}
                      className="mt-2"
                    >
                      {isPromoting ? 'Promotion...' : 'Promouvoir un utilisateur'}
                    </Button>
                  </div>
                )}
              </div>
            }
            ecpComponent={
              <div className="p-4 bg-green-100 rounded">
                <h3 className="font-bold text-green-800">Interface ECP</h3>
                <p>Outils de gestion de contenu éducatif</p>
              </div>
            }
            pdpComponent={
              <div className="p-4 bg-orange-100 rounded">
                <h3 className="font-bold text-orange-800">Interface PDP</h3>
                <p>Outils de développement professionnel</p>
              </div>
            }
            individualComponent={
              <div className="p-4 bg-gray-100 rounded">
                <h3 className="font-bold text-gray-800">Interface Utilisateur</h3>
                <p>Profil personnel et certifications</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* Exemple 5: Vérifications synchrones pour l'UI */}
      <Card>
        <CardHeader>
          <CardTitle>Vérifications Synchrones (Performance UI)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Permissions visibles immédiatement :</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={canSync('view_profile') ? 'text-green-600' : 'text-red-500'}>
                {canSync('view_profile') ? '✅' : '❌'} Voir le profil
              </li>
              <li className={canSync('manage_users') ? 'text-green-600' : 'text-red-500'}>
                {canSync('manage_users') ? '✅' : '❌'} Gérer les utilisateurs
              </li>
              <li className={canSync('view_analytics') ? 'text-green-600' : 'text-red-500'}>
                {canSync('view_analytics') ? '✅' : '❌'} Voir les analytics
              </li>
              <li className={canSync('manage_content') ? 'text-green-600' : 'text-red-500'}>
                {canSync('manage_content') ? '✅' : '❌'} Gérer le contenu
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Exemple 6: Loading states */}
      <Card>
        <CardHeader>
          <CardTitle>États de Chargement</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionGate
            permission="manage_users"
            loading={<LoadingSpinner size="sm" message="Vérification des permissions..." fullScreen={false} />}
            fallback={<p className="text-red-500">❌ Chargement terminé - Accès refusé</p>}
          >
            <p className="text-green-600">✅ Chargement terminé - Accès autorisé</p>
          </PermissionGate>
        </CardContent>
      </Card>
    </div>
  );
}