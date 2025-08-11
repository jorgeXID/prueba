import { useEffect, useState } from 'react';
import { Dashboard } from './presentation/components/Dashboard';
import { FeaturesSection } from './presentation/components/FeaturesSection';
import { Footer } from './presentation/components/Footer';
import { HeroSection } from './presentation/components/HeroSection';
import { HowItWorksSection } from './presentation/components/HowItWorksSection';
import { TestimonialsSection } from './presentation/components/TestimonialsSection';

const rep = 23

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

//Se agrega esta constante para probar la actualizacion de la documentación 
const vards = 9;
// se agrega nueva cponstante sin usar
const erd = 3;
//nueva de prueba
const eds = 2;

