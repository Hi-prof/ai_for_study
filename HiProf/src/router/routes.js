import { sharedRoutes, fallbackRoutes } from './modules/shared';
import { teacherRoutes } from './modules/teacher';
import { studentRoutes } from './modules/student';

const routes = [
  ...sharedRoutes,
  ...teacherRoutes,
  ...studentRoutes,
  ...fallbackRoutes
];

export default routes;
