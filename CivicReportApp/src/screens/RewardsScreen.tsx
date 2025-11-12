import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/authService';
import { RewardService } from '../services/rewardService';
import { User, Reward } from '../types';

const RewardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      
      if (user) {
        await loadRewards(user.id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRewards = async (userId: string) => {
    try {
      const result = await RewardService.getUserRewards(userId);
      setRewards(result.rewards || []);
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards([]);
    }
  };

  const navigateToProfile = () => {
    // @ts-ignore
    navigation.navigate('ProfileModal');
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const getPointsLevel = (points: number) => {
    if (points >= 1000) return { level: 'Diamond', icon: 'diamond', color: '#B9F2FF' };
    if (points >= 500) return { level: 'Gold', icon: 'medal', color: '#FFD700' };
    if (points >= 250) return { level: 'Silver', icon: 'medal', color: '#C0C0C0' };
    if (points >= 100) return { level: 'Bronze', icon: 'medal', color: '#CD7F32' };
    return { level: 'Beginner', icon: 'leaf', color: '#90EE90' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#999" />
        <Text style={styles.errorText}>Please log in to view your rewards</Text>
      </View>
    );
  }

  const userLevel = getPointsLevel(currentUser.points);

  const badges = [
    { id: 1, title: 'First Report Submitted', description: 'Submit your first report', earned: rewards.some(r => r.reason.includes('reported')), icon: 'flag', color: '#FF6B35' },
    { id: 2, title: 'Beginner Reporter', description: 'Report 5 issues in the community', earned: rewards.filter(r => r.reason.includes('reported')).length >= 5, icon: 'medal', color: '#4ECDC4' },
    { id: 3, title: 'Community Helper', description: 'Upvote 10 community issues', earned: rewards.filter(r => r.reason.includes('upvoted')).length >= 10, icon: 'thumbs-up', color: '#45B7D1' },
    { id: 4, title: 'Active Citizen', description: 'Active for 30 days', earned: Math.ceil((Date.now() - new Date(currentUser.created_at).getTime()) / (1000 * 60 * 60 * 24)) >= 30, icon: 'time', color: '#9B59B6' },
  ];

  const recentActivities = [
    { id: 1, title: 'Garbage Overflow', description: 'Broken Streetlight', status: 'resolved', avatar: '🗑️', time: '2 min ago' },
    { id: 2, title: 'Broken Streetlight', description: 'Broken Streetlight', status: 'in_progress', avatar: '💡', time: '1 hour ago' },
  ];

  const earnPointsData = [
    { title: 'Report Issue', subtitle: 'Help make your community better by reporting issues', points: '+10 Points', icon: 'flag', color: '#FF6B35' },
    { title: 'Submit Valid Report', subtitle: 'Submit reports that get verified by the community', points: '+20 Points', icon: 'checkmark-circle', color: '#4ECDC4' },
    { title: 'Upvote Others Issues', subtitle: 'Support important issues by voting them up', points: '+5 Points', icon: 'thumbs-up', color: '#45B7D1' },
  ];

  return (
    <ImageBackground
      source={require('../../assets/bgimage.png')}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="#006C48" />
      
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
            <Text style={styles.nivaranSubtitle}>YOUR PROGRESS</Text>
          </View>
        </View>

        <View style={styles.contentBackground}>
          {/* Level Card */}
          <View style={styles.levelCard}>
            <View style={styles.levelBadge}>
              <Ionicons name={userLevel.icon as any} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.levelPoints}>{currentUser.points}</Text>
            <Text style={styles.levelPointsLabel}>XP Points</Text>
            <Text style={styles.levelTitle}>{userLevel.level}</Text>
          </View>

          {/* Your Achievements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Achievements</Text>
            <Text style={styles.sectionSubtitle}>See what you've accomplished since you're helping the community.</Text>
            
            <View style={styles.achievementsGrid}>
              <View style={styles.achievementCard}>
                <Text style={styles.achievementNumber}>
                  {String(rewards.filter(r => r.reason.includes('reported')).length).padStart(2, '0')}
                </Text>
                <Text style={styles.achievementLabel}>Issues Reported</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementNumber}>
                  {String(rewards.filter(r => r.reason.includes('upvoted')).length).padStart(2, '0')}
                </Text>
                <Text style={styles.achievementLabel}>Issues Upvoted</Text>
              </View>

              <View style={styles.achievementCard}>
                <Text style={styles.achievementNumber}>
                  {String(Math.ceil((Date.now() - new Date(currentUser.created_at).getTime()) / (1000 * 60 * 60 * 24))).padStart(2, '0')}
                </Text>
                <Text style={styles.achievementLabel}>Days Active</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity style={styles.rewardsButton}>
                <Text style={styles.rewardsButtonText}>Rewards</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>Stay informed about your recent reports and actions.</Text>
            
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityAvatar}>
                  <Text style={styles.activityEmoji}>{activity.avatar}</Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>
                <View style={styles.activityStatus}>
                  <View style={[styles.statusDot, { backgroundColor: activity.status === 'resolved' ? '#4ECDC4' : '#FFD93D' }]} />
                </View>
              </View>
            ))}
          </View>

          {/* Your Badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Badges</Text>
            <Text style={styles.sectionSubtitle}>Celebrate the milestones you've reached.</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesContainer}>
              {badges.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardDisabled]}>
                  <View style={[styles.badgeIcon, { backgroundColor: badge.earned ? badge.color : '#E0E0E0' }]}>
                    <Ionicons 
                      name={badge.icon as any} 
                      size={24} 
                      color={badge.earned ? '#FFFFFF' : '#999999'} 
                    />
                  </View>
                  <Text style={[styles.badgeTitle, !badge.earned && styles.badgeTitleDisabled]}>
                    {badge.title}
                  </Text>
                  <Text style={[styles.badgeDescription, !badge.earned && styles.badgeDescriptionDisabled]}>
                    {badge.description}
                  </Text>
                  {badge.earned && (
                    <View style={styles.earnedBadge}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

          {/* How To Earn Points */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How To Earn Points?</Text>
            
            {earnPointsData.map((item, index) => (
              <View key={index} style={styles.earnPointItem}>
                <View style={[styles.earnPointIcon, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <View style={styles.earnPointContent}>
                  <Text style={styles.earnPointTitle}>{item.title}</Text>
                  <Text style={styles.earnPointSubtitle}>{item.subtitle}</Text>
                </View>
                <Text style={styles.earnPointPoints}>{item.points}</Text>
              </View>
            ))}
          </View>
          
          {/* Bottom Spacing for Navigation */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#006C48',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
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
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E5C47F',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  infoButton: {
    padding: 4,
  },
  contentBackground: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 10,
    paddingTop: 20,
  },
  levelCard: {
    backgroundColor: '#006C48',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  levelPoints: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  levelPointsLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 10,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E5C47F',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  rewardsButton: {
    backgroundColor: '#006C48',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rewardsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  achievementsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievementCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  achievementNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  achievementLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  activityStatus: {
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgesContainer: {
    paddingVertical: 10,
  },
  badgeCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 140,
    alignItems: 'center',
    position: 'relative',
  },
  badgeCardDisabled: {
    opacity: 0.6,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  badgeTitleDisabled: {
    color: '#999',
  },
  badgeDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  badgeDescriptionDisabled: {
    color: '#BBB',
  },
  earnedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earnPointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  earnPointIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  earnPointContent: {
    flex: 1,
  },
  earnPointTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  earnPointSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  earnPointPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  bottomSpacing: {
    height: 100, // Space for navigation bar
  },
});

export default RewardsScreen;