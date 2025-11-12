import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SetupGuideScreen: React.FC = () => {
  const openSupabase = () => {
    Linking.openURL('https://supabase.com');
  };

  const openGitHub = () => {
    Linking.openURL('https://github.com');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="construct" size={80} color="#007AFF" />
        <Text style={styles.title}>Setup Required</Text>
        <Text style={styles.subtitle}>Configure Supabase to get started</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Supabase Project</Text>
            <Text style={styles.stepDescription}>
              Sign up at supabase.com and create a new project
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Configure Database</Text>
            <Text style={styles.stepDescription}>
              Run the SQL commands from SUPABASE_SETUP.md
            </Text>
          </View>
        </View>

        <View style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Update Credentials</Text>
            <Text style={styles.stepDescription}>
              Add your Supabase URL and key to src/services/supabase.ts
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={openSupabase}>
            <Ionicons name="globe" size={20} color="white" />
            <Text style={styles.buttonText}>Open Supabase</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={openGitHub}>
            <Ionicons name="document-text" size={20} color="#007AFF" />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>View Setup Guide</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <Text style={styles.infoText}>
            This demo app requires Supabase backend configuration. Follow the setup guide to enable all features.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 40,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttons: {
    marginTop: 30,
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  info: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default SetupGuideScreen;