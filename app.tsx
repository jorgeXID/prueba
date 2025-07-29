import { useEffect, useState } from 'react';
import { Dashboard } from './presentation/components/Dashboard';
import { FeaturesSection } from './presentation/components/FeaturesSection';
import { Footer } from './presentation/components/Footer';
import { HeroSection } from './presentation/components/HeroSection';
import { HowItWorksSection } from './presentation/components/HowItWorksSection';
import { TestimonialsSection } from './presentation/components/TestimonialsSection';

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  // Sincronizar el estado con el hash de la URL
  useEffect(() => {
    if (window.location.hash && showDashboard) {
      setShowDashboard(false);
      setTimeout(() => {
        const el = document.getElementById(
          window.location.hash.replace('#', '')
        );
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [showDashboard]);

  const handleGetStarted = () => {
    setShowDashboard(true);
  };

  if (showDashboard) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-white">
      <HeroSection onGetStarted={handleGetStarted} />
      <FeaturesSection />
      <HowItWorksSection onGetStarted={handleGetStarted} />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
