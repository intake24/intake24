import { defineStore } from 'pinia';
import { httpService } from '@intake24/admin/services';
import type { AdminTokenPayload } from '@intake24/common/security';
import type { AdminUserProfile } from '@intake24/common/types/http/admin';
import { tokenService } from '@intake24/ui/services';
import type { Permission } from '@intake24/ui/types';
import { useResource } from './resource';

export interface UserState extends Pick<AdminUserProfile, 'aal' | 'permissions' | 'roles'> {
  payload: AdminTokenPayload | null;
  profile: AdminUserProfile['profile'] | null;
}

export const useUser = defineStore('user', {
  state: (): UserState => ({
    payload: null,
    profile: null,
    aal: false,
    permissions: [],
    roles: [],
  }),
  getters: {
    isAalSatisfied: state => state.aal,
    isVerified: state => !!state.payload?.verified,
    loaded: state => !!state.profile,
  },
  actions: {
    can(permission: string | string[] | Permission, strict = false) {
      if (!this.isVerified || !this.isAalSatisfied)
        return false;

      if (typeof permission === 'string')
        return this.permissions.includes(permission);

      if (Array.isArray(permission)) {
        return strict
          ? permission.every(item => this.permissions.includes(item))
          : permission.some(item => this.permissions.includes(item));
      }

      const { name } = useResource();
      const { resource = name, action, ownerId, securables = [] } = permission;

      if (resource.startsWith('user.'))
        return true;

      if (action) {
        if (this.permissions.includes(`${resource}:${action}`))
          return true;

        if (securables.length && !!securables.find(securable => securable.action === action))
          return true;
      }

      if (ownerId && ownerId === this.profile?.id)
        return true;

      return false;
    },

    async request() {
      const {
        data: { aal, profile, permissions, roles },
      } = await httpService.get<AdminUserProfile>('admin/user', { withLoading: true });

      this.aal = aal;
      this.profile = { ...profile };
      this.permissions = [...permissions];
      this.roles = [...roles];
    },

    loadPayload(accessToken: string) {
      this.payload = tokenService.decodeAccessToken<AdminTokenPayload>(accessToken, 'admin');
    },
  },
});

export type UserStoreDef = typeof useUser;

export type UserStore = ReturnType<UserStoreDef>;
