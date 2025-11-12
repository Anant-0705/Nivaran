import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../services/supabase';

// Add this as a temporary debug component in your App.tsx or create a separate screen

const SessionDebugScreen = () => {
  const [sessionInfo, setSessionInfo] = React.useState<any>(null);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase!.auth.getSession();
      console.log('Session check:', { session, error });
      setSessionInfo({ session: session?.user, error });
    } catch (err) {
      console.error('Session check error:', err);
      setSessionInfo({ error: err });
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase!.auth.refreshSession();
      console.log('Session refresh result:', { data, error });
      await checkSession();
    } catch (err) {
      console.error('Session refresh error:', err);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Debug</Text>
      
      <TouchableOpacity style={styles.button} onPress={checkSession}>
        <Text style={styles.buttonText}>Check Session</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={refreshSession}>
        <Text style={styles.buttonText}>Refresh Session</Text>
      </TouchableOpacity>
      
      <View style={styles.info}>
        <Text style={styles.infoText}>
          {sessionInfo ? JSON.stringify(sessionInfo, null, 2) : 'No session info'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  info: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default SessionDebugScreen;