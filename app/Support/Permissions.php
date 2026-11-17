<?php

namespace App\Support;

/**
 * Single source of truth for CMS permissions ("module.action") and default roles.
 */
final class Permissions
{
    public const SUPER_ADMIN = 'super-admin';

    /** module => actions */
    public const MODULES = [
        'dashboard' => ['view'],
        'pages' => ['view', 'create', 'update', 'delete', 'publish'],
        'services' => ['view', 'create', 'update', 'delete', 'publish'],
        'portfolios' => ['view', 'create', 'update', 'delete', 'publish'],
        'companies' => ['view', 'create', 'update', 'delete', 'publish'],
        'success_stories' => ['view', 'create', 'update', 'delete', 'publish'],
        'gallery' => ['view', 'create', 'update', 'delete', 'publish'],
        'company_profile' => ['view', 'create', 'update', 'delete', 'publish'],
        'countries' => ['view', 'create', 'update', 'delete'],
        'contact_messages' => ['view', 'update', 'delete'],
        'menus' => ['view', 'create', 'update', 'delete'],
        'seo' => ['view', 'update'],
        'media' => ['view', 'create', 'update', 'delete'],
        'users' => ['view', 'create', 'update', 'delete'],
        'roles' => ['view', 'create', 'update', 'delete'],
        'settings' => ['view', 'update'],
        'activity_logs' => ['view'],
    ];

    /** @return list<string> */
    public static function all(): array
    {
        $out = [];
        foreach (self::MODULES as $module => $actions) {
            foreach ($actions as $action) {
                $out[] = "{$module}.{$action}";
            }
        }

        return $out;
    }

    /** @return array<string, list<string>> role => permissions (super-admin bypasses via Gate::before) */
    public static function defaultRoles(): array
    {
        $all = self::all();
        $system = ['users.', 'roles.'];
        $content = ['pages', 'services', 'portfolios', 'companies', 'success_stories', 'gallery', 'company_profile', 'countries', 'menus', 'seo', 'media'];

        $editor = ['dashboard.view', 'contact_messages.view', 'contact_messages.update'];
        foreach ($content as $module) {
            foreach (self::MODULES[$module] as $action) {
                if (! in_array($action, ['delete', 'publish'], true)) {
                    $editor[] = "{$module}.{$action}";
                }
            }
        }

        return [
            self::SUPER_ADMIN => [],
            'admin' => array_values(array_filter($all, fn ($p) => ! str_starts_with($p, $system[0]) && ! str_starts_with($p, $system[1]))),
            'editor' => $editor,
            'viewer' => array_values(array_filter($all, fn ($p) => str_ends_with($p, '.view') && ! in_array($p, ['users.view', 'roles.view', 'activity_logs.view'], true))),
        ];
    }
}
