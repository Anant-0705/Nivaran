import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    {
      id: 0,
      title: 'NIVARAN',
      subtitle: '',
      description: '',
      showLogo: true,
      buttonText: '',
      showButton: false,
      isLogoScreen: true,
      autoAdvance: true,
      icon: null,
      backgroundImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3', // Remote URL for logo screen
    },
    {
      id: 1,
      title: 'Make Your City',
      subtitle: 'Cleaner & Better',
      description: 'Report issues in your area and help keep Jharkhand clean & safe',
      showLogo: false,
      buttonText: 'Get Started',
      showButton: true,
      isLogoScreen: false,
      autoAdvance: false,
      icon: 'business-outline',
      backgroundImage: require('../../assets/civic.jpg'), // Local asset
    },
    {
      id: 2,
      title: 'Snap & Send',
      subtitle: '',
      description: 'Click a picture of the problem, add details, and send your report in seconds',
      showLogo: false,
      buttonText: 'Next',
      showButton: true,
      isLogoScreen: false,
      autoAdvance: false,
      icon: 'camera-outline',
      backgroundImage: require('../../assets/snap.png'), // Local asset
    },
    {
      id: 3,
      title: 'Track & Earn',
      subtitle: '',
      description: 'Follow your reports, see them resolved, and earn rewards for helping your city.',
      showLogo: false,
      buttonText: 'Start Reporting',
      showButton: true,
      isLogoScreen: false,
      autoAdvance: false,
      icon: 'trophy-outline',
      backgroundImage: require('../../assets/third.png'), // Local asset
    },
  ];

  const currentScreenData = screens[currentScreen];

  const handleNext = () => {
    console.log(`🎯 HandleNext called, currentScreen: ${currentScreen}, total screens: ${screens.length}`);
    if (currentScreen < screens.length - 1) {
      console.log(`🎯 Moving to next screen: ${currentScreen + 1}`);
      setCurrentScreen(currentScreen + 1);
    } else {
      console.log('🎯 Onboarding complete, calling onComplete');
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  // Auto-advance from logo screen after 2 seconds
  React.useEffect(() => {
    if (currentScreen === 0 && currentScreenData.autoAdvance) {
      console.log('🎯 Auto-advancing from logo screen in 2 seconds');
      const timer = setTimeout(() => {
        console.log('🎯 Auto-advancing to screen 1');
        setCurrentScreen(1); // Go to "Make Your City Cleaner & Better" page
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentScreen, currentScreenData]);

  const renderProgressDots = () => {
    if (currentScreen === 0) return null;
    
    return (
      <View style={styles.progressContainer}>
        {screens.slice(1).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              index === currentScreen - 1 ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    );
  };

  if (currentScreenData.isLogoScreen) {
    return (
      <ImageBackground
        source={typeof currentScreenData.backgroundImage === 'string' 
          ? { uri: currentScreenData.backgroundImage }
          : currentScreenData.backgroundImage
        }
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        <View style={styles.logoScreenContainer}>
          <View style={styles.logoContainer}>
            {/* Using your actual logo */}
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>NIVARAN</Text>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={typeof currentScreenData.backgroundImage === 'string' 
        ? { uri: currentScreenData.backgroundImage }
        : currentScreenData.backgroundImage
      }
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      
      {/* Back Button */}
      {currentScreen > 1 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#333333" />
        </TouchableOpacity>
      )}

      <View style={styles.contentContainer}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Icon for non-logo screens */}
          {currentScreenData.icon && (
            <View style={styles.iconContainer}>
              <Ionicons name={currentScreenData.icon as any} size={80} color="#E5C47F" />
            </View>
          )}
          
          <Text style={styles.title}>{currentScreenData.title}</Text>
          {currentScreenData.subtitle && (
            <Text style={styles.subtitle}>{currentScreenData.subtitle}</Text>
          )}
          <Text style={styles.description}>{currentScreenData.description}</Text>
        </View>

        {/* Progress Dots */}
        {renderProgressDots()}

        {/* Button */}
        {currentScreenData.showButton && (
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{currentScreenData.buttonText}</Text>
            <Ionicons name="arrow-forward" size={20} color="#333333" style={styles.buttonIcon} />
          </TouchableOpacity>
        )}
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#481B5EE5', // Purple overlay
  },
  logoScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 250,
    height: 200,
    marginBottom: 30,
    tintColor: '#E5C47F', // This will apply the gold color to your logo
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(229, 196, 127, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E5C47F',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E5C47F',
    letterSpacing: 2,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5C47F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 60,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(229, 196, 127, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(229, 196, 127, 0.3)',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E5C47F',
    textAlign: 'center',
    marginBottom: 30,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#E5C47F',
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  button: {
    backgroundColor: '#E5C47F',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 180,
  },
  buttonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default OnboardingScreen;
