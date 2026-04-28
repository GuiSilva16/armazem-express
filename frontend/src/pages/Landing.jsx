import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  Package,
  Truck,
  BarChart3,
  QrCode,
  Shield,
  Zap,
  Users,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Globe,
  Sun,
  Moon,
  Mail,
  MapPin,
  Phone,
  Github,
  Linkedin
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import { Modal } from '../components/ui';
import api from '../lib/api';
import { useTheme } from '../context/ThemeContext';

export default function Landing() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [form, setForm] = useState({ companyName: '', email: '' });
  const { theme, toggleTheme } = useTheme();
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    api.get('/auth/plans').then(({ data }) => setPlans(data));
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    setSubscribing(true);
    try {
      const { data } = await api.post('/billing/checkout', {
        ...form,
        planId: selectedPlan.id
      });
      // Redireciona para Stripe Checkout
      window.location.href = data.url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao iniciar pagamento');
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-neutral-200/50 dark:border-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center cursor-pointer"
            aria-label="Voltar ao topo"
          >
            <Logo size="md" />
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <a href="#features" className="hover:text-brand-red-500 transition">Funcionalidades</a>
            <a href="#pricing" className="hover:text-brand-red-500 transition">Planos</a>
            <a href="#about" className="hover:text-brand-red-500 transition">Sobre</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              aria-label="Alternar tema"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </AnimatePresence>
            </button>
            <Link to="/login" className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold hover:text-brand-red-500 transition">
              Entrar
            </Link>
            <a href="#pricing" className="btn-primary !py-2 !px-4 text-sm">
              Começar agora
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Imagem de fundo de armazém */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=1920)'
          }}
        />
        <div className="absolute inset-0 bg-white/50 dark:bg-neutral-950/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white dark:via-neutral-950/40 dark:to-neutral-950" />
        {/* Background decoration */}
        <div className="absolute inset-0 mesh-gradient opacity-30" />
        <motion.div
          style={{ y: heroY }}
          className="absolute top-20 -right-20 w-96 h-96 bg-brand-yellow-500/30 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: heroY }}
          className="absolute top-40 -left-20 w-96 h-96 bg-brand-red-500/20 rounded-full blur-3xl"
        />

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 lg:px-8"
        >
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[0.95] tracking-tight"
              >
                O seu armazém{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 gradient-text">inteligente.</span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="absolute bottom-2 left-0 right-0 h-3 bg-brand-yellow-300 dark:bg-brand-yellow-700/40 -z-0 origin-left"
                  />
                </span>
                <br />
                Fora do papel.
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 text-lg lg:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl leading-relaxed"
              >
                Chega de folhas de Excel desatualizadas. O <strong>Armazém Express</strong> dá às PMEs portuguesas uma ferramenta moderna para gerir stock, expedições e rastreio em tempo real — tudo num só sítio.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <a href="#pricing" className="btn-primary">
                  Escolher plano
                  <ArrowRight size={18} />
                </a>
                <a href="#features" className="btn-ghost">
                  Ver funcionalidades
                </a>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-10 flex flex-wrap items-center gap-6 text-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Sem contratos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Setup em 2 min</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-neutral-600 dark:text-neutral-400">Dados seguros</span>
                </div>
              </motion.div>
            </div>

            {/* Hero visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow-400 to-brand-red-500 rounded-[3rem] rotate-6 blur-2xl opacity-30" />
                <div className="relative bg-white dark:bg-neutral-900 rounded-[2rem] p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 rotate-3 hover:rotate-0 transition-transform duration-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-brand-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-brand-red-500 flex items-center justify-center">
                          <Package size={16} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold">Total Produtos</span>
                      </div>
                      <motion.span
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl font-bold text-brand-red-500"
                      >
                        1,247
                      </motion.span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Em Stock', 'Baixo', 'Sem Stock'].map((l, i) => (
                        <div key={l} className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-center">
                          <div className={`text-lg font-bold ${i === 0 ? 'text-green-500' : i === 1 ? 'text-brand-yellow-500' : 'text-brand-red-500'}`}>
                            {[1180, 52, 15][i]}
                          </div>
                          <div className="text-[10px] text-neutral-500">{l}</div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gradient-to-r from-brand-red-500 to-brand-yellow-500 rounded-xl text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs opacity-90">Encomendas hoje</div>
                          <div className="text-2xl font-bold">47</div>
                        </div>
                        <TrendingUp size={28} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { n: 'AE1234567890PT', s: 'delivered' },
                        { n: 'AE9876543210PT', s: 'in_transit' },
                        { n: 'AE4567890123PT', s: 'pending' }
                      ].map((o, i) => (
                        <motion.div
                          key={o.n}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.8 + i * 0.15 }}
                          className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-xs"
                        >
                          <span className="font-mono">{o.n}</span>
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            o.s === 'delivered' ? 'bg-green-100 text-green-700' :
                            o.s === 'in_transit' ? 'bg-purple-100 text-purple-700' :
                            'bg-brand-yellow-100 text-brand-yellow-700'
                          }`}>
                            {o.s === 'delivered' ? 'Entregue' : o.s === 'in_transit' ? 'Em trânsito' : 'Pendente'}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -bottom-4 -left-4 bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-xl border border-neutral-200 dark:border-neutral-800 hidden sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-brand-yellow-100 dark:bg-brand-yellow-900/30 flex items-center justify-center">
                      <QrCode size={20} className="text-brand-yellow-600" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">QR Scanner</div>
                      <div className="text-sm font-bold">Ativo</div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute -top-4 -right-4 bg-white dark:bg-neutral-900 rounded-2xl p-4 shadow-xl border border-neutral-200 dark:border-neutral-800 hidden sm:block"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Shield size={20} className="text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-neutral-500">Sistema</div>
                      <div className="text-sm font-bold">99.9% uptime</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* TRUST BAR */}
      <section className="py-8 border-y border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { v: '500+', l: 'PMEs clientes' },
              { v: '2M+', l: 'Produtos geridos' },
              { v: '150k', l: 'Encomendas/mês' },
              { v: '99.9%', l: 'Uptime garantido' }
            ].map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="font-display text-3xl md:text-4xl font-bold text-brand-red-500">{s.v}</div>
                <div className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-1">{s.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 dot-pattern opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-3">
              · Funcionalidades
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Tudo o que o seu armazém precisa.<br />
              <span className="text-neutral-400">Sem tudo o que não precisa.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Package, title: 'Gestão de Stock', desc: 'Adicione, remova e consulte produtos com filtros por categoria, estado e prateleira. Alertas automáticos de stock baixo.', color: 'red' },
              { icon: Truck, title: 'Expedição de Encomendas', desc: 'Registe envios com validação de contactos PT, baixa automática de stock e geração de tracking.', color: 'yellow' },
              { icon: QrCode, title: 'QR Code Scanner', desc: 'Cada produto tem o seu QR. Os funcionários digitalizam com o telemóvel para identificar e movimentar.', color: 'red' },
              { icon: BarChart3, title: 'Dashboard em Tempo Real', desc: 'Veja indicadores, gráficos de movimento, produtos a acabar e encomendas pendentes num só ecrã.', color: 'yellow' },
              { icon: Users, title: 'Contas de Equipa', desc: 'Admin controla, funcionários operam. Cada um com o seu login e permissões adequadas.', color: 'red' },
              { icon: Globe, title: 'Rastreio Transparente', desc: 'Cada encomenda tem histórico completo de movimentação. Os seus clientes sabem onde está o produto.', color: 'yellow' }
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className="group relative p-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-brand-red-500/50 transition-all"
              >
                <div className={`h-12 w-12 rounded-xl ${f.color === 'red' ? 'bg-brand-red-500' : 'bg-brand-yellow-500'} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY — imagens reais de armazéns */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-3">
              · Operações reais
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Feito para o{' '}
              <span className="gradient-text">dia-a-dia</span>{' '}
              do seu armazém.
            </h2>
            <p className="mt-4 text-neutral-600 dark:text-neutral-400 text-lg">
              Do corredor de paletes ao último quilómetro. Uma ferramenta que acompanha o ritmo de quem trabalha no terreno.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                src: 'https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=900',
                label: 'Gestão de Stock',
                tag: 'Corredores e prateleiras',
                span: 'md:col-span-2 md:row-span-2 aspect-square'
              },
              {
                src: 'https://images.pexels.com/photos/5025669/pexels-photo-5025669.jpeg?auto=compress&cs=tinysrgb&w=600',
                label: 'Produtos etiquetados',
                tag: 'SKU + QR',
                span: 'aspect-square'
              },
              {
                src: 'https://images.pexels.com/photos/4481326/pexels-photo-4481326.jpeg?auto=compress&cs=tinysrgb&w=600',
                label: 'Expedição',
                tag: 'Preparação de carga',
                span: 'aspect-square'
              },
              {
                src: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=600',
                label: 'Logística',
                tag: 'Última milha',
                span: 'aspect-square'
              },
              {
                src: 'https://images.pexels.com/photos/4484078/pexels-photo-4484078.jpeg?auto=compress&cs=tinysrgb&w=600',
                label: 'Equipa em ação',
                tag: 'Funcionários conectados',
                span: 'aspect-square'
              }
            ].map((img, i) => (
              <motion.div
                key={img.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group relative overflow-hidden rounded-2xl bg-neutral-200 dark:bg-neutral-800 ${img.span}`}
              >
                <img
                  src={img.src}
                  alt={img.label}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-yellow-300 mb-0.5">
                    {img.tag}
                  </div>
                  <div className="text-sm md:text-base font-bold text-white">
                    {img.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900/50">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-3">
              · Como funciona
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              3 passos. Zero fricção.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                n: '01',
                title: 'Escolha o plano',
                desc: 'Comece com o Starter se for pequeno, ou salte para Business se precisar de mais.',
                img: 'https://images.pexels.com/photos/4484078/pexels-photo-4484078.jpeg?auto=compress&cs=tinysrgb&w=800'
              },
              {
                n: '02',
                title: 'Receba credenciais',
                desc: 'Criamos a conta da sua empresa e geramos uma password forte automaticamente.',
                img: 'https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=800'
              },
              {
                n: '03',
                title: 'Digitalize tudo',
                desc: 'Entre no painel, adicione produtos, convide a equipa e comece a gerir em minutos.',
                img: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg?auto=compress&cs=tinysrgb&w=800'
              }
            ].map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-6 group">
                  <img
                    src={step.img}
                    alt={step.title}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-xs font-bold text-brand-red-500">
                    Passo {step.n}
                  </div>
                </div>
                <div className="font-display text-7xl font-bold text-brand-red-500/10 leading-none mb-3">
                  {step.n}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SPOTLIGHT — alternating image+text (Apple-style) */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-3">
              · Em destaque
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Pensado para quem trabalha,<br />
              <span className="text-neutral-400">não para quem instala software.</span>
            </h2>
          </div>

          <div className="space-y-24 lg:space-y-32">
            {[
              {
                tag: 'Stock em tempo real',
                title: 'Cada movimento. Cada produto. Visível.',
                desc: 'Adicione, retire ou ajuste quantidades com um clique. O sistema guarda tudo num histórico auditável e alerta-o quando o stock está a acabar — antes que perca uma venda.',
                img: 'https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=1200',
                bullets: ['Alertas automáticos de stock baixo', 'Histórico completo de movimentos', 'Edição inline rápida'],
                reverse: false
              },
              {
                tag: 'Expedição rápida',
                title: 'Da preparação à entrega,\nsem perder o fio à meada.',
                desc: 'Crie encomendas com validação automática de contactos portugueses, gera tracking number único e desconta o stock automaticamente. O cliente recebe atualizações sem o seu esforço.',
                img: 'https://images.pexels.com/photos/4481326/pexels-photo-4481326.jpeg?auto=compress&cs=tinysrgb&w=1200',
                bullets: ['Validação de telefone e código postal PT', 'Tracking number AE+12 dígitos', 'Stepper visual de progresso'],
                reverse: true
              },
              {
                tag: 'Etiquetagem e QR',
                title: 'Cada caixa identificada.\nCada SKU localizável.',
                desc: 'Cada produto recebe um SKU e um QR Code únicos. Os funcionários apontam a câmara do telemóvel, abre os detalhes em segundos. Sem instalar app, sem treinos demorados.',
                img: 'https://images.pexels.com/photos/5025669/pexels-photo-5025669.jpeg?auto=compress&cs=tinysrgb&w=1200',
                bullets: ['QR Scanner com câmara nativa', 'SKU automático por produto', 'Etiquetas prontas a imprimir'],
                reverse: false
              }
            ].map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${s.reverse ? 'lg:[&>*:first-child]:order-2' : ''}`}
              >
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-4">
                    {s.tag}
                  </div>
                  <h3 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight whitespace-pre-line mb-6">
                    {s.title}
                  </h3>
                  <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-6">
                    {s.desc}
                  </p>
                  <ul className="space-y-3">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <CheckCircle2 size={20} className="text-brand-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-neutral-700 dark:text-neutral-300">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-yellow-400/30 to-brand-red-500/30 rounded-[2rem] blur-2xl" />
                  <div className="relative aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
                    <img
                      src={s.img}
                      alt={s.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-red-500 mb-3">
              · Planos
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
              Preços honestos. Sem surpresas.
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-lg">
              Assinatura mensal. Cancela quando quiser.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, i) => {
              const isPopular = plan.name === 'Business';
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-3xl p-8 ${
                    isPopular
                      ? 'bg-gradient-to-br from-brand-red-500 to-brand-red-600 text-white shadow-brand scale-105 lg:scale-110'
                      : 'bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-brand-yellow-500 text-neutral-900 rounded-full text-xs font-bold uppercase tracking-wider">
                      Mais popular
                    </div>
                  )}
                  <div className="mb-6">
                    <div className={`text-sm font-bold uppercase tracking-widest ${isPopular ? 'text-brand-yellow-300' : 'text-brand-red-500'} mb-2`}>
                      {plan.name}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-display text-5xl font-bold">{Math.floor(plan.price)}</span>
                      <span className="font-display text-2xl font-bold">,{String(Math.round((plan.price % 1) * 100)).padStart(2, '0')}</span>
                      <span className="text-2xl ml-1">€</span>
                      <span className={`${isPopular ? 'text-white/70' : 'text-neutral-500'} ml-1`}>/mês</span>
                    </div>
                    <p className={`text-sm mt-3 ${isPopular ? 'text-white/90' : 'text-neutral-600 dark:text-neutral-400'}`}>
                      {plan.description}
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={18} className={`flex-shrink-0 mt-0.5 ${isPopular ? 'text-brand-yellow-300' : 'text-green-500'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full py-3 rounded-full font-semibold transition ${
                      isPopular
                        ? 'bg-white text-brand-red-500 hover:bg-brand-yellow-300'
                        : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-brand-red-500 dark:hover:bg-brand-red-500 dark:hover:text-white'
                    }`}
                  >
                    Escolher {plan.name}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ABOUT / SDG */}
      <section id="about" className="py-24 bg-neutral-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-brand-yellow-400 mb-3">
                · Compromisso
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-6">
                Digitalizar com impacto.
              </h2>
              <p className="text-neutral-300 text-lg mb-6 leading-relaxed">
                Alinhados com os Objetivos de Desenvolvimento Sustentável da ONU, ajudamos empresas a modernizar operações, reduzir desperdício e crescer de forma sustentável.
              </p>
              <div className="flex flex-wrap gap-3">
                {['ODS 8', 'ODS 9', 'ODS 12'].map((ods) => (
                  <div key={ods} className="px-4 py-2 rounded-full bg-brand-yellow-500 text-neutral-900 font-bold text-sm">
                    {ods}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: TrendingUp, title: 'Trabalho digno', desc: 'Automatiza tarefas repetitivas.' },
                { icon: Zap, title: 'Inovação', desc: 'Infraestrutura digital para PMEs.' },
                { icon: Shield, title: 'Segurança', desc: 'Dados encriptados e protegidos.' },
                { icon: Package, title: 'Menos desperdício', desc: 'Gestão precisa de inventário.' }
              ].map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-5 bg-white/5 backdrop-blur border border-white/10 rounded-2xl"
                >
                  <c.icon size={24} className="text-brand-yellow-400 mb-3" />
                  <div className="font-bold mb-1">{c.title}</div>
                  <div className="text-sm text-neutral-400">{c.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 bg-gradient-to-br from-brand-yellow-500 via-brand-yellow-400 to-brand-red-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-40" />
        <div className="relative max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-6xl font-bold text-neutral-900 leading-tight"
          >
            Pronto para começar?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-neutral-900/80 max-w-2xl mx-auto"
          >
            Junte-se a centenas de PMEs que já abandonaram o papel e o Excel.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-full font-bold hover:bg-neutral-800 transition shadow-brutal"
            >
              Começar gratuitamente
              <ArrowRight size={20} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-neutral-950 text-neutral-400 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
          {/* Top: 4 colunas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Coluna 1: Marca */}
            <div className="col-span-2 md:col-span-1">
              <Logo size="sm" animated={false} />
              <p className="text-sm mt-4 text-neutral-500 leading-relaxed">
                Sistema de gestão de armazém moderno, pensado para PMEs portuguesas que querem deixar para trás o Excel e o papel.
              </p>
              <div className="flex gap-3 mt-5">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-brand-red-500 hover:text-white transition border border-neutral-800"
                >
                  <Github size={16} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-brand-red-500 hover:text-white transition border border-neutral-800"
                >
                  <Linkedin size={16} />
                </a>
                <a
                  href="mailto:contacto@armazem-express.pt"
                  aria-label="Email"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-neutral-900 hover:bg-brand-red-500 hover:text-white transition border border-neutral-800"
                >
                  <Mail size={16} />
                </a>
              </div>
            </div>

            {/* Coluna 2: Produto */}
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Produto</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#features" className="hover:text-white transition">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Planos</a></li>
                <li><a href="#about" className="hover:text-white transition">Sobre</a></li>
                <li><Link to="/login" className="hover:text-white transition">Entrar</Link></li>
              </ul>
            </div>

            {/* Coluna 3: Recursos */}
            <div>
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Recursos</h3>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#" className="hover:text-white transition">Documentação</a></li>
                <li><a href="#" className="hover:text-white transition">Centro de ajuda</a></li>
                <li><a href="#" className="hover:text-white transition">Política de privacidade</a></li>
                <li><a href="#" className="hover:text-white transition">Termos de utilização</a></li>
              </ul>
            </div>

            {/* Coluna 4: Contactos */}
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Contactos</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <Mail size={16} className="text-brand-yellow-400 mt-0.5 flex-shrink-0" />
                  <a href="mailto:contacto@armazem-express.pt" className="hover:text-white transition break-all">
                    contacto@armazem-express.pt
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone size={16} className="text-brand-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>+351 210 000 000</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={16} className="text-brand-yellow-400 mt-0.5 flex-shrink-0" />
                  <span>Lisboa, Portugal</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Linha de separação */}
          <div className="mt-12 pt-8 border-t border-neutral-800">
            {/* Selos / Certificações */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-6 text-xs text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Shield size={14} className="text-green-500" />
                Pagamentos seguros via Stripe
              </span>
              <span className="hidden md:inline text-neutral-700">·</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-500" />
                Conforme RGPD
              </span>
              <span className="hidden md:inline text-neutral-700">·</span>
              <span className="flex items-center gap-1.5">
                <Globe size={14} className="text-brand-yellow-400" />
                100% feito em Portugal
              </span>
            </div>

            {/* Bottom row */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
              <div>
                © 2026 <span className="text-neutral-300 font-semibold">Armazém Express</span>. Todos os direitos reservados.
              </div>
              <div className="flex items-center gap-1.5">
                Feito por
                <span className="text-neutral-300 font-semibold">Guilherme Silva</span>
                · PAP 2025/2026 · Escola Digital
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de subscrição */}
      <Modal
        open={!!selectedPlan && !credentials}
        onClose={() => { setSelectedPlan(null); setForm({ companyName: '', email: '' }); }}
        title={`Ativar plano ${selectedPlan?.name || ''}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubscribe} className="space-y-4">
          <div className="p-4 bg-brand-yellow-50 dark:bg-brand-yellow-900/20 border border-brand-yellow-200 dark:border-brand-yellow-800 rounded-xl">
            <div className="text-xs font-bold text-brand-yellow-700 dark:text-brand-yellow-300 uppercase tracking-wider">
              Plano selecionado
            </div>
            <div className="mt-1 font-bold text-lg">{selectedPlan?.name} · {selectedPlan?.price}€/mês</div>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              Pagamento via Stripe (modo de teste). Use o cartão 4242 4242 4242 4242 — qualquer data e CVC.
            </div>
          </div>

          <div>
            <label className="label">Nome da empresa</label>
            <input
              required
              type="text"
              className="input"
              placeholder="A Minha Empresa, Lda."
              value={form.companyName}
              onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Email da empresa</label>
            <input
              required
              type="email"
              className="input"
              placeholder="geral@minhaempresa.pt"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
            <p className="text-xs text-neutral-500 mt-1">Usaremos este email como login de administrador.</p>
          </div>

          <button type="submit" disabled={subscribing} className="w-full btn-primary">
            {subscribing ? 'A processar...' : 'Confirmar e ativar'}
            {!subscribing && <ArrowRight size={18} />}
          </button>
        </form>
      </Modal>

      {/* Modal de credenciais geradas */}
      <Modal
        open={!!credentials}
        onClose={() => { setCredentials(null); setSelectedPlan(null); }}
        title="🎉 Subscrição ativada!"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-sm">
            A sua conta foi criada. Guarde estas credenciais — a password não voltará a ser mostrada.
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Empresa</div>
              <div className="font-bold">{credentials?.companyName}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Email</div>
              <div className="font-mono text-sm bg-neutral-100 dark:bg-neutral-800 p-3 rounded-lg">{credentials?.email}</div>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">Password (gerada)</div>
              <div className="font-mono text-sm bg-brand-yellow-100 dark:bg-brand-yellow-900/30 border border-brand-yellow-300 p-3 rounded-lg font-bold break-all">
                {credentials?.password}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(credentials?.password);
                  toast.success('Password copiada');
                }}
                className="text-xs text-brand-red-500 font-semibold mt-2 hover:underline"
              >
                📋 Copiar password
              </button>
            </div>
          </div>
          <Link to="/login" className="block w-full btn-primary text-center">
            Entrar agora
            <ArrowRight size={18} />
          </Link>
        </div>
      </Modal>
    </div>
  );
}
