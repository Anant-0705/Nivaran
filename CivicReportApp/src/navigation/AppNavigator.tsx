import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import ReportIssueScreen from '../screens/ReportIssueScreen';
import RewardsScreen from '../screens/RewardsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProgressScreen from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Custom Tab Bar Button Component
const CustomTabBarButton = ({ route, focused, color, size }: any) => {
  let iconName: keyof typeof Ionicons.glyphMap = 'home';
  let label = '';

  if (route.name === 'Map') {
    iconName = focused ? 'map' : 'map-outline';
    label = 'Home';
  } else if (route.name === 'Report') {
    iconName = focused ? 'camera' : 'camera-outline';
    label = 'Report';
  } else if (route.name === 'Progress') {
    iconName = focused ? 'stats-chart' : 'stats-chart-outline';
    label = 'Stats';
  } else if (route.name === 'Rewards') {
    iconName = focused ? 'trophy' : 'trophy-outline';
    label = 'Trophy';
  }

  if (focused) {
    return (
      <View style={pillStyles.activePill}>
        <Ionicons name={iconName} size={20} color="#ffffff" />
        <Text style={pillStyles.activeLabel}>{label}</Text>
      </View>
    );
  }

  return <Ionicons name={iconName} size={24} color="#666" />;
};

const pillStyles = StyleSheet.create({
  activePill: {
    backgroundColor: '#481B5EE5',
    borderRadius: 42,
    paddingHorizontal: 10,
    paddingVertical: 4,
   
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 90,
  },
  activeLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => (
        <CustomTabBarButton 
          route={route} 
          focused={focused} 
          color={color} 
          size={size} 
        />
      ),
      tabBarStyle: {
        position: 'absolute',
        bottom: 20,
        left: 160,
        right: 160,
        borderRadius: 30,
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
        height: 70,
        borderTopWidth: 0,
        paddingBottom: 10,
        paddingTop: 10,
        paddingLeft:16,
        paddingRight:16,
       
      },
      tabBarActiveTintColor: '#481B5EE5',
      tabBarInactiveTintColor: '#666',
      headerShown: false,
      tabBarShowLabel: false,
      tabBarItemStyle: {
        paddingVertical: 5,
      },
    })}
  >
    <Tab.Screen name="Map" component={MapScreen} />
    <Tab.Screen name="Report" component={ReportIssueScreen} />
    <Tab.Screen name="Progress" component={ProgressScreen} />
    <Tab.Screen name="Rewards" component={RewardsScreen} />
  </Tab.Navigator>
);

const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="MainTabs" 
      component={MainTabs} 
      options={{ headerShown: false }} 
    />
    <Stack.Screen 
      name="ProfileModal" 
      component={ProfileScreen} 
      options={{ 
        presentation: 'modal',
        headerShown: true,
        headerTitle: 'Profile',
        headerStyle: {
          backgroundColor: '#000000',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }} 
    />
  </Stack.Navigator>
);

interface AppNavigatorProps {
  isAuthenticated: boolean;
  hasCompletedOnboarding?: boolean;
}

const AppNavigator: React.FC<AppNavigatorProps> = ({ isAuthenticated, hasCompletedOnboarding = true }) => {
  console.log('📱 AppNavigator rendering with isAuthenticated:', isAuthenticated);
  
  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <>
          {console.log('📱 Rendering MainStack (authenticated)')}
          <MainStack />
        </>
      ) : (
        <>
          {console.log('📱 Rendering AuthStack (not authenticated)')}
          <AuthStack />
        </>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
