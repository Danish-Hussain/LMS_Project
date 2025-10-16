"use client";
import { DarkModeProvider } from '@/contexts/DarkModeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/ToastProvider';
import Navbar from '@/components/Layout/Navbar';

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </AuthProvider>
    </DarkModeProvider>
  );
}
