'use client';

import { Building2, Calendar, Clock, User, Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DualBrandHeader() {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('es-GT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <header style={{
      background: 'rgba(15, 23, 42, 0.55)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      border: '1px solid rgba(255, 255, 255, 0.125)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Dual Brand Container */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Constructora WM Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <img
              src="/assets/branding/logo-constructora-wm.jpg"
              alt="CONSTRUCTORA WM/M&S"
              style={{ height: '3rem', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          
          {/* Glass Divider */}
          <div style={{ 
            height: '2rem', 
            width: '1px', 
            background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.2), transparent)' 
          }} />
          
          {/* Multiservicios Logo */}
          <div style={{ position: 'relative' }}>
            <img
              src="/assets/branding/letterhead-multiservicios.jpg"
              alt="Multi Servicios de Guatemala"
              style={{ height: '2.5rem', width: 'auto', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Company Name & Slogan */}
        <div style={{ display: 'none', marginLeft: '1rem' }} className="md:block">
          <h1 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: 'white',
            textShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
          }}>
            CONSTRUCTORA WM/M&S
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'rgb(34, 211, 238)', fontStyle: 'italic' }}>
            "CONSTRUYENDO EL FUTURO"
          </p>
        </div>
      </div>

      {/* Right Side - User Info & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {/* Date & Time */}
        <div style={{ display: 'none', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }} className="lg:flex">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <Calendar style={{ width: '1rem', height: '1rem' }} />
            <span>{formatDate(currentTime)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
            <Clock style={{ width: '1rem', height: '1rem' }} />
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isOnline ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.2)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <Wifi style={{ width: '0.875rem', height: '0.875rem', color: 'rgb(52, 211, 153)' }} />
              <span style={{ fontSize: '0.75rem', color: 'rgb(110, 231, 183)', fontWeight: 500 }}>Online</span>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '9999px',
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <WifiOff style={{ width: '0.875rem', height: '0.875rem', color: 'rgb(251, 191, 36)' }} />
              <span style={{ fontSize: '0.75rem', color: 'rgb(253, 186, 116)', fontWeight: 500 }}>Offline</span>
            </div>
          )}
        </div>

        {/* User Profile with Glowing Ring */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'none', textAlign: 'right' }} className="sm:block">
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>Ing. Carlos Martínez</p>
            <p style={{ fontSize: '0.75rem', color: 'rgb(34, 211, 238)' }}>Director de Proyectos</p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              background: 'linear-gradient(to bottom right, rgb(6, 182, 212), rgb(139, 92, 246))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 15px -3px rgba(6, 182, 212, 0.2)',
              border: '2px solid rgba(6, 182, 212, 0.5)'
            }}>
              <User style={{ width: '1.25rem', height: '1.25rem', color: 'white' }} />
            </div>
            <div style={{
              position: 'absolute',
              bottom: '-0.125rem',
              right: '-0.125rem',
              width: '0.75rem',
              height: '0.75rem',
              background: 'rgb(16, 185, 129)',
              borderRadius: '50%',
              border: '2px solid rgb(15, 23, 42)'
            }} />
          </div>
        </div>
      </div>
    </header>
  );
}
