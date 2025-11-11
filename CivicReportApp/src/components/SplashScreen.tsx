import React, { useState } from 'react';
import OnboardingScreen from '../screens/OnboardingScreen';

interface SplashScreenProps {
  onFinish?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  const handleOnboardingComplete = () => {
    console.log('🎯 Onboarding completed, finishing splash screen');
    setShowOnboarding(false);
    onFinish?.();
  };

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return null;
};

export default SplashScreen;
