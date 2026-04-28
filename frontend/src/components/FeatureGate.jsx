import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { planHasFeature, FEATURE_LABEL, FEATURE_DESC, MIN_PLAN_FOR } from '../lib/planFeatures';

export default function FeatureGate({ feature, children }) {
  const { plan } = useAuth();
  const planName = plan?.name;
  const allowed = planName && planHasFeature(planName, feature);

  if (allowed) return children;

  const required = MIN_PLAN_FOR[feature];
  const label = FEATURE_LABEL[feature];
  const desc = FEATURE_DESC[feature];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-red-500 via-brand-red-600 to-brand-red-700 text-white p-8 md:p-12 text-center"
      >
        <div className="absolute inset-0 bg-noise opacity-20" />
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-yellow-500/40 rounded-full blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-yellow-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white/15 backdrop-blur border border-white/20 mb-8">
            <Lock size={28} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-yellow-500 text-neutral-900 text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles size={12} /> Disponível no plano {required}
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
            {label}
          </h1>
          <p className="mt-3 text-white/90 max-w-lg mx-auto">
            {desc}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 inline-flex items-center gap-4">
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-white/70 font-bold">Plano atual</div>
              <div className="font-bold">{planName || '—'}</div>
            </div>
            <ArrowRight size={20} className="text-white/60" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-brand-yellow-300 font-bold">Necessário</div>
              <div className="font-bold">{required}</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/app/settings"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-red-600 rounded-full font-semibold hover:bg-brand-yellow-300 transition text-sm"
            >
              Ver o meu plano <ArrowRight size={16} />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur border border-white/20 rounded-full font-semibold hover:bg-white/20 transition text-sm"
            >
              Comparar planos
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
