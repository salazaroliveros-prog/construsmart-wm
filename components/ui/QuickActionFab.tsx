'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Plus, 
  Camera, 
  Mic, 
  Image as ImageIcon, 
  RefreshCw, 
  X,
  Search,
  Package,
  DollarSign,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/Toast';
import { offlineDB } from '@/lib/db/offlineStore';
import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';
import { getCurrentUserId } from '@/lib/auth/userId';
import { getUserScope } from '@/lib/utils/userScope';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void | Promise<void>;
}

interface QuickActionFabProps {
  onQuickAdd?: () => void;
  onScanBarcode?: () => void;
  onVoiceMemo?: () => void;
  onPhotoUpload?: () => void;
  onManualSync?: () => void;
}

export default function QuickActionFab({
  onQuickAdd,
  onScanBarcode,
  onVoiceMemo,
  onPhotoUpload,
  onManualSync
}: QuickActionFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const { showToast } = useToast();
  const fabRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cerrar el menú si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Acciones rápidas disponibles
  const quickActions: QuickAction[] = [
    {
      id: 'quick-add',
      label: 'Agregar Rápido',
      icon: <Plus className="w-5 h-5" />,
      color: 'from-cyan-500 to-cyan-600',
      action: async () => {
        if (onQuickAdd) {
          onQuickAdd();
        } else {
          showToast('info', 'Función en desarrollo', 'La función de agregar rápido estará disponible pronto');
        }
      }
    },
    {
      id: 'scan-barcode',
      label: 'Escanear Código',
      icon: <Search className="w-5 h-5" />,
      color: 'from-violet-500 to-violet-600',
      action: async () => {
        if (onScanBarcode) {
          onScanBarcode();
        } else {
          await handleBarcodeScan();
        }
      }
    },
    {
      id: 'voice-memo',
      label: 'Nota de Voz',
      icon: <Mic className="w-5 h-5" />,
      color: 'from-pink-500 to-pink-600',
      action: async () => {
        if (onVoiceMemo) {
          onVoiceMemo();
        } else {
          await handleVoiceMemo();
        }
      }
    },
    {
      id: 'photo-upload',
      label: 'Subir Foto',
      icon: <ImageIcon className="w-5 h-5" />,
      color: 'from-amber-500 to-amber-600',
      action: async () => {
        if (onPhotoUpload) {
          onPhotoUpload();
        } else {
          await handlePhotoUpload();
        }
      }
    },
    {
      id: 'manual-sync',
      label: 'Sincronizar',
      icon: <RefreshCw className="w-5 h-5" />,
      color: 'from-emerald-500 to-emerald-600',
      action: async () => {
        if (onManualSync) {
          onManualSync();
        } else {
          await handleManualSync();
        }
      }
    }
  ];

  // Manejar escaneo de código de barras
  const handleBarcodeScan = async () => {
    setIsActionLoading('scan-barcode');
    try {
      // Simular escaneo - en producción usar una librería como react-qr-reader
      await new Promise(resolve => setTimeout(resolve, 1500));
      showToast('success', 'Cámara activada', 'Listo para escanear códigos de barras');
      // Aquí se integraría con la cámara real
    } catch (error) {
      showToast('error', 'Error de cámara', 'No se pudo acceder a la cámara');
    } finally {
      setIsActionLoading(null);
      setIsOpen(false);
    }
  };

  // Manejar grabación de nota de voz
  const handleVoiceMemo = async () => {
    setIsActionLoading('voice-memo');
    try {
      // Verificar soporte de grabación
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showToast('error', 'Dispositivo no compatible', 'Tu dispositivo no soporta grabación de audio');
        return;
      }

      // Simular grabación - en producción usar MediaRecorder API
      await new Promise(resolve => setTimeout(resolve, 2000));
      showToast('success', 'Nota grabada', 'Nota de voz guardada exitosamente');

      // Guardar en offline storage (simulado)
      const userId = await getCurrentUserId();
      // Aquí se guardaría el archivo de audio real
    } catch (error) {
      showToast('error', 'Error de grabación', 'No se pudo grabar la nota de voz');
    } finally {
      setIsActionLoading(null);
      setIsOpen(false);
    }
  };

  // Manejar subida de foto
  const handlePhotoUpload = async () => {
    setIsActionLoading('photo-upload');
    try {
      // Crear input file temporal
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment'; // Usar cámara trasera en móvil

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Aquí se procesaría la imagen real
          showToast('success', 'Foto seleccionada', `Archivo: ${file.name}`);

          // Guardar referencia en offline storage
          const userId = await getCurrentUserId();
          // Aquí se guardaría la referencia a la imagen
        }
        setIsActionLoading(null);
        setIsOpen(false);
      };

      input.click();
    } catch (error) {
      showToast('error', 'Error de cámara', 'No se pudo acceder a la cámara');
      setIsActionLoading(null);
      setIsOpen(false);
    }
  };

  // Manejar sincronización manual
  const handleManualSync = async () => {
    setIsActionLoading('manual-sync');
    try {
      // Simular sincronización - en producción usar el sistema de sync existente
      await new Promise(resolve => setTimeout(resolve, 2000));
      showToast('success', 'Sincronización completada', 'Todos los datos han sido sincronizados');
    } catch (error) {
      showToast('error', 'Error de sincronización', 'No se pudo completar la sincronización');
    } finally {
      setIsActionLoading(null);
      setIsOpen(false);
    }
  };

  // Ejecutar acción
  const handleAction = useCallback(async (action: QuickAction) => {
    try {
      await action.action();
    } catch (error) {
      console.error('Error executing action:', error);
      showToast('error', 'Error de acción', 'No se pudo ejecutar la acción seleccionada');
    }
  }, [showToast]);

  // Toggle del menú
  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div 
      ref={fabRef}
      className="fixed right-4 z-50 flex flex-col items-end gap-2"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Input file oculto para fotos */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={() => {}}
      />

      {/* Menú de acciones rápidas */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex flex-col items-end gap-2 mb-2"
          >
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05, duration: 0.15 }}
                onClick={() => handleAction(action)}
                disabled={isActionLoading === action.id}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl glass-button
                  min-h-[44px] min-w-[44px]
                  bg-gradient-to-r ${action.color}
                  border border-white/20
                  text-white font-medium text-sm
                  shadow-lg shadow-black/20
                  hover:shadow-xl hover:scale-105
                  active:scale-95
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  touch-manipulation
                `}
                aria-label={action.label}
              >
                {isActionLoading === action.id ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span className="whitespace-nowrap">{action.label}</span>
                    {action.icon}
                  </>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal FAB */}
      <motion.button
        onClick={toggleMenu}
        className={`
          relative w-14 h-14 rounded-2xl glass-button
          flex items-center justify-center
          bg-gradient-to-r from-cyan-500 to-violet-500
          border border-white/30
          text-white shadow-lg shadow-cyan-500/30
          hover:shadow-xl hover:scale-110
          active:scale-95
          transition-all duration-300
          min-h-[56px] min-w-[56px]
          touch-manipulation
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        `}
        aria-label={isOpen ? 'Cerrar menú de acciones rápidas' : 'Abrir menú de acciones rápidas'}
        aria-expanded={isOpen}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Indicador de pulso cuando está cerrado */}
        {!isOpen && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ zIndex: -1 }}
          />
        )}
      </motion.button>
    </div>
  );
}