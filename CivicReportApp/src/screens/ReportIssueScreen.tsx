import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  StatusBar,
  ImageBackground,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { IssueService } from '../services/issueService';
import { LocationService } from '../services/locationService';
import { AuthService } from '../services/authService';
import { Issue } from '../types';

type RootStackParamList = {
  ProfileModal: undefined;
  // Add other routes here if needed
};

const ReportIssueScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  
  // All state variables declared at the top
  const [reportGenerated, setReportGenerated] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Issue['category']>('infrastructure');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [photoHovered, setPhotoHovered] = useState(false);

  // AI verification states
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'success' | 'fail'>('idle');
  const [verificationConfidence, setVerificationConfidence] = useState<number | null>(null);
  const [verifiedLabel, setVerifiedLabel] = useState<string | null>(null);

  // useEffect hooks
  useEffect(() => {
    getCurrentUser();
    getCurrentLocation();
  }, []);

  // All functions defined before the return statement
  const getCurrentUser = async () => {
    const user = await AuthService.getCurrentUser();
    setCurrentUser(user);
  };

  const navigateToProfile = () => {
    console.log('🎯 Navigating to profile modal');
    navigation.navigate('ProfileModal');
  };

  const getCurrentLocation = async () => {
    try {
      const currentLocation = await LocationService.getCurrentLocation();
      setLocation(currentLocation);

      const addressText = await LocationService.reverseGeocode(
        currentLocation.latitude,
        currentLocation.longitude
      );
      if (addressText) {
        setAddress(addressText);
      }
    } catch (error) {
      Alert.alert('Location Error', 'Unable to get current location. Please enable location services.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        setVerificationStatus('idle'); // reset verification if new photo chosen
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhoto(result.assets[0].uri);
        setVerificationStatus('idle');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const showImagePicker = () => {
    Alert.alert('Select Photo', 'Choose how you want to add a photo', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const verifyPhoto = async () => {
    if (!photo) {
      Alert.alert('No photo', 'Please add a photo first');
      return;
    }

    try {
      setVerificationStatus('pending');

      const formData = new FormData();
      formData.append('photo', {
        uri: photo,
        name: 'photo.jpg',
        type: 'image/jpeg',
      } as any);

      // Call backend server using computer's IP address for mobile access
      const res = await fetch('http://192.168.10.146:1200/api/ai/verify', {

        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
      body: formData,
      });

      if (!res.ok) throw new Error(`Verification failed: ${res.status}`);

      const data = await res.json();

      setVerificationConfidence(data.confidence ?? null);
      setVerifiedLabel(data.label ?? null);

      if (data.verified) {
        setVerificationStatus('success');
        // Update title state with verified label if it exists
        if (data.label) {
          setTitle(data.label);
        }
      } else {
        setVerificationStatus('fail');
      }
    } catch (err) {
      console.error('Verify error:', err);
      Alert.alert('Verification error', 'Could not verify image. Try again.');
      setVerificationStatus('fail');
    }
  };

  // Function to clean up markdown/HTML tags and format text properly
  const cleanMarkdownText = (text: string): string => {
    return text
      // Remove HTML tags like <br>, <br/>, etc.
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      // Clean up markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold **text**
      .replace(/\*(.*?)\*/g, '$1') // Remove italic *text*
      .replace(/#{1,6}\s*/g, '') // Remove heading markers
      // Clean up extra whitespace and newlines
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
      .replace(/^\s+|\s+$/g, '') // Trim whitespace from start and end
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      // Fix common formatting issues
      .replace(/\|\s*/g, '') // Remove table separators
      .replace(/^\s*[-]{3,}\s*$/gm, '') // Remove horizontal rules
      .trim();
  };

  const generateReport = async () => {
    if (!title.trim() || !photo || !category) {
      Alert.alert('Error', 'Please provide all required fields (photo, title, category)');
      return;
    }
    setLoading(true);
    try {
      // Prepare prompt for Groq
      const prompt = `Generate a detailed civic issue report for: ${title}
      Category: ${category}
      
      Please provide a clear, professional description of this ${category} issue. Focus on:
      1. What the issue is and its severity
      2. How it affects the community
      3. Potential risks or consequences if not addressed
      4. Any visible details from the image
      
      Write in a formal report style, use clear paragraphs, and avoid using markdown formatting or HTML tags. Keep the language professional and factual.`;

      // Use GROQ_API_KEY from env
      const groqApiKey = process.env.GROQ_API_KEY;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [
            { 
              role: 'system', 
              content: 'You are a professional civic issue report writer. Write clear, factual descriptions without using markdown formatting, HTML tags, or special characters. Use plain text with proper paragraph breaks.' 
            },
            { role: 'user', content: prompt },
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
      });

      if (!response.ok) throw new Error('Groq API error: ' + response.status);
      const data = await response.json();
      const generatedDescription = data.choices?.[0]?.message?.content || '';
      
      // Clean up the generated text
      const cleanedDescription = cleanMarkdownText(generatedDescription);
      setDescription(cleanedDescription);
      setReportGenerated(true);
    } catch (err) {
      console.error('Groq error:', err);
      Alert.alert('Error', 'Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in title and description');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to report issues');
      return;
    }

    if (verificationStatus !== 'success') {
      Alert.alert('Error', 'Please verify the photo before submitting.');
      return;
    }

    setLoading(true);
    try {
      if (!location) {
        Alert.alert('Error', 'Location is required to submit a report');
        return;
      }

      const issueData = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: address || undefined,
        },
        images: photo ? [photo] : [],
        audio_url: undefined,
        user_id: currentUser.id,
      };

      const { issue, error } = await IssueService.createIssue(issueData);

      if (error) {
        Alert.alert('Error', 'Failed to submit report');
      } else {
        Alert.alert('Success', 'Issue reported successfully!', [
          {
            text: 'OK',
            onPress: resetForm,
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('infrastructure');
    setPhoto(null);
    setVerificationStatus('idle');
    setReportGenerated(false);
  };

  const categories = [
    { label: 'Infrastructure', value: 'infrastructure', icon: 'construct', description: 'Report issues like roads, drains, water, and electricity.' },
    { label: 'Safety', value: 'safety', icon: 'shield-checkmark', description: 'Highlight broken lights, unsafe spots, or hazards.' },
    { label: 'Environment', value: 'environment', icon: 'leaf', description: 'Report garbage, pollution, and green space concerns.' },
    { label: 'Transport', value: 'transport', icon: 'car', description: 'Flag parking traffic signals, and public transport issues.' },
  ];

  return (
    <ImageBackground
      source={require('../../assets/bgimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="#006C48" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerContent}>
          {/* Profile and Notification Row */}
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={navigateToProfile} style={styles.profileButton}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileInitial}>
                  {currentUser?.name?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.locationLabel}>Ghaziabad</Text>
                <Text style={styles.welcomeText}>
                  Welcome {currentUser?.name?.split(' ')[0] || 'User'}!
                </Text>
                <Text style={styles.locationSubtext}>Report civic issues easily</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.notificationButton, { backgroundColor: 'white' }]}>
              <Ionicons name="notifications-outline" size={24} color="#000000" />
            </TouchableOpacity>
            </View>

          {/* Logo at the top */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.headerLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* 3 Steps Section */}
          <View style={styles.stepsContainer}>
            <View style={styles.stepsTitleContainer}>
              <Text style={styles.stepsTitle}>REPORT YOUR ISSUE IN 3 STEPS</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stepsScrollContainer}
            >
              <View style={styles.stepCard}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="camera" size={32} color="#006C48" />
                </View>
                <Text style={styles.stepTitle}>Capture the Issue</Text>
                <Text style={styles.stepDescription}>Click a photo of the problem that needs to be reported</Text>
              </View>
              
              <View style={styles.stepCard}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="cloud-upload" size={32} color="#006C48" />
                </View>
                <Text style={styles.stepTitle}>Upload the details</Text>
                <Text style={styles.stepDescription}>Upload your image and fill in the category</Text>
              </View>

              <View style={styles.stepCard}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="send" size={32} color="#006C48" />
                </View>
                <Text style={styles.stepTitle}>Submit</Text>
                <Text style={styles.stepDescription}>Submit your report and track the progress</Text>
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.contentBackground}>
          {/* Photo Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Photo<Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.photoContainer, photoHovered && styles.photoContainerHovered]}
              onPress={showImagePicker}
              onPressIn={() => setPhotoHovered(true)}
              onPressOut={() => setPhotoHovered(false)}
            >
              {photo ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.removePhotoButton} onPress={() => setPhoto(null)}>
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={48} color={photoHovered ? '#E5C47F' : '#999'} />
                  <Text style={[styles.photoPlaceholderText, photoHovered && { color: '#E5C47F' }]}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Verify Image button below photo section */}
            {photo && (
              <>
                <TouchableOpacity
                  style={[
                    styles.verifyImageButton,
                    verificationStatus === 'success' && styles.verifyImageButtonSuccess,
                    verificationStatus === 'fail' && styles.verifyImageButtonFail,
                    verificationStatus === 'pending' && styles.verifyImageButtonDisabled
                  ]}
                  onPress={verifyPhoto}
                  disabled={verificationStatus === 'pending'}
                >
                  <Text style={styles.verifyImageButtonText}>
                    {verificationStatus === 'success' ? 'Image Verified': verificationStatus === 'fail' ? 'Not Verified':verificationStatus === 'pending'? 'Verifying...':'Upload Image'}
                  </Text>
                  {verificationStatus === 'success' && (
                    <Ionicons name="checkmark-circle" size={20} color="white" style={styles.verifyImageButtonIcon} />
                  )}
                  {verificationStatus === 'fail' && (
                    <Ionicons name="close-circle" size={20} color="white" style={styles.verifyImageButtonIcon} />
                  )}
                </TouchableOpacity>
                <View style={{ height: 12 }} />
              </>
            )}
            
            <TextInput
              style={styles.textInput}
              value={verificationStatus === 'success' && verifiedLabel ? verifiedLabel : title}
              onChangeText={setTitle}
              placeholder="Give it a short title"
              placeholderTextColor="#999"
            />
          </View>
          
          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Location<Text style={styles.required}>*</Text></Text>
            <View style={styles.locationContainer}>
              <Text style={styles.locationText}>
                {address || 'Fetching your location'}
              </Text>
              {!address && (
                <TouchableOpacity onPress={getCurrentLocation} style={styles.refreshButton}>
                  <Ionicons name="refresh" size={16} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Choose a category<Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.categoriesContainer}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    category === cat.value && styles.categoryButtonSelected,
                    hoveredCategory === cat.value && styles.categoryButtonHovered,
                  ]}
                  onPress={() => setCategory(cat.value as Issue['category'])}
                  onPressIn={() => setHoveredCategory(cat.value)}
                  onPressOut={() => setHoveredCategory(null)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === cat.value || hoveredCategory === cat.value ? '#000' : '#666'}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      (category === cat.value || hoveredCategory === cat.value) && styles.categoryLabelSelected,
                    ]}
                  >
                    {cat.label}
                  </Text>
                  <Text
                    style={[
                      styles.categoryDescription,
                      (category === cat.value || hoveredCategory === cat.value) &&
                        styles.categoryDescriptionSelected,
                    ]}
                  >
                    {cat.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Submit Button */}
          {reportGenerated ? (
            <View style={{ marginTop: 16, paddingBottom: 100 }}>
              <Text style={styles.reportLabel}>Generated Report:</Text>
              <View style={styles.reportContainer}>
                <ScrollView 
                  style={styles.reportScrollView}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled={true}
                >
                  <Text style={styles.reportText}>{description}</Text>
                </ScrollView>
              </View>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={submitReport}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit Report'}</Text>
                <Ionicons name="checkmark" size={20} color="white" style={styles.submitButtonIcon} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ paddingBottom: 100 }}>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (loading || verificationStatus !== 'success') && styles.submitButtonDisabled,
                ]}
                onPress={generateReport}
                disabled={loading || verificationStatus !== 'success'}
              >
                <Text style={styles.submitButtonText}>{loading ? 'Generating...' : 'Generate Report'}</Text>
                <Ionicons name="arrow-forward" size={20} color="white" style={styles.submitButtonIcon} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  reportLabel: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 20,
    color: '#333',
  },
  reportContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 20,
    marginHorizontal: 20,
    minHeight: 200,        // Changed: Added minimum height
    maxHeight: 400,        // Changed: Increased from 250 to 400
    borderWidth: 1,
    borderColor: '#e1e1e1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  reportScrollView: {
    flex: 1,
    padding: 16,
  },
  reportText: {
    fontSize: 15,
    lineHeight: 22,       // Good line height for readability
    color: '#333',
    textAlign: 'justify',
  },
  
  // Verify Image button styles
  verifyImageButton: {
    backgroundColor: '#006C48',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  verifyImageButtonSuccess: {
    backgroundColor: '#006C48',
  },
  verifyImageButtonFail: {
    backgroundColor: '#FF6B6B',
  },
  verifyImageButtonDisabled: {
    backgroundColor: '#A8E6CF',
  },
  verifyImageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyImageButtonIcon: {
    marginLeft: 8,
  },
  
  // Photo section styles
  photoContainer: {
    backgroundColor: '#eefff0ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  photoContainerHovered: { 
    backgroundColor: 'rgba(48, 1, 84, 0.8)', 
    borderColor: 'rgba(48, 1, 84, 0.8)' 
  },
  photoPreview: { 
    position: 'relative' 
  },
  photoImage: { 
    width: '100%', 
    height: 160, 
    resizeMode: 'cover' 
  },
  removePhotoButton: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    backgroundColor: 'white', 
    borderRadius: 12 
  },
  photoPlaceholder: { 
    height: 160, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  photoPlaceholderText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#999', 
    fontWeight: '500' 
  },
  textInput: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: { 
    height: 100, 
    textAlignVertical: 'top' 
  },
  
  container: { 
    flex: 1 
  },
  content: { 
    flex: 1 
  },
  
  // Header styles
  headerContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
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
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogo: {
    width: 60,
    height: 60,
    tintColor: '#006C48',
  },
  
  // 3 Steps section
  stepsContainer: {
    marginBottom: 20,
  },
  stepsTitleContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 15,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#006C48',
    textAlign: 'center',
    letterSpacing: 1,
  },
  stepsScrollContainer: {
    paddingHorizontal: 10,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    width: 140,
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#006C48',
    textAlign: 'center',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  
  contentBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
    minHeight: 600,
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#481B5EE5',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  required: {
    color: '#E53E3E',
  },
 
  locationContainer: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  refreshButton: {
    padding: 4,
  },

  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#eefff0ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'flex-start',
  },
  categoryButtonSelected: {
    backgroundColor: '#006C48',
    borderColor: '#006C48',
  },
  categoryButtonHovered: {
    backgroundColor:'#006C48',
    borderColor: '#006C48',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  categoryLabelSelected: {
    color: 'white',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  categoryDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#006C48',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: { 
    backgroundColor: '#A8E6CF' 
  },
  submitButtonText: { 
    color: 'white', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  submitButtonIcon: { 
    marginLeft: 8 
  },

  // Action buttons container
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#006C48',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#006C48',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default ReportIssueScreen;