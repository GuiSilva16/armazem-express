import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

/**
 * Rota /p/:code — destino dos QR codes dos produtos.
 * Ao fazer scan com a câmara do telemóvel, abre a ficha do produto.
 * Se o utilizador não tiver sessão, envia para login e regressa depois de entrar.
 */
export default function ProductResolver() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Guarda o destino para regressar após o login
      sessionStorage.setItem('armazem_redirect', `/p/${code}`);
      navigate('/login', { replace: true });
      return;
    }

    api
      .get(`/products/qr/${encodeURIComponent(code)}`)
      .then(({ data }) => navigate(`/app/stock/${data.id}`, { replace: true }))
      .catch(() => {
        toast.error('Produto não encontrado para este QR code.');
        navigate('/app/stock', { replace: true });
      });
  }, [loading, user, code, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-neutral-50 dark:bg-neutral-950 text-neutral-500">
      <Loader2 size={32} className="animate-spin text-brand-red-500" />
      <p className="text-sm font-semibold">A abrir o produto…</p>
    </div>
  );
}
