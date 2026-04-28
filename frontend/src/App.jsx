import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingScreen from './components/LoadingScreen';
import AppLayout from './components/AppLayout';
import FeatureGate from './components/FeatureGate';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stock from './pages/Stock';
import AddProduct from './pages/AddProduct';
import RemoveProduct from './pages/RemoveProduct';
import ProductDetail from './pages/ProductDetail';
import SendOrder from './pages/SendOrder';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Tracking from './pages/Tracking';
import QrScanner from './pages/QrScanner';
import Team from './pages/Team';
import Settings from './pages/Settings';
import Activity from './pages/Activity';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="stock" element={<Stock />} />
        <Route path="stock/add" element={<AddProduct />} />
        <Route path="stock/remove" element={<RemoveProduct />} />
        <Route path="stock/:id" element={<ProductDetail />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/new" element={<SendOrder />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="tracking" element={<Tracking />} />
        <Route path="scanner" element={<FeatureGate feature="qr_scanner"><QrScanner /></FeatureGate>} />
        <Route path="team" element={<Team />} />
        <Route path="activity" element={<FeatureGate feature="activity_log"><Activity /></FeatureGate>} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
