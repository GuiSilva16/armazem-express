import { Link } from 'react-router-dom';
import { XCircle, ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-brutal p-8 text-center">
        <div className="flex justify-center mb-6">
          <Logo size="md" />
        </div>
        <XCircle size={64} className="text-neutral-400 mx-auto" />
        <h1 className="font-display text-3xl font-bold mt-4">Pagamento cancelado</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Não foi cobrado nada. Pode tentar de novo quando quiser.
        </p>
        <Link to="/#pricing" className="btn-primary mt-6 inline-flex">
          <ArrowLeft size={18} /> Voltar aos planos
        </Link>
      </div>
    </div>
  );
}
