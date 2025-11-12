import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  StatusBar,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Issue } from '../types';
import { IssueService } from '../services/issueService';
import { LocationService } from '../services/locationService';
import { AuthService } from '../services/authService';
import GoogleMapComponent from '../components/GoogleMapComponent';

const MapScreen: React.FC = () => {
  const navigation = useNavigation();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [address, setAddress] = useState<string>('');
  const [storiesVisible, setStoriesVisible] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);

  useEffect(() => {
    initializeMap();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const user = await AuthService.getCurrentUser();
    setCurrentUser(user);
  };

  const initializeMap = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      
      // Get address for the location
      const addressText = await LocationService.reverseGeocode(
        location.latitude,
        location.longitude
      );
      if (addressText) {
        setAddress(addressText);
      }
      
      await loadIssues(location);
    } catch (error) {
      Alert.alert('Error', 'Unable to get location. Please enable location services.');
      // Load issues without location filter
      await loadIssues();
    } finally {
      setLoading(false);
    }
  };

  const loadIssues = async (location?: {latitude: number; longitude: number}) => {
    try {
      const { issues: fetchedIssues } = await IssueService.getIssues(location);
      setIssues(fetchedIssues || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const handleUpvote = async (issueId: string) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please log in to upvote issues');
      return;
    }

    try {
      const { error } = await IssueService.upvoteIssue(issueId, currentUser.id);
      if (error) {
        Alert.alert('Error', error === 'Already voted' ? 'You have already voted for this issue' : 'Failed to upvote');
      } else {
        // Refresh issues
        await loadIssues(currentLocation || undefined);
        Alert.alert('Success', 'Issue upvoted successfully!');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upvote issue');
    }
  };

  const handleMarkerPress = (issue: Issue) => {
    setSelectedIssue(issue);
    setModalVisible(true);
  };

  const navigateToProfile = () => {
    // @ts-ignore
    navigation.navigate('ProfileModal');
  };

  const categories = [
    { 
      id: 1, 
      name: 'Infrastructure', 
      icon: 'construct', 
      color: '#FF6B35',
      description: 'Roads, bridges, water, electricity',
      count: issues.filter(issue => issue.category === 'infrastructure').length
    },
    { 
      id: 2, 
      name: 'Safety', 
      icon: 'shield-checkmark', 
      color: '#9B59B6',
      description: 'Lighting, dangerous areas',
      count: issues.filter(issue => issue.category === 'safety').length
    },
    { 
      id: 3, 
      name: 'Environment', 
      icon: 'leaf', 
      color: '#27AE60',
      description: 'Pollution, waste management',
      count: issues.filter(issue => issue.category === 'environment').length
    },
    { 
      id: 4, 
      name: 'Transport', 
      icon: 'car', 
      color: '#3498DB',
      description: 'Traffic, parking, public transit',
      count: issues.filter(issue => issue.category === 'transport').length
    },
  ];

  const nearbyIssues = issues.slice(0, 3); // Show first 3 for "Issues around you"

  // Add static nearby issues for demonstration
  const staticNearbyIssues = [
    {
      id: 'nearby1',
      title: 'Broken Street Light',
      description: 'Street light has been broken for 3 days, making the area unsafe during night time.',
      category: 'safety',
      status: 'open',
      upvotes: 15,
      created_at: new Date().toISOString(),
      user_id: 'demo',
      latitude: 28.6692,
      longitude: 77.4538,
      address: 'Sector 15, Ghaziabad'
    },
    {
      id: 'nearby2',
      title: 'Garbage Overflow',
      description: 'Dustbin overflowing for past week, creating unhygienic conditions.',
      category: 'environment',
      status: 'in_progress',
      upvotes: 12,
      created_at: new Date().toISOString(),
      user_id: 'demo',
      latitude: 28.6692,
      longitude: 77.4538,
      address: 'Main Road, Ghaziabad'
    },
    {
      id: 'nearby3',
      title: 'Road Pothole',
      description: 'Large pothole causing traffic issues and vehicle damage.',
      category: 'infrastructure',
      status: 'open',
      upvotes: 8,
      created_at: new Date().toISOString(),
      user_id: 'demo',
      latitude: 28.6692,
      longitude: 77.4538,
      address: 'NH-24, Ghaziabad'
    }
  ];

  // Use static data if no real issues available
  const displayIssues = nearbyIssues.length > 0 ? nearbyIssues : staticNearbyIssues;

  // Static story data for demonstration
  const storyIssues = [
    {
      id: 'story1',
     title: 'Water Clogging on Road',
      description: 'Severe water logging due to blocked drainage system causing traffic jams and pedestrian inconvenience.',
      category: 'infrastructure',
      location: 'Sector 15, Ghaziabad',
      image: require('../../assets/flood.jpg'),
      reporter: 'Ankit Sharma',
      timeAgo: '2 hours ago',
      votes: { low: 2, medium: 8, high: 15 }
    },
    {
      id: 'story2', 
      title: 'Garbage Overflow',
      description: 'Dustbin overflowing for past week, creating unhygienic conditions and bad smell.',
      category: 'environment',
      location: 'Main Road, Ghaziabad',
      image: require('../../assets/garbage.jpg'),
      reporter: 'Priya Singh',
      timeAgo: '4 hours ago',
      votes: { low: 1, medium: 5, high: 12 }
    },
    {
      id: 'story3',
      title: 'Road Pothole',
      description: 'Large pothole causing traffic issues and vehicle damage on busy road.',
      category: 'infrastructure', 
      location: 'NH-24, Ghaziabad',
      image: require('../../assets/pothole.jpg'),
      reporter: 'Rajesh Kumar',
      timeAgo: '6 hours ago',
      votes: { low: 3, medium: 10, high: 8 }
    }
  ];

  const handleVoteStory = (issueId: string, severity: 'low' | 'medium' | 'high') => {
    console.log(`Voted ${severity} for issue ${issueId}`);
    // Add vote logic here
    nextStory();
  };

  const nextStory = () => {
    if (currentStoryIndex < storyIssues.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setStoryProgress(0);
    } else {
      // All stories completed, close modal
      setStoriesVisible(false);
      setCurrentStoryIndex(0);
      setStoryProgress(0);
    }
  };

  const closeStories = () => {
    setStoriesVisible(false);
    setCurrentStoryIndex(0);
    setStoryProgress(0);
  };

  const openStories = () => {
    setStoriesVisible(true);
    setCurrentStoryIndex(0);
    setStoryProgress(0);
  };

  const getCategoryBackground = (index: number) => {
    const backgrounds = ['#FFF2E6', '#F8E6F3', '#E6F3FF', '#E6FFF0'];
    return backgrounds[index % backgrounds.length];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FF6B6B';
      case 'in_progress': return '#FFD93D';
      case 'resolved': return '#6BCF7F';
      case 'closed': return '#95A5A6';
      default: return '#FF6B6B';
    }
  };

  const mapMarkers = issues
    .filter(issue => issue.latitude != null && issue.longitude != null)
    .map(issue => ({
      id: issue.id,
      position: { lat: issue.latitude!, lng: issue.longitude! },
      title: issue.title,
      description: issue.description,
      category: issue.category,
      onClick: () => handleMarkerPress(issue),
    }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/bgimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="#006C48" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <View style={styles.headerContent}>
          {/* Profile and Notification Row - Top Row */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={navigateToProfile} style={styles.topProfileButton}>
              <View style={styles.topProfileAvatar}>
                <Text style={styles.topProfileInitial}>
                  {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </Text>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.nivaranHeaderText}>NIVARAN</Text>
            
            <TouchableOpacity style={styles.topNotificationButton}>
              <Ionicons name="notifications-outline" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleContainer}>
            <Text style={styles.nivaranSubtitle}>MONITOR ISSUES IN YOUR COMMUNITY</Text>
          </View>
        </View>

        <View style={styles.contentBackground}>
          {/* Live Issue Tracking Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Live Issue Tracking</Text>
            
            <View style={styles.mapContainer}>
              {loading ? (
                <View style={styles.mapLoading}>
                  <ActivityIndicator size="large" color="#481B5EE5" />
                  <Text style={styles.loadingText}>Loading map...</Text>
                </View>
              ) : (
                <GoogleMapComponent
                  center={{
                    lat: currentLocation?.latitude || 28.6692,
                    lng: currentLocation?.longitude || 77.4538,
                  }}
                  zoom={14}
                  markers={mapMarkers}
                  style={styles.map}
                />
              )}
              
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => loadIssues(currentLocation || undefined)}
              >
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.mapDescription}>
              The map displays issues reported by people in your area. Click on the location markers on the map to view details and live status if it.
            </Text>
            
            <View style={styles.mapLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
                <Text style={styles.legendText}>Working Issues</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#27AE60' }]} />
                <Text style={styles.legendText}>Your Location</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3498DB' }]} />
                <Text style={styles.legendText}>Ongoing Issues</Text>
              </View>
            </View>
          </View>

          {/* Issues Around You Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issues around you</Text>
            <Text style={styles.sectionSubtitle}>See what others have reported and vote on their feedback about the issues.</Text>
            
            {displayIssues.length > 0 ? (
              <View style={styles.storyCardContainer}>
                <View style={styles.storyCard}>
                  <ImageBackground
                    source={require('../../assets/pothole.jpg')}
                    style={styles.storyCardImage}
                    resizeMode="cover"
                  >
                    <View style={styles.storyCardOverlay} />
                    
                    {/* Story Card Content */}
                    <View style={styles.storyCardContent}>
                      <View style={styles.storyCardHeader}>
                         <View style={styles.storyCardCategory}>
                          <Text style={styles.storyCardCategoryText}>Transport</Text>
                        </View>
                        <View style={styles.storyCardBadge}>
                          <Text style={styles.storyCardBadgeText}>Pothole on Main Road</Text>
                        </View>
                        <View style={styles.storyCardLocation}>
                          <Ionicons name="location-outline" size={12} color="rgba(255, 255, 255, 0.9)" />
                          <Text style={styles.storyCardLocationText}>Near Rajendra Nagar</Text>
                        </View>
                       
                      </View>
                      
                      <View style={styles.storyCardFooter}>
                        <Text style={styles.storyCardQuestion}>How big is the issue?</Text>
                        <TouchableOpacity 
                          style={styles.storyVoteButton}
                          onPress={openStories}
                        >
                          <Text style={styles.storyVoteButtonText}>Vote Now</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </ImageBackground>
                </View>
              </View>
            ) : (
              <View style={styles.emptyIssues}>
                <Ionicons name="map-outline" size={48} color="#ccc" />
                <Text style={styles.emptyIssuesText}>No issues reported nearby</Text>
                <Text style={styles.emptyIssuesSubtext}>Be the first to report an issue in your area!</Text>
              </View>
            )}
            
          
          </View>

          {/* Issue Categories Section */}
         
          
          {/* Bottom Spacing for Navigation */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Stories Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={storiesVisible}
        onRequestClose={closeStories}
      >
        <View style={styles.storiesContainer}>
          {storyIssues.length > 0 && (
            <View style={styles.storyWrapper}>
              {/* Story Progress Bar */}
              <View style={styles.progressBarContainer}>
                {storyIssues.map((_, index) => (
                  <View key={index} style={styles.progressBarWrapper}>
                    <View 
                      style={[
                        styles.progressBar,
                        {
                          backgroundColor: index < currentStoryIndex ? '#FFFFFF' : 
                                         index === currentStoryIndex ? '#FFFFFF80' : '#FFFFFF30'
                        }
                      ]} 
                    />
                  </View>
                ))}
              </View>

              {/* Close Button */}
              <TouchableOpacity style={styles.closeStoriesButton} onPress={closeStories}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Story Content */}
              <View style={styles.storyContent}>
                <ImageBackground
                  source={storyIssues[currentStoryIndex].image}
                  style={styles.storyImage}
                  resizeMode="cover"
                >
                  <View style={styles.storyOverlay} />
                  
                  {/* Story Header */}
                  <View style={styles.storyHeader}>
                    <View style={styles.storyReporter}>
                      <View style={styles.reporterAvatar}>
                        <Ionicons name="person" size={20} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text style={styles.reporterName}>{storyIssues[currentStoryIndex].reporter}</Text>
                        <Text style={styles.reporterTime}>{storyIssues[currentStoryIndex].timeAgo}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Story Details */}
                  <View style={styles.storyDetails}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>{storyIssues[currentStoryIndex].category}</Text>
                    </View>
                    <Text style={styles.storyTitle}>{storyIssues[currentStoryIndex].title}</Text>
                    <Text style={styles.storyDescription}>{storyIssues[currentStoryIndex].description}</Text>
                    <View style={styles.storyLocation}>
                      <Ionicons name="location" size={16} color="#FFFFFF" />
                      <Text style={styles.storyLocationText}>{storyIssues[currentStoryIndex].location}</Text>
                    </View>
                  </View>

                  {/* Voting Section */}
                  <View style={styles.votingSection}>
                    <Text style={styles.votingTitle}>How severe is this issue?</Text>
                    <View style={styles.votingButtons}>
                      <TouchableOpacity 
                        style={[styles.votingButton, { backgroundColor: '#4CAF50' }]}
                        onPress={() => handleVoteStory(storyIssues[currentStoryIndex].id, 'low')}
                      >
                        <Text style={styles.votingButtonText}>Low</Text>
                        <Text style={styles.votingCount}>{storyIssues[currentStoryIndex].votes.low}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.votingButton, { backgroundColor: '#FF9800' }]}
                        onPress={() => handleVoteStory(storyIssues[currentStoryIndex].id, 'medium')}
                      >
                        <Text style={styles.votingButtonText}>Medium</Text>
                        <Text style={styles.votingCount}>{storyIssues[currentStoryIndex].votes.medium}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.votingButton, { backgroundColor: '#F44336' }]}
                        onPress={() => handleVoteStory(storyIssues[currentStoryIndex].id, 'high')}
                      >
                        <Text style={styles.votingButtonText}>High</Text>
                        <Text style={styles.votingCount}>{storyIssues[currentStoryIndex].votes.high}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Issue Details Modal - keep existing modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedIssue && (
              <ScrollView>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedIssue.title}</Text>
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedIssue.status) }]}>
                    <Text style={styles.statusText}>{selectedIssue.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.category}>{selectedIssue.category}</Text>
                </View>

                <Text style={styles.description}>{selectedIssue.description}</Text>

                {selectedIssue.address && (
                  <Text style={styles.address}>📍 {selectedIssue.address}</Text>
                )}

                <View style={styles.metaInfo}>
                  <Text style={styles.metaText}>
                    Reported: {new Date(selectedIssue.created_at).toLocaleDateString()}
                  </Text>
                  <Text style={styles.metaText}>
                    👍 {selectedIssue.upvotes} upvotes
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.upvoteButton}
                  onPress={() => handleUpvote(selectedIssue.id)}
                >
                  <Ionicons name="thumbs-up" size={20} color="white" />
                  <Text style={styles.upvoteButtonText}>Upvote This Issue</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#481B5EE5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  headerContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  topProfileButton: {
    padding: 2,
  },
  topProfileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topProfileInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#006C48',
  },
  topNotificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nivaranHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  nivaranContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  nivaranTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitleContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 15,
  },
  nivaranSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#006C48',
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#006C48',
  },
  profileInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
    fontWeight: '500',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F5F5F5',
    marginBottom: 15,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#006C48',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mapDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  categoriesContainer: {
    paddingVertical: 10,
  },
  categoryCard: {
    width: 160,
    borderRadius: 15,
    padding: 20,
    marginRight: 15,
    position: 'relative',
    minHeight: 140,
  },
  categoryHeader: {
    marginBottom: 10,
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 14,
    marginBottom: 10,
  },
  categoryArrow: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: '#006C48',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCount: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  nearbyIssuesContainer: {
    marginBottom: 20,
  },
  nearbyIssueCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
  },
  issueImageContainer: {
    marginRight: 15,
  },
  issuePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueCardContent: {
    flex: 1,
  },
  issueCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  issueCardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 10,
  },
  issueCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  issueCardVotes: {
    fontSize: 12,
    color: '#666',
  },
  voteButton: {
    backgroundColor: '#006C48',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  voteButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyIssues: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIssuesText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyIssuesSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  viewMoreText: {
    fontSize: 16,
    color: '#006C48',
    fontWeight: '600',
    marginRight: 8,
  },
  // Modal styles (keep existing)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  metaInfo: {
    marginBottom: 20,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  upvoteButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  upvoteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100, // Space for navigation bar
  },
  
  // Story Card Styles
  storyCardContainer: {
    marginBottom: 20,
  },
  storyCard: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  storyCardImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  storyCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  storyCardContent: {
    padding: 20,
    justifyContent: 'space-between',
    flex: 1,
  },
  storyCardHeader: {
    flex: 1,
  },
  storyCardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 8,
  },
  storyCardBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
  },
  storyCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyCardLocationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  storyCardCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#006C48',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyCardCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',

  },
  storyCardFooter: {
    alignItems: 'center',
  },
  storyCardQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
  },
  storyVoteButton: {
    backgroundColor: '#006C48',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  storyVoteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Stories Modal Styles
  storiesContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  storyWrapper: {
    flex: 1,
  },
  progressBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    gap: 4,
  },
  progressBarWrapper: {
    flex: 1,
    height: 3,
    backgroundColor: '#FFFFFF30',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  closeStoriesButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyContent: {
    flex: 1,
  },
  storyImage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  storyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  storyHeader: {
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  storyReporter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reporterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  reporterTime: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  storyDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#006C48',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 15,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  storyDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 15,
  },
  storyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  storyLocationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 5,
  },
  votingSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  votingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  votingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  votingButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  votingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  votingCount: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});

export default MapScreen;