export default [
  {
    path: '/sri/inbox',
    name: 'sri-inbox',
    component: () => import('../ui/SriInboxView.vue'),
    meta: { requiresAuth: true, permission: 'accounting.inbox' }
  },
  {
    path: '/sri/tax-forms',
    name: 'sri-tax-forms',
    component: () => import('../ui/TaxFormsView.vue'),
    meta: { requiresAuth: true, permission: 'accounting.taxforms' }
  }
]
