import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { authReducer, authApi } from '@/features/auth';
import { dicomReducer, dicomApi } from '@/features/dicom';
import { usersApi } from '@/features/users';
import { analyticsApi } from '@/features/analytics';
import { lmsApi } from '@/features/lms';
import { assessmentsApi } from '@/features/assessments';
import { dashboardApi } from '@/features/dashboard';
import { annotationTasksApi } from '@/features/annotationTasks';

/**
 * Root reducer combining all slices
 * Add new reducers here as we build more features
 */
const rootReducer = combineReducers({
  // Feature slices
  auth: authReducer,
  dicom: dicomReducer,

  // RTK Query API reducers
  [authApi.reducerPath]: authApi.reducer,
  [dicomApi.reducerPath]: dicomApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [analyticsApi.reducerPath]: analyticsApi.reducer,
  [lmsApi.reducerPath]: lmsApi.reducer,
  [assessmentsApi.reducerPath]: assessmentsApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
  [annotationTasksApi.reducerPath]: annotationTasksApi.reducer,
});

/**
 * Create the Redux store
 */
export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          // Ignore these action types for serialization check
          ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        },
      }).concat(
        // Add RTK Query middleware
        authApi.middleware,
        dicomApi.middleware,
        usersApi.middleware,
        analyticsApi.middleware,
        lmsApi.middleware,
        assessmentsApi.middleware,
        dashboardApi.middleware,
        annotationTasksApi.middleware
      ),
    devTools: process.env.NODE_ENV !== 'production',
  });
};

// Create a store instance for type inference
const store = makeStore();

// Export types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = ReturnType<typeof makeStore>;

// Export store hooks
export { useAppDispatch, useAppSelector } from './hooks';
