import { useSelector } from 'react-redux';
import { RootState } from '../store';

export const usePermissions = () => {
  const permissions = useSelector((state: RootState) => state.permissions);

  const hasPermission = (module: string, action: string): boolean => {
    return permissions.userPermissions.some(
      permission =>
        permission.module === module && permission.action === action && permission.allowed
    );
  };

  return {
    permissions: permissions.userPermissions,
    hasPermission,
    loading: permissions.loading,
    error: permissions.error,
  };
};
