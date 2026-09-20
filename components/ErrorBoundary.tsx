import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled error in Gusto app', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-sm p-8 text-center">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <h1 className="text-xl font-bold text-slate-900 mb-2">Qualcosa è andato storto</h1>
            <p className="text-slate-500 mb-6">
              Si è verificato un errore imprevisto. Prova a ricaricare la pagina; i tuoi dati salvati non vanno persi.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Ricarica la pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
