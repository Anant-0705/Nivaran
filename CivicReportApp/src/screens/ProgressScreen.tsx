import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Issue } from '../types';
import { IssueService } from '../services/issueService';
import { AuthService } from '../services/authService';
import { NavigationProp } from '@react-navigation/native';

interface ProgressScreenProps {
  navigation: NavigationProp<any>;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const [userIssues, setUserIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await loadUserIssues(user.id);
      }
    } catch (error) {
      console.error('Error initializing progress screen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserIssues = async (userId: string) => {
    try {
      // Get all issues and filter by user_id
      const { issues, error } = await IssueService.getIssues();
      
      if (error) {
        Alert.alert('Error', 'Failed to load your issues');
        return;
      }

      const filteredIssues = (issues || []).filter(issue => issue.user_id === userId);
      setUserIssues(filteredIssues);
    } catch (error) {
      console.error('Error loading user issues:', error);
      Alert.alert('Error', 'Failed to load your issues');
    }
  };

  const onRefresh = async () => {
    if (!currentUser) return;
    
    setRefreshing(true);
    await loadUserIssues(currentUser.id);
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#FF6B35';
      case 'in_progress': return '#FFD93D';
      case 'resolved': return '#4CAF50';
      case 'closed': return '#9E9E9E';
      default: return '#FF6B35';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return 'alert-circle';
      case 'in_progress': return 'hourglass';
      case 'resolved': return 'checkmark-circle';
      case 'closed': return 'close-circle';
      default: return 'alert-circle';
    }
  };

  const getProgressPercentage = () => {
    if (userIssues.length === 0) return 0;
    const resolvedCount = userIssues.filter(issue => issue.status === 'resolved').length;
    return Math.round((resolvedCount / userIssues.length) * 100);
  };

  const getStatusCounts = () => {
    return {
      open: userIssues.filter(issue => issue.status === 'open').length,
      in_progress: userIssues.filter(issue => issue.status === 'in_progress').length,
      resolved: userIssues.filter(issue => issue.status === 'resolved').length,
      closed: userIssues.filter(issue => issue.status === 'closed').length,
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your issues...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please log in to view your progress</Text>
      </View>
    );
  }

  const statusCounts = getStatusCounts();
  const progressPercentage = getProgressPercentage();

  return (
    <ImageBackground
      source={require('../../assets/bgimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="#006C48" translucent />
      <View style={styles.headerOverlay} />
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Content */}
        <View style={styles.headerContent}>
          {/* Profile and Notification Row - Top Row */}
          <View style={styles.topRow}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ProfileModal')} 
              style={styles.topProfileButton}
            >
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
            <Text style={styles.nivaranSubtitle}>TRACK YOUR PROGRESS</Text>
          </View>
        </View>

        <View style={styles.contentBackground}>

      {/* Progress Overview */}
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Overall Progress</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>{progressPercentage}% Resolved</Text>
        </View>
        <Text style={styles.progressSubtext}>
          {userIssues.length} total issues reported
        </Text>
      </View>

      {/* Status Summary */}
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Status Summary</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor('open') }]}>
              <Ionicons name={getStatusIcon('open')} size={20} color="white" />
            </View>
            <Text style={styles.statusCount}>{statusCounts.open}</Text>
            <Text style={styles.statusLabel}>Open</Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor('in_progress') }]}>
              <Ionicons name={getStatusIcon('in_progress')} size={20} color="white" />
            </View>
            <Text style={styles.statusCount}>{statusCounts.in_progress}</Text>
            <Text style={styles.statusLabel}>In Progress</Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor('resolved') }]}>
              <Ionicons name={getStatusIcon('resolved')} size={20} color="white" />
            </View>
            <Text style={styles.statusCount}>{statusCounts.resolved}</Text>
            <Text style={styles.statusLabel}>Resolved</Text>
          </View>
          
          <View style={styles.statusItem}>
            <View style={[styles.statusIcon, { backgroundColor: getStatusColor('closed') }]}>
              <Ionicons name={getStatusIcon('closed')} size={20} color="white" />
            </View>
            <Text style={styles.statusCount}>{statusCounts.closed}</Text>
            <Text style={styles.statusLabel}>Closed</Text>
          </View>
        </View>
      </View>

      {/* Issues List */}
      <View style={styles.issuesCard}>
        <Text style={styles.cardTitle}>Your Issues</Text>
        {userIssues.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No issues reported yet</Text>
            <Text style={styles.emptySubtext}>Start reporting issues to track their progress here</Text>
          </View>
        ) : (
          userIssues.map((issue) => (
            <View key={issue.id} style={styles.issueItem}>
              <View style={styles.issueHeader}>
                <Text style={styles.issueTitle} numberOfLines={2}>
                  {issue.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(issue.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(issue.status)} 
                    size={12} 
                    color="white" 
                    style={styles.statusBadgeIcon}
                  />
                  <Text style={styles.statusBadgeText}>
                    {issue.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.issueDescription} numberOfLines={2}>
                {issue.description}
              </Text>
              
              <View style={styles.issueFooter}>
                <Text style={styles.issueCategory}>
                  📋 {issue.category}
                </Text>
                <Text style={styles.issueDate}>
                  {new Date(issue.created_at).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={styles.issueStats}>
                <Text style={styles.issueStat}>
                  👍 {issue.upvotes || issue.votes || 0} votes
                </Text>
                {issue.address && (
                  <Text style={styles.issueStat} numberOfLines={1}>
                    📍 {issue.address}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
      
      {/* Bottom Spacing for Navigation */}
      <View style={styles.bottomSpacing} />
    </View>
      </ScrollView>
    </ImageBackground>
  );
};const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
   
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
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
  contentBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
  },
  progressCard: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issuesCard: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  progressSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  issueItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 15,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  statusBadgeIcon: {
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  issueDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  issueCategory: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
  issueDate: {
    fontSize: 12,
    color: '#999',
  },
  issueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  issueStat: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
    bottomSpacing: {
    height: 100, // Space for navigation bar
  },
});

export default ProgressScreen;