import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import WebRouteHandler from '../components/WebRouteHandler';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AuthCallbackScreen from '../screens/AuthCallbackScreen';
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
    label = 'Map';
  } else if (route.name === 'Report') {
    iconName = focused ? 'camera' : 'camera-outline';
    label = 'Home';
  } else if (route.name === 'Progress') {
    iconName = focused ? 'stats-chart' : 'stats-chart-outline';
    label = 'Stats';
  } else if (route.name === 'Rewards') {
    iconName = focused ? 'trophy' : 'trophy-outline';
    label = 'Trophy';
  }

  if (focused) {
    // Active tab: Show only text in pill, no icon
    return (
      <View style={pillStyles.activePill}>
        <Text style={pillStyles.activeLabel}>{label}</Text>
      </View>
    );
  }

  // Inactive tabs: Show only icon, no text
  return <Ionicons name={iconName} size={24} color="#666" />;
};

const pillStyles = StyleSheet.create({
  activePill: {
    backgroundColor: '#006C48',
    borderRadius: 42,

    paddingHorizontal: 18,
    paddingVertical: 16,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  activeLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
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

        left: 20,
        right: 20,

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

        paddingLeft:8,
        paddingRight:12,

      
       
      },
      tabBarActiveTintColor: '#006C48',
      tabBarInactiveTintColor: '#666',
      headerShown: false,
      tabBarShowLabel: false,
      tabBarItemStyle: {
        paddingVertical: 5,

      },
    })}
  >
    <Tab.Screen name="Report" component={ReportIssueScreen} />
    <Tab.Screen name="Map" component={MapScreen} />
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
    <WebRouteHandler>
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
    </WebRouteHandler>
  );
};

export default AppNavigator;