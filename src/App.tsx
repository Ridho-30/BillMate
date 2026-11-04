
import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate
} from 'react-router-dom';
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
import SplitBill from './pages/SplitBill';

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
      <Navbar onLoginClick={() => handleOpenWaitlist('Akun')} />

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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/split-bill" element={<SplitBill />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
