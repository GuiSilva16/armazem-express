import { motion } from "framer-motion";
import { Menu, X, ChevronRight, Package, Truck, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import LoginModal from "@/components/LoginModal";
import RegisterModal, { Plan } from "@/components/RegisterModal";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
      setLocation("/dashboard");
    }
  }, [setLocation]);

  const handleChoosePlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsRegisterOpen(true);
  };

  const handleSwitchToRegister = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const slideInVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const slideInRightVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.8 },
    },
  };

  const plans: Plan[] = [
    {
      name: "Startup",
      price: "€29",
      description: "Para pequenas operações",
      features: [
        "Até 1.000 produtos",
        "Gestão básica de stock",
        "1 utilizador",
        "Suporte por email",
      ],
    },
    {
      name: "Profissional",
      price: "€79",
      description: "Para operações médias",
      features: [
        "Até 10.000 produtos",
        "Gestão completa de stock",
        "Até 5 utilizadores",
        "Tracking de encomendas",
        "Suporte prioritário",
      ],
    },
    {
      name: "Empresarial",
      price: "€199",
      description: "Para grandes operações",
      features: [
        "Produtos ilimitados",
        "Gestão avançada",
        "Utilizadores ilimitados",
        "API de integração",
        "Suporte 24/7",
        "Relatórios avançados",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100"
      >
        <div className="container flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663249298837/BuztwmjSNjgLjqUE.png"
              alt="Armazém Express"
              className="w-12 h-12 object-contain"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                Armazém
              </h1>
              <p className="text-sm font-semibold text-red-600 -mt-1">
                Express
              </p>
            </div>
          </motion.div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <motion.a
              href="#features"
              whileHover={{ color: "#DC2626" }}
              className="text-gray-700 font-medium transition-colors"
            >
              Funcionalidades
            </motion.a>
            <motion.a
              href="#plans"
              whileHover={{ color: "#DC2626" }}
              className="text-gray-700 font-medium transition-colors"
            >
              Planos
            </motion.a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLoginOpen(true)}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Login
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-900" />
            ) : (
              <Menu className="w-6 h-6 text-gray-900" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-gray-100 p-4 space-y-4"
          >
            <a href="#features" className="block text-gray-700 font-medium">
              Funcionalidades
            </a>
            <a href="#plans" className="block text-gray-700 font-medium">
              Planos
            </a>
            <button
              onClick={() => {
                setIsLoginOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold"
            >
              Login
            </button>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-100 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-100 rounded-full blur-3xl opacity-30 -z-10" />

        <div className="container max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            {/* Left Content */}
            <motion.div variants={slideInVariants} className="space-y-6">
              <motion.div variants={itemVariants}>
                <span className="inline-block px-4 py-2 bg-yellow-100 text-red-600 rounded-full text-sm font-semibold mb-4">
                  ✨ Solução de Logística Inteligente
                </span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight"
              >
                Gestão de Armazém{" "}
                <span className="text-red-600">Simplificada</span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl text-gray-600 leading-relaxed"
              >
                O Armazém Express é uma plataforma moderna de gestão de stock
                para PMEs. Controle inventário, processe encomendas e rastreie
                envios em tempo real, tudo num único lugar.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(220, 38, 38, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRegisterOpen(true)}
                  className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  Começar Agora <ChevronRight className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, borderColor: "#DC2626" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoginOpen(true)}
                  className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-bold text-lg hover:border-red-600 transition-colors"
                >
                  Já Tem Conta
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right Content - Illustration */}
            <motion.div
              variants={slideInRightVariants}
              className="relative h-96 md:h-full flex items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <img
                  src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663249298837/BuztwmjSNjgLjqUE.png"
                  alt="Armazém Express"
                  className="w-80 h-80 object-contain drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-xl text-gray-600">
              Tudo que precisa para gerir o seu armazém de forma eficiente
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Package,
                title: "Gestão de Stock",
                description:
                  "Adicione, remova e consulte produtos com facilidade. Controle completo do seu inventário.",
              },
              {
                icon: Truck,
                title: "Processamento de Encomendas",
                description:
                  "Registe e processe expedições com dados do destinatário e baixa automática de stock.",
              },
              {
                icon: BarChart3,
                title: "Rastreio em Tempo Real",
                description:
                  "Acompanhe o estado das suas encomendas e visualize o histórico de movimentação.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                className="p-8 bg-white rounded-xl border border-gray-200 hover:border-red-200 transition-all"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 10 }}
                  className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-6"
                >
                  <feature.icon className="w-8 h-8 text-red-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-20 px-4 bg-white">
        <div className="container max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Planos de Assinatura
            </h2>
            <p className="text-xl text-gray-600">
              Escolha o plano perfeito para o seu negócio
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -15, boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.15)" }}
                className={`relative p-8 rounded-2xl border-2 transition-all ${
                  plan.name === "Profissional"
                    ? "border-red-600 bg-gradient-to-br from-red-50 to-yellow-50 transform md:scale-105"
                    : "border-gray-200 bg-white hover:border-red-200"
                }`}
              >
                {plan.name === "Profissional" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="px-4 py-1 bg-red-600 text-white rounded-full text-sm font-bold">
                      Mais Popular
                    </span>
                  </motion.div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">/mês</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleChoosePlan(plan)}
                  className={`w-full py-3 rounded-lg font-bold text-lg mb-8 transition-colors ${
                    plan.name === "Profissional"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  Escolher Plano
                </motion.button>

                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <motion.div
                      key={featureIndex}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: featureIndex * 0.1 }}
                      viewport={{ once: true }}
                      className="flex items-start gap-3"
                    >
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 360 }}
                        className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <span className="text-xs font-bold text-red-600">✓</span>
                      </motion.div>
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-red-600 to-red-700 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-300 rounded-full blur-3xl opacity-20 -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="container max-w-4xl mx-auto text-center"
        >
          <motion.img
            src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663249298837/BuztwmjSNjgLjqUE.png"
            alt="Armazém Express"
            className="w-32 h-32 mx-auto mb-6 object-contain"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Pronto para Transformar o Seu Armazém?
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Comece a sua assinatura hoje e ganhe acesso completo ao Armazém
            Express
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRegisterOpen(true)}
            className="px-10 py-4 bg-yellow-400 text-red-600 rounded-lg font-bold text-lg hover:bg-yellow-300 transition-colors"
          >
            Iniciar Teste Gratuito
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-gray-900 text-gray-400 py-12 px-4"
      >
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663249298837/BuztwmjSNjgLjqUE.png"
                alt="Armazém Express"
                className="w-24 h-24 object-contain mb-4"
              />
              <p className="text-sm">Gestão de armazém para PMEs modernas</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#plans" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              © 2025 Armazém Express. Todos os direitos reservados. PAP -
              Técnico de Gestão e Programação de Sistemas Informáticos.
            </p>
          </div>
        </div>
      </motion.footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSwitchToLogin={handleSwitchToLogin}
        selectedPlan={selectedPlan}
      />
    </div>
  );
}
