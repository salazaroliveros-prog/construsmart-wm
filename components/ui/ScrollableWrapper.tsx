'use client';

interface ScrollableWrapperProps {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
  padding?: string;
}

/**
 * ScrollableWrapper - Componente reutilizable para contenido scrollable
 *
 * Uso:
 * <ScrollableWrapper maxHeight="70vh">
 *   <div>Contenido fijo (header)</div>
 *   <div>Contenido scrollable</div>
 * </ScrollableWrapper>
 *
 * Si children es un array, el primer elemento se considera fijo (flex-shrink-0)
 * y el resto se hace scrollable (flex-1 overflow-y-auto)
 */
export default function ScrollableWrapper({
  children,
  className = '',
  maxHeight = '70vh',
  padding = 'pr-2'
}: ScrollableWrapperProps) {
  const childrenArray = Array.isArray(children) ? children : [children];

  return (
    <div className={`scrollable-wrapper flex flex-col ${className}`} style={{ maxHeight }}>
      {childrenArray.length > 1 ? (
        <>
          <div className="flex-shrink-0">
            {childrenArray[0]}
          </div>
          <div className={`flex-1 overflow-y-auto space-y-4 sm:space-y-6 ${padding}`}>
            {childrenArray.slice(1)}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6">
          {children}
        </div>
      )}
    </div>
  );
}
