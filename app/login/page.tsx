'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button, Input, Card } from '@/lib/design-system/components';
import { useAuth } from '@/modules/shared/hooks/useAuth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirect = searchParams.get('redirect') || '/performance';
      router.push(redirect);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setIsLoading(true);

    try {
      await signIn(email, password);
      
      // Redirect to dashboard
      const redirect = searchParams.get('redirect') || '/performance';
      router.push(redirect);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials') || err.message.includes('Credenciais inválidas')) {
          setError('Email ou senha inválidos');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Por favor, confirme seu email antes de fazer login');
        } else {
          setError(err.message || 'Erro ao fazer login. Tente novamente.');
        }
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Full screen background watermark image */}
      <div className="absolute inset-0">
        {/* Background image - full screen watermark */}
        <div className="absolute inset-0 opacity-25">
          <Image
            src="/images/login-bg.jpg"
            alt="Background"
            fill
            className="object-cover"
            priority
            quality={90}
          />
        </div>
        
        {/* Dark overlay for better contrast and readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-purple-900/40 z-10" />
      </div>

      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-30">
        <div className="text-center mb-8">
          <div className="mb-6">
            {/* Modern stylized ALUA logo with Orbitron font */}
            <h1 className="text-8xl font-logo-orbitron text-white mb-3 tracking-widest relative inline-block">
              <span className="relative z-10 bg-gradient-to-br from-white via-purple-100 to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
                ALUA
              </span>
              {/* Glow effect behind text */}
              <span className="absolute inset-0 blur-3xl bg-gradient-to-br from-purple-400 to-purple-600 opacity-40 -z-10">
                ALUA
              </span>
            </h1>
            <p className="text-sm text-purple-300 font-medium tracking-wide">
              Social Media Management
            </p>
          </div>
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Bem-vindo à ALUA
          </h2>
          <p className="text-gray-400 text-sm">
            Faça login para acessar o sistema
          </p>
        </div>

        <Card variant="elevated" className="backdrop-blur-xl bg-dark-elevated/80">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                type="email"
                label="Email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                error={!!error && !email}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Senha"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                error={!!error && !password}
              />
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Não tem uma conta? Entre em contato com o administrador.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white">Carregando...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
