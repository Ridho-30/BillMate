
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from 'react-router-dom';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PersonalFinance from './pages/PersonalFinance';
import Budget from './pages/Budget';
import SplitBill from './pages/SplitBill';
import Profile from './pages/Profile';
import Upgrade from './pages/Upgrade';
import GroupWallet from './pages/GroupWallet';
import GroupWalletDetail from './pages/GroupWalletDetail';

import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Problems } from './components/Problems';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { Pricing } from './components/Pricing';
import { Faq } from './components/Faq';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { StickyCta } from './components/StickyCta';
import { WaitlistModal } from './components/WaitlistModal';
import { PricingPlan } from './data/landingData';
import { MobileBottomNav } from './components/MobileBottomNav';

// =====================================
// PROTECTED ROUTE
// =====================================

function ProtectedRoute({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(auth.currentUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setChecking(false);
    });

    return () => unsubscribe();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAF5]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            Memeriksa sesi login...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// =====================================
// LANDING PAGE
// =====================================

function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState('Pro');

  const navigate = useNavigate();

  const handleOpenWaitlist = (planName: string = 'Pro') => {
    setSelectedPlanName(planName);
    setIsModalOpen(true);
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    handleOpenWaitlist(plan.name);
  };

  return (
    <div className="min-h-screen bg-white text-ink flex flex-col font-sans pb-20 md:pb-0">

      <Navbar onLoginClick={() => navigate('/login')} />

      <main className="flex-1">
        <Hero />
        <Problems />
        <Features />
        <HowItWorks />

        <Pricing onSelectPlan={handleSelectPlan} />

        <Faq />

        <FinalCta onActionClick={() => navigate('/split-bill')} />
      </main>

      <Footer />

      <StickyCta onActionClick={() => handleOpenWaitlist('Split Bill Free')} />

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        planName={selectedPlanName}
      />

    </div>
  );
}

// =====================================
// APP ROUTES
// =====================================

export function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        {/* Protected Pages */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/split-bill"
          element={
            <ProtectedRoute>
              <SplitBill />
            </ProtectedRoute>
          }
        />

        <Route
          path="/group-wallet"
          element={
            <ProtectedRoute>
              <GroupWallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/group-wallet/:groupId"
          element={
            <ProtectedRoute>
              <GroupWalletDetail />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/coba"
          element={
            <ProtectedRoute>
              <SplitBill />
            </ProtectedRoute>
          }
        />

        <Route
          path="/personal-finance"
          element={
            <ProtectedRoute>
              <PersonalFinance />
            </ProtectedRoute>
          }
        />

        <Route
          path="/personal-finance/budget"
          element={
            <ProtectedRoute>
              <Budget />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/upgrade"
          element={
            <ProtectedRoute>
              <Upgrade />
            </ProtectedRoute>
          }
        />

        {/* Halaman tidak ditemukan */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>

      <MobileBottomNav />

    </BrowserRouter>
  );
}

export default App;
