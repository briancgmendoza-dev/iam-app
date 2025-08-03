import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth-slice';
import usersReducer from './users-slice';
import groupsReducer from './groups-slice';
import rolesReducer from './roles-slice';
import modulesReducer from './modules-slice';
import permissionsReducer from './permissions-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    groups: groupsReducer,
    roles: rolesReducer,
    modules: modulesReducer,
    permissions: permissionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
