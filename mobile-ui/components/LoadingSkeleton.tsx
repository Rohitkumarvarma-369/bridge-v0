import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../constants/Colors';

interface LoadingSkeletonProps {
  text?: string;
}

export default function LoadingSkeleton({ text = "Hold tight, while we bridge the worlds!" }: LoadingSkeletonProps) {
  const [animation] = useState(new Animated.Value(0));
  
  useEffect(() => {
    // Create a looping animation for the dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacityDot1 = animation.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.3, 1, 0.3],
  });
  
  const opacityDot2 = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });
  
  const opacityDot3 = animation.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.text}>{text}</Text>
      </View>
      <View style={styles.dotsContainer}>
        <Animated.View style={[styles.dot, { opacity: opacityDot1 }]} />
        <Animated.View style={[styles.dot, { opacity: opacityDot2 }]} />
        <Animated.View style={[styles.dot, { opacity: opacityDot3 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    maxWidth: '80%',
    marginRight: 50,
    marginVertical: 5,
  },
  textContainer: {
    marginBottom: 8,
  },
  text: {
    color: Colors.black,
    fontFamily: 'Montserrat_500Medium',
    fontSize: 16,
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.yellow,
    marginHorizontal: 3,
  }
}); 