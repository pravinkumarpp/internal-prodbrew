'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md card"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-bold mb-2">Admin Login</h2>
          <p className="text-text-muted">Enter your credentials to access the platform</p>
        </div>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            router.push('/');
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              className="w-full bg-background border border-card-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
              placeholder="admin@maintainai.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="w-full bg-background border border-card-border rounded-lg px-4 py-3 focus:outline-none focus:border-accent"
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="w-full btn-primary">
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
}
