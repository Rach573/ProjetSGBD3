import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import MonEspace from './pages/MonEspace.vue';
import Admin from './pages/Admin.vue';
import AdminMail from './pages/AdminMail.vue';
import Login from './pages/Login.vue';
import MailDetail from './pages/MailDetail.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/mon-espace' },
  { path: '/mon-espace', component: MonEspace },
  { path: '/admin', component: Admin },
  { path: '/admin-mails', component: AdminMail },
  { path: '/login', component: Login },
  { path: '/mails/:id', component: MailDetail }
];

export const router = createRouter({ routes, history: createMemoryHistory() });

// Simple client-side auth guard: redirect to /login when no current user
router.beforeEach((to, from, next) => {
  const publicPaths = ['/login'];
  const currentUser = localStorage.getItem('sd_currentUser');

  if (!currentUser && !publicPaths.includes(to.path)) {
    return next('/login');
  }

  const parsed = currentUser ? JSON.parse(currentUser) : null;
  if (parsed && to.path === '/login') {
    return next(parsed.role === 'admin' ? '/admin' : '/mon-espace');
  }

  const adminOnly = ['/admin', '/admin-mails'];
  if (adminOnly.includes(to.path) && (!parsed || parsed.role !== 'admin')) {
    return next('/mon-espace');
  }

  return next();
});
