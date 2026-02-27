import { motion } from "framer-motion";
import { LogOut, Package, Plus, Send, Truck, BarChart3, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

interface User {
  email: string;
  name: string;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      setLocation("/");
    } else {
      setUser(JSON.parse(userData));
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setLocation("/");
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
      transition: { duration: 0.6 },
    },
  };

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: BarChart3 },
    { id: "stock", label: "Gestão de Stock", icon: Package },
    { id: "add", label: "Adicionar Produto", icon: Plus },
    { id: "send", label: "Enviar Encomenda", icon: Send },
    { id: "tracking", label: "Rastreio", icon: Truck },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-sm z-50 border-b border-gray-200 shadow-sm"
      >
        <div className="container flex items-center justify-between h-20">
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
          <div className="hidden md:flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-600">Bem-vindo,</p>
              <p className="font-bold text-gray-900">{user?.name}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
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
            className="md:hidden bg-white border-t border-gray-200 p-4 space-y-2"
          >
            <div className="text-right mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">Bem-vindo,</p>
              <p className="font-bold text-gray-900">{user?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </motion.div>
        )}
      </motion.nav>

      {/* Main Content */}
      <div className="pt-20 pb-8">
        <div className="container max-w-7xl mx-auto">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8"
          >
            {tabs.map((tab, index) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex flex-col items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-red-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-xs md:text-sm">{tab.label}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Visão Geral do Armazém
                </h2>

                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { label: "Total de Produtos", value: "1.234", icon: Package, color: "bg-blue-100 text-blue-600" },
                    { label: "Stock Baixo", value: "45", icon: BarChart3, color: "bg-yellow-100 text-yellow-600" },
                    { label: "Encomendas Pendentes", value: "12", icon: Send, color: "bg-orange-100 text-orange-600" },
                    { label: "Em Trânsito", value: "8", icon: Truck, color: "bg-green-100 text-green-600" },
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente</h3>
                  <div className="space-y-4">
                    {[
                      "Produto 'Parafuso M8' adicionado ao stock",
                      "Encomenda #001 enviada para Lisboa",
                      "Stock de 'Corrente 10mm' atualizado",
                      "Rastreio #002 entregue com sucesso",
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 pb-4 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                        <p className="text-gray-700">{activity}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stock Tab */}
            {activeTab === "stock" && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">Gestão de Stock</h2>
                <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Esta funcionalidade será implementada em breve
                  </p>
                </div>
              </motion.div>
            )}

            {/* Add Product Tab */}
            {activeTab === "add" && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">Adicionar Produto</h2>
                <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
                  <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Esta funcionalidade será implementada em breve
                  </p>
                </div>
              </motion.div>
            )}

            {/* Send Order Tab */}
            {activeTab === "send" && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">Enviar Encomenda</h2>
                <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
                  <Send className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Esta funcionalidade será implementada em breve
                  </p>
                </div>
              </motion.div>
            )}

            {/* Tracking Tab */}
            {activeTab === "tracking" && (
              <motion.div variants={itemVariants} className="space-y-6">
                <h2 className="text-3xl font-bold text-gray-900">Rastreio de Encomendas</h2>
                <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
                  <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Esta funcionalidade será implementada em breve
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
