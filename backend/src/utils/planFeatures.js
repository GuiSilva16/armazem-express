// Mapa de funcionalidades por nome de plano. Fonte única de verdade para o gate.
// Manter em sincronia com frontend/src/lib/planFeatures.js

export const PLAN_FEATURES = {
  Starter: {
    qr_scanner: false,
    activity_log: false,
    csv_export: false,
    advanced_reports: false,
    api_access: false,
    multi_warehouse: false
  },
  Business: {
    qr_scanner: true,
    activity_log: true,
    csv_export: true,
    advanced_reports: false,
    api_access: false,
    multi_warehouse: false
  },
  Enterprise: {
    qr_scanner: true,
    activity_log: true,
    csv_export: true,
    advanced_reports: true,
    api_access: true,
    multi_warehouse: true
  }
};

export const FEATURE_LABEL = {
  qr_scanner: 'QR Scanner',
  activity_log: 'Registo de Atividade',
  csv_export: 'Exportar CSV',
  advanced_reports: 'Relatórios Avançados',
  api_access: 'API de Integração',
  multi_warehouse: 'Multi-armazém'
};

export const MIN_PLAN_FOR = {
  qr_scanner: 'Business',
  activity_log: 'Business',
  csv_export: 'Business',
  advanced_reports: 'Enterprise',
  api_access: 'Enterprise',
  multi_warehouse: 'Enterprise'
};

export function planHasFeature(planName, feature) {
  return !!PLAN_FEATURES[planName]?.[feature];
}
