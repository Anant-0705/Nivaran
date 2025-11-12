import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
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
      type: 'getStarted',
      title: 'HELPING\nYOU FIX WHAT MATTERS\nWITH',
      highlight: 'NIVARAN',
      subtitle: 'YOUR\nISSUE ORGANIZER',
      buttonText: 'Get Started',
      showButton: true,
    },
    {
      id: 1,

      type: 'step',
      stepNumber: 1,
      title: 'Report in 2\nClicks',
      description: 'Just tap the report button, upload a photo,\nand let us know what needs attention.',
      buttonText: 'Next',
      showButton: true,

    },
    {
      id: 2,
      type: 'step',
      stepNumber: 2,
      title: 'Track Your\nProgress',
      description: 'Get real-time updates from the authorities on\nhow your issue is being resolved.',
      buttonText: 'Next',
      showButton: true,
    },
    {
      id: 3,
      type: 'step',
      stepNumber: 3,
      title: 'Earn Rewards\nfor Helping Out',
      description: 'Earn points and badges as you report issues\nand help improve your community.',
      buttonText: 'Next',
      showButton: true,
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

  // Get Started Screen
  if (currentScreenData.type === 'getStarted') {
    return (
      <View style={styles.getStartedContainer}>
        {/* Main Content Area */}
        <View style={styles.getStartedMainContent}>
          {/* Text Content with 33.png image above */}
          <View style={styles.getStartedTextContent}>
            {/* 33.png image above HELPING text */}
            <Image 
              source={require('../../assets/33.png')} 
              style={styles.getStartedTopImage}
              resizeMode="contain"
            />
            
            <Text style={styles.getStartedTitle}>
              HELPING{'\n'}YOU FIX WHAT MATTERS{'\n'}WITH
            </Text>
            <Text style={styles.getStartedHighlight}>
              NIVARAN
            </Text>
            <Text style={styles.getStartedSubtitle}>
              YOUR{'\n'}ISSUE ORGANIZER
            </Text>
          </View>

          {/* Right side with 32.png image (green smiley) extending to edge */}
          <Image 
            source={require('../../assets/32.png')} 
            style={styles.getStartedRightImage}
            resizeMode="cover"
          />
        </View>

        {/* Bottom Button */}
        <View style={styles.getStartedBottomSection}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleNext}>
            <Text style={styles.getStartedButtonText}>{currentScreenData.buttonText}</Text>
            <Ionicons name="arrow-forward" size={20} color="#000000" style={styles.buttonIcon} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Step Screens
  return (

    <View style={styles.stepContainer}>

      {/* Back Button */}
      {currentScreen > 0 && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
      )}

      {/* Step 1 Screen */}
      {currentScreen === 1 && (
        <>
          {/* Top Section - Header with NIVARAN */}
          <View style={styles.topSection}>
            <Text style={styles.nivaranHeader}>NIVARAN</Text>
            
            {/* Decorative elements around header - mix of dots and 36.png images */}
            <Image 
              source={require('../../assets/36.png')} 
              style={[styles.decorativeImage, { position: 'absolute', top: 20, right: 30 }]}
              resizeMode="contain"
            />
            <View style={[styles.decorativeDoodle, { position: 'absolute', top: 40, left: 50 }]} />
          </View>

          {/* Middle Section - Pill Navigation Structure */}
          <View style={styles.pillNavigationSection}>
            {/* Leaf overlay image (34.png) */}
            <Image 
              source={require('../../assets/34.png')} 
              style={styles.leafOverlay}
              resizeMode="contain"
            />
            
            {/* Pill-shaped background container */}
            <View style={styles.pillBackgroundContainer}>
              {/* Camera button */}
              <TouchableOpacity style={styles.circularButton}>
                <Ionicons name="camera" size={20} color="#333" />
              </TouchableOpacity>
              
              {/* Main Report Button in the center */}
              <TouchableOpacity style={styles.mainReportButton}>
                <Ionicons name="flag" size={24} color="#FFFFFF" />
                <Text style={styles.reportButtonText}>Report</Text>
              </TouchableOpacity>
              
              {/* Info button */}
              <TouchableOpacity style={styles.circularButton}>
                <Ionicons name="information-circle" size={20} color="#333" />
              </TouchableOpacity>
              
              {/* Stats button */}
              <TouchableOpacity style={styles.circularButton}>
                <Ionicons name="stats-chart" size={20} color="#333" />
              </TouchableOpacity>
            </View>
            
            {/* Decorative elements around the pill - mix of dots and 36.png images */}
            <View style={[styles.decorativeDoodle, { position: 'absolute', top: 50, left: 30 }]} />
            
            <Image 
              source={require('../../assets/36.png')} 
              style={[styles.decorativeImage, { position: 'absolute', bottom: 60, right: 40 }]}
              resizeMode="contain"
            />
            
            <View style={[styles.decorativeImageWithIcon, { position: 'absolute', top: 80, right: 20 }]}>
              <Image 
                source={require('../../assets/36.png')} 
                style={styles.decorativeImageBackground}
                resizeMode="contain"
              />
              <Ionicons name="camera" size={16} color="#FFFFFF" style={styles.decorativeIcon} />
            </View>
            
            <View style={[styles.decorativeDoodle, { position: 'absolute', bottom: 40, left: 60 }]} />
          </View>

          {/* Doodle Character Section */}
          <View style={styles.doodleBackground}>
            <Image 
              source={require('../../assets/35.png')} 
              style={styles.doodleCharacterImage}
              resizeMode="contain"
            />
          </View>
        </>
      )}

      {/* Step 2 Screen - Track Your Progress */}
      {currentScreen === 2 && (
        <>
          {/* Top Section - Header with NIVARAN */}
          <View style={styles.topSection}>
            <Text style={styles.nivaranHeader}>NIVARAN</Text>
            
            {/* Decorative green dot */}
            <View style={[styles.decorativeDoodle, { position: 'absolute', top: 20, right: 30 }]} />
          </View>

          {/* Progress Tracking Section */}
          <View style={styles.progressTrackingSection}>
            {/* Progress Bar Image (39.png) */}
            <View style={styles.progressBarContainer}>
              <Image 
                source={require('../../assets/39.png')} 
                style={styles.progressBarImage}
                resizeMode="contain"
              />
              
              {/* Navbar Image (40.png) on corner of progress bar */}
              <Image 
                source={require('../../assets/40.png')} 
                style={styles.navbarImage}
                resizeMode="contain"
              />
              
              {/* Arrow Image (38.png) pointing towards bar */}
              <Image 
                source={require('../../assets/38.png')} 
                style={styles.arrowImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Decorative elements around progress section */}
            <View style={[styles.decorativeDoodle, { position: 'absolute', top: 30, left: 40 }]} />
            <View style={[styles.decorativeDoodle, { position: 'absolute', bottom: 50, right: 50 }]} />
          </View>

          {/* Doodle Character Section */}
          <View style={[styles.doodleBackground, styles.step2DoodlePosition]}>
            <Image 
              source={require('../../assets/37.png')} 
              style={styles.step2DoodleImage}
              resizeMode="contain"
            />
          </View>
        </>
      )}

      {/* Step 3 Screen - Earn Rewards */}
      {(currentScreen === 3 || (currentScreen !== 1 && currentScreen !== 2)) && (
        <>
          {/* Top Section - Header with NIVARAN */}
          <View style={styles.topSection}>
            <Text style={styles.nivaranHeader}>NIVARAN</Text>
          </View>

          {/* Rewards Section */}
          <View style={styles.rewardsSection}>
            {/* Star above navbar (moved from top-left corner) */}
            <Image 
              source={require('../../assets/45.png')} 
              style={styles.starAboveNavbar}
              resizeMode="contain"
            />
            
            {/* Navbar/Rewards Interface (41.png) */}
            <Image 
              source={require('../../assets/41.png')} 
              style={styles.rewardsNavbar}
              resizeMode="contain"
            />
            
            {/* Left side doodle (43.png) - edge to edge */}
            <Image 
              source={require('../../assets/43.png')} 
              style={styles.leftSideDoodle}
              resizeMode="contain"
            />
            
            {/* Right side doodle (44.png) - edge to edge */}
            <Image 
              source={require('../../assets/44.png')} 
              style={styles.rightSideDoodle}
              resizeMode="contain"
            />
            
            {/* Bottom corner elements */}
            <Image 
              source={require('../../assets/45.png')} 
              style={styles.bottomLeftCornerStar}
              resizeMode="contain"
            />
            <Image 
              source={require('../../assets/42.png')} 
              style={styles.bottomRightCornerQube}
              resizeMode="contain"
            />
          </View>

          {/* Central Doodle Character */}
          <View style={styles.centralDoodleSection}>
            <Image 
              source={require('../../assets/42.png')} 
              style={styles.centralQubeDoodle}
              resizeMode="contain"
            />
          </View>
        </>
      )}

      {/* Bottom Section - Step Info Card */}
      <View style={styles.bottomStepCard}>
        <Text style={styles.stepLabel}>Step {currentScreenData.stepNumber}:</Text>
        <Text style={styles.stepCardTitle}>{currentScreenData.title}</Text>
        <Text style={styles.stepCardDescription}>{currentScreenData.description}</Text>
        
        {/* Progress Indicator */}
        <View style={styles.progressIndicator}>
          <View style={styles.progressLine} />
          <View style={styles.progressDotActive} />
          <View style={styles.progressLine} />
        </View>
        
        {/* Next Button */}
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>{currentScreenData.buttonText}</Text>
          <Ionicons name="arrow-forward" size={20} color="#000000" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  // Get Started Screen Styles
  getStartedContainer: {
    flex: 1,
    backgroundColor: '#232323',
  },
  getStartedMainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  getStartedTextContent: {
    flex: 1,
    paddingLeft: 30,
    paddingRight: 20,
    paddingTop: 0,
    paddingBottom:100,
    justifyContent: 'center',
  },
  getStartedTopImage: {
    width: 50,
    height: 50,
    left:100,
    top: 40,
    marginBottom: 20,
  },
  getStartedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 30,
    marginBottom: 8,
  },
  getStartedHighlight: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#54AF60',
    marginBottom: 8,
  },
  getStartedSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 18,
    fontWeight: '500',
  },
  getStartedRightImage: {
    position: 'absolute',
    right: 0,
    top: 480,
    bottom: 100,
    width: 180,
    height: 200,
  },
  getStartedBottomSection: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  getStartedButton: {
    backgroundColor: '#54AF60',
    paddingVertical: 16,
    paddingHorizontal: 32,
 
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  getStartedButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight:10 ,
  },


  // Step Screen Styles
  stepContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#54AF60',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // New Step 1 Layout Styles
  topSection: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  nivaranHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#006C48',
    letterSpacing: 1.5,
  },

  // Pill Navigation Section
  pillNavigationSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    position: 'relative',
    marginVertical: 20,
  },
  leafOverlay: {
    position: 'absolute',
    width: 300,
    height: 200,
    zIndex: 1,
  },
  pillBackgroundContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    width: 320,
    height: 80,
    zIndex: 2,
  },
  pillContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },

  // Circular Button Positioning
  cameraButton: {
    position: 'absolute',
    left: -20,
    top: -10,
  },
  infoButton: {
    position: 'absolute',
    right: -20,
    top: -10,
  },
  statsButton: {
    position: 'absolute',
    left: -20,
    bottom: -10,
  },
  settingsButton: {
    position: 'absolute',
    right: -20,
    bottom: -10,
  },

  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  mainReportButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#006C48',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  reportButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // Step 2 - Progress Tracking Styles
  progressTrackingSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 30,
  },
  progressBarContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 300,
    height: 200,
  },
  progressBarImage: {
    width: 280,
    height: 160,
  },
  navbarImage: {
    position: 'absolute',
    top: 1,
    right: 0,
    width: 180,
    height: 60,
  },
  arrowImage: {
    position: 'absolute',
    bottom: -40,
    right: 80,
    width: 70,
    height: 55,
  },
  step2DoodleImage: {
    width: 180,
    height: 180,
    left : 40

  },
  step2DoodlePosition: {
    alignItems: 'flex-end',
    paddingRight: 30,
  },

  // Step 3 - Rewards Screen Styles
  rewardsSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 20,
  },
  rewardsNavbar: {
    width: 250,
    height: 150,
    zIndex: 2,
  },
  
  // Star above navbar (moved from corner)
  starAboveNavbar: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: 70,
    height: 70,
    zIndex: 3,
  },
  
  // Corner Elements - Only bottom corners now
  bottomLeftCornerStar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
  },
  bottomRightCornerQube: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 60,
    height: 60,
  },
  
  // Side Doodles - Edge to edge, increased size
  leftSideDoodle: {
    position: 'absolute',
    left: 0,
    top: 50,
    width: 120,
    height: 120,
  },
  rightSideDoodle: {
    position: 'absolute',
    right: 0,
    bottom: 100,
    width: 120,
    height: 120,
  },
  
  // Central Doodle - Increased by 50%
  centralDoodleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  centralQubeDoodle: {
    width: 200,
    height: 180,
  },

  // Decorative Elements
  decorativeDoodle: {
    width: 15,
    height: 15,
    backgroundColor: '#54AF60',
    borderRadius: 8,
  },
  decorativeImage: {
    width: 30,
    height: 30,
  },
  decorativeImageWithIcon: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  decorativeImageBackground: {
    width: 45,
    height: 45,
    position: 'absolute',
  },
  decorativeIcon: {
    position: 'absolute',
    zIndex: 2,
  },

  doodleBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 10,
  },
  doodleCharacterImage: {
    width: 150,
    height: 150,
  },
  doodleFacePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#54AF60',
    justifyContent: 'center',
    alignItems: 'center',
  },
  doodleText: {
    fontSize: 40,
    color: '#000000',
  },

  bottomStepCard: {
    backgroundColor: '#232323',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  stepLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'left',
  },
  stepCardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#54AF60',
    textAlign: 'left',
    marginBottom: 12,
  },
  stepCardDescription: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 22,
    marginBottom: 20,
  },
  progressIndicator: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 25,
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: '#666666',
  },
  progressDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#54AF60',
    marginHorizontal: 8,
  },
  nextButton: {
    backgroundColor: '#54AF60',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingLeft:10
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 100,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  stepBadge: {
    alignSelf: 'center',
    backgroundColor: '#54AF60',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 40,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepIllustration: {
    alignItems: 'center',
    marginBottom: 40,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F0F9F0',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#54AF60',
    borderStyle: 'dashed',
  },
  illustrationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#54AF60',
    textAlign: 'center',
  },
  illustrationSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#232323',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 30,
  },
  stepDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  stepButton: {
    backgroundColor: '#54AF60',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 40,
  },
  stepButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },

  // Common Styles
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#54AF60',
  },
  inactiveDot: {
    backgroundColor: '#E0E0E0',
  },
  buttonIcon: {
    marginLeft: 4,
  },

  // Legacy styles (keeping for compatibility)
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: '#481B5EE5',

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
    tintColor: '#E5C47F',
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

});

export default OnboardingScreen;