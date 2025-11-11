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
import { IssueService } from '../services/issueService';
import { LocationService } from '../services/locationService';
import { AuthService } from '../services/authService';
import { Issue } from '../types';

const ReportIssueScreen = () => {
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

      // Use your latest IPv4
      const res = await fetch('http://10.236.118.99:3000/api/ai/verify', {
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

  const generateReport = async () => {
    if (!title.trim() || !photo || !category) {
      Alert.alert('Error', 'Please provide all required fields (photo, title, category)');
      return;
    }
    setLoading(true);
    try {
      // Prepare prompt for Groq
      const prompt = `Generate a civic issue report.\nTitle: ${title}\nCategory: ${category}\nImage: ${photo}\nDescription: Write a detailed description for this issue including what is visible in the image.`;

      // Use GROQ_API_KEY from env
      const groqApiKey = process.env.GROQ_API_KEY;
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: 'You are an assistant that generates civic issue reports.' },
            { role: 'user', content: prompt },
          ],
          max_tokens: 512,
        }),
      });

      if (!response.ok) throw new Error('Groq API error: ' + response.status);
      const data = await response.json();
      const generatedDescription = data.choices?.[0]?.message?.content || '';
      setDescription(generatedDescription);
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

    if (!location) {
      Alert.alert('Error', 'Location is required to submit a report');
      return;
    }

    setLoading(true);
    try {
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
        verified: verificationStatus === 'success',
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
      source={{ uri: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3' }}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor='#481B5EE5' />
      <View style={styles.headerOverlay} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Report your issue</Text>
            <TouchableOpacity style={styles.infoButton}>
              <Ionicons name="information-circle-outline" size={24} color="#E5C47F" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Fast, simple, and effective reporting.</Text>
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
                    {verificationStatus === 'pending' ? 'Verifying...' : 'Verify Image'}
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
              <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, paddingHorizontal: 20 }}>Generated Report:</Text>
              <View style={{ backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, marginBottom: 16, marginHorizontal: 20 }}>
                <Text style={{ fontSize: 15 }}>{description}</Text>
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
  photoContainer: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  photoContainerHovered: { backgroundColor: 'rgba(48, 1, 84, 0.8)', borderColor: 'rgba(48, 1, 84, 0.8)' },
  photoPreview: { position: 'relative' },
  photoImage: { width: '100%', height: 160, resizeMode: 'cover' },
  removePhotoButton: { position: 'absolute', top: 12, right: 12, backgroundColor: 'white', borderRadius: 12 },
  photoPlaceholder: { height: 160, justifyContent: 'center', alignItems: 'center' },
  photoPlaceholderText: { marginTop: 12, fontSize: 16, color: '#999', fontWeight: '500' },
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
  textArea: { height: 100, textAlignVertical: 'top' },
  // Verify Image button styles
  verifyImageButton: {
    backgroundColor: '#6247EA',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginTop: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  verifyImageButtonSuccess: {
    backgroundColor: '#2ECC71',
  },
  verifyImageButtonFail: {
    backgroundColor: '#FF6B6B',
  },
  verifyImageButtonDisabled: {
    backgroundColor: '#B3A5F9',
  },
  verifyImageButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyImageButtonIcon: {
    marginLeft: 8,
  },
  container: { flex: 1 },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#481B5EE5',
  },
  headerContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
    zIndex: 1,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#E5C47F' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255, 255, 255, 0.8)' },
  infoButton: { padding: 4 },
  content: { flex: 1 },
  contentBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
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
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    alignItems: 'flex-start',
  },
  categoryButtonSelected: {
    backgroundColor: 'rgba(48, 1, 84, 0.8)',
    borderColor: 'rgba(48, 1, 84, 0.8)',
  },
  categoryButtonHovered: {
    backgroundColor:'rgba(48, 1, 84, 0.8)',
    borderColor: 'rgba(48, 1, 84, 0.8)',
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
    backgroundColor: '#6247EA',
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: { backgroundColor: '#B3A5F9' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  submitButtonIcon: { marginLeft: 8 },
});

export default ReportIssueScreen;