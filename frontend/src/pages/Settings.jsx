import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, CreditCard, Palette, Package, Users, CheckCircle2, Sun, Moon, Sparkles, ArrowUpCircle, ArrowDownCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader, LoadingSpinner, Modal } from '../components/ui';
import api from '../lib/api';
import { formatDate, formatCurrency } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user, plan, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [changing, setChanging] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => setDashData(data)).finally(() => setLoading(false));
    api.get('/auth/plans').then(({ data }) => setPlans(data)).catch(() => {});
  }, []);

  const handleChangePlan = async () => {
    if (!confirmPlan) return;
    setChanging(true);
    try {
      const { data } = await api.post('/billing/change-plan', { planId: confirmPlan.id });
      // Empresa sem subscrição Stripe → redireciona para Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      await refreshUser();
      toast.success(data.message || `Plano alterado para ${confirmPlan.name}`);
      setConfirmPlan(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao mudar plano');
    } finally {
      setChanging(false);
    }
  };

  if (loading) return <LoadingSpinner size="lg" />;

  const productsUsed = dashData?.stockStats?.total || 0;
  const productsMax = plan?.max_products === -1 ? '∞' : (plan?.max_products || 0);
  const productsPct = plan?.max_products === -1 ? 0 : Math.min(100, (productsUsed / (plan?.max_products || 1)) * 100);

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Definições"
        subtitle="Gerir a sua empresa, plano e aparência da aplicação."
      />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Plano */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 card p-6 relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-red-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-red-500 mb-1">
                  <Sparkles size={14} /> Plano atual
                </div>
                <h3 className="font-display text-3xl font-bold">{plan?.name}</h3>
                <p className="text-sm text-neutral-500 mt-1">{plan?.description}</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-500">Mensalidade</div>
                <div className="text-2xl font-bold text-brand-red-500">{formatCurrency(plan?.price || 0)}</div>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold flex items-center gap-1"><Package size={14}/> Produtos</span>
                  <span className="text-neutral-500">{productsUsed} / {productsMax}</span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${productsPct}%` }}
                    transition={{ duration: 0.8 }}
                    className={`h-full rounded-full ${productsPct > 80 ? 'bg-brand-red-500' : productsPct > 50 ? 'bg-brand-yellow-500' : 'bg-green-500'}`}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold flex items-center gap-1"><Users size={14}/> Utilizadores</span>
                  <span className="text-neutral-500">
                    {user?.companyUsers || '-'} / {plan?.max_employees === -1 ? '∞' : plan?.max_employees}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
              <h4 className="text-sm font-bold mb-3">Incluído no plano</h4>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                {(plan?.features || []).map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Empresa */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="card p-6 h-fit">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand-red-500 flex items-center justify-center text-white">
              <Building2 size={20} />
            </div>
            <h3 className="font-bold">Empresa</h3>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Nome</dt>
              <dd className="font-semibold">{user?.companyName}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Administrador</dt>
              <dd>{user?.name}</dd>
              <dd className="text-neutral-500 text-xs break-all">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-neutral-500 mb-1">Subscrito em</dt>
              <dd>{user?.companyCreatedAt ? formatDate(user.companyCreatedAt) : '-'}</dd>
            </div>
          </dl>
        </motion.div>

        {/* Aparência */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card p-6 lg:col-span-3">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-10 w-10 rounded-xl bg-brand-yellow-500 flex items-center justify-center text-neutral-900">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="font-bold">Aparência</h3>
              <p className="text-xs text-neutral-500">Escolha o tema da aplicação</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                theme === 'light'
                  ? 'border-brand-red-500 ring-2 ring-brand-red-200 dark:ring-brand-red-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <div className="h-24 rounded-xl bg-gradient-to-br from-white to-neutral-100 border border-neutral-200 mb-3 relative overflow-hidden">
                <div className="absolute top-2 left-2 right-2 h-2 bg-neutral-200 rounded" />
                <div className="absolute top-6 left-2 w-12 h-8 bg-brand-red-500 rounded" />
                <div className="absolute top-6 left-16 right-2 h-2 bg-neutral-300 rounded" />
                <div className="absolute top-10 left-16 right-6 h-2 bg-neutral-200 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <Sun size={16} /> Modo claro
                </div>
                {theme === 'light' && <CheckCircle2 size={18} className="text-brand-red-500" />}
              </div>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`relative p-5 rounded-2xl border-2 transition-all text-left ${
                theme === 'dark'
                  ? 'border-brand-red-500 ring-2 ring-brand-red-200 dark:ring-brand-red-900'
                  : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
              }`}
            >
              <div className="h-24 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 mb-3 relative overflow-hidden">
                <div className="absolute top-2 left-2 right-2 h-2 bg-neutral-700 rounded" />
                <div className="absolute top-6 left-2 w-12 h-8 bg-brand-red-500 rounded" />
                <div className="absolute top-6 left-16 right-2 h-2 bg-neutral-600 rounded" />
                <div className="absolute top-10 left-16 right-6 h-2 bg-neutral-700 rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <Moon size={16} /> Modo escuro
                </div>
                {theme === 'dark' && <CheckCircle2 size={18} className="text-brand-red-500" />}
              </div>
            </button>
          </div>
        </motion.div>

        {/* Planos disponíveis */}
        {user?.role === 'admin' && plans.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="card p-6 lg:col-span-3">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-red-500 to-brand-yellow-500 flex items-center justify-center text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold">Mudar de plano</h3>
                <p className="text-xs text-neutral-500">Faça upgrade ou downgrade da sua subscrição (simulado)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((p) => {
                const isCurrent = p.id === plan?.id;
                const isUpgrade = (p.price || 0) > (plan?.price || 0);
                return (
                  <div
                    key={p.id}
                    className={`relative p-5 rounded-2xl border-2 transition-all ${
                      isCurrent
                        ? 'border-brand-red-500 bg-brand-red-50 dark:bg-brand-red-900/10 ring-2 ring-brand-red-200 dark:ring-brand-red-900'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-2 left-5 px-2 py-0.5 bg-brand-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                        Atual
                      </div>
                    )}
                    <div className="font-display text-2xl font-bold">{p.name}</div>
                    <div className="mt-1 text-brand-red-500 font-bold">
                      {formatCurrency(p.price || 0)}<span className="text-xs text-neutral-500 font-normal">/mês</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2 min-h-[32px]">{p.description}</p>
                    <ul className="mt-3 space-y-1.5 text-xs">
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-green-500" />
                        {p.max_products === -1 ? 'Produtos ilimitados' : `${p.max_products} produtos`}
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check size={12} className="text-green-500" />
                        {p.max_employees === -1 ? 'Utilizadores ilimitados' : `${p.max_employees} utilizadores`}
                      </li>
                      {(p.features || []).slice(0, 3).map((f) => (
                        <li key={f} className="flex items-center gap-1.5">
                          <Check size={12} className="text-green-500" />
                          <span className="truncate">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      disabled={isCurrent}
                      onClick={() => setConfirmPlan(p)}
                      className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full font-semibold text-sm transition ${
                        isCurrent
                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                          : isUpgrade
                          ? 'bg-brand-red-500 text-white hover:bg-brand-red-600'
                          : 'border-2 border-neutral-200 dark:border-neutral-700 hover:border-brand-red-500 hover:text-brand-red-500'
                      }`}
                    >
                      {isCurrent ? (
                        'Plano atual'
                      ) : isUpgrade ? (
                        <><ArrowUpCircle size={14} /> Upgrade</>
                      ) : (
                        <><ArrowDownCircle size={14} /> Downgrade</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Subscription */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card p-6 lg:col-span-3 bg-gradient-to-br from-brand-yellow-50 to-brand-red-50 dark:from-brand-yellow-900/10 dark:to-brand-red-900/10 border-brand-yellow-200 dark:border-brand-yellow-800">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-yellow-500 to-brand-red-500 flex items-center justify-center text-white">
              <CreditCard size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold">Subscrição ativa</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                A sua subscrição do plano <strong>{plan?.name}</strong> está ativa. Esta é uma PAP de demonstração — o pagamento é simulado.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Modal
        open={!!confirmPlan}
        onClose={() => !changing && setConfirmPlan(null)}
        title="Confirmar mudança de plano"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50">
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-neutral-500">Atual</div>
              <div className="font-bold">{plan?.name}</div>
              <div className="text-xs text-neutral-500">{formatCurrency(plan?.price || 0)}/mês</div>
            </div>
            <ArrowUpCircle size={22} className="text-brand-red-500" />
            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-brand-red-500">Novo</div>
              <div className="font-bold">{confirmPlan?.name}</div>
              <div className="text-xs text-neutral-500">{formatCurrency(confirmPlan?.price || 0)}/mês</div>
            </div>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Vai passar do plano <strong>{plan?.name}</strong> para <strong>{confirmPlan?.name}</strong>. As novas funcionalidades e limites ficam ativos imediatamente. (Pagamento simulado — PAP de demonstração.)
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setConfirmPlan(null)}
              disabled={changing}
              className="btn-ghost !py-2 !px-4 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleChangePlan}
              disabled={changing}
              className="px-4 py-2 bg-brand-red-500 text-white rounded-full font-semibold hover:bg-brand-red-600 transition disabled:opacity-50"
            >
              {changing ? 'A mudar...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
