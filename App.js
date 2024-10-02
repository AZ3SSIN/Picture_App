import React, { useState, useEffect } from 'react';
import { View, Image, Button, StyleSheet, TouchableWithoutFeedback, Alert, Dimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';  // Import Haptics for vibration feedback

export default function App() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDimensions, setImageDimensions] = useState(null); // Store the width/height ratio
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Load saved image on app start
  useEffect(() => {
    const loadImage = async () => {
      try {
        const savedData = await AsyncStorage.getItem('imageData');
        if (savedData) {
          const { uri, dimensions } = JSON.parse(savedData);
          setSelectedImage(uri);
          setImageDimensions(dimensions); // Set the loaded dimensions
        } else {
          openGallery();
        }
      } catch (e) {
        console.log('Failed to load the image:', e);
      }
    };

    loadImage();  // Run the function
  }, []);

  // Pick an image from the gallery
  const openGallery = async (isFullScreen = true) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        alert('Permission to access the gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: isFullScreen, // Disable editing for default
        aspect: isFullScreen ? [screenWidth, screenHeight] : undefined, // No aspect if custom size
        quality: 1,
      });

      // Check if the operation was cancelled
      if (result.canceled) {
        return;
      }

      const imageAsset = result.assets && result.assets[0];
      if (!imageAsset || !imageAsset.uri) {
        alert('Image format not valid. Please try again.');
        return;
      }

      // Ensure the URI is not empty or just whitespace
      if (imageAsset.uri.trim() === '') {
        alert('Image URI is empty. Please try again.');
        return;
      }

      // Set the selected image and its dimensions
      setSelectedImage(imageAsset.uri);
      const dimensions = { width: imageAsset.width, height: imageAsset.height*1.1 };
      setImageDimensions(dimensions); // Save the image dimensions
      await AsyncStorage.setItem('imageData', JSON.stringify({ uri: imageAsset.uri, dimensions })); // Save the image URI and dimensions
    } catch (error) {
      console.log('Error picking image:', error);
      alert('An unidentified error occurred. Please try again.');
    }
  };

  // Long press handler to change the image with haptic feedback
  const handleLongPress = () => {
    // Trigger haptic feedback
    Haptics.selectionAsync();  // or Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Change Picture',
      'Select your picture size',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Full Screen', onPress: () => openGallery(true) },
        { text: 'Default', onPress: () => openGallery(false) },
      ]
    );
  };

  // Calculate the aspect ratio dynamically
  const calculateAspectRatio = () => {
    if (imageDimensions) {
      const ratio = imageDimensions.width / imageDimensions.height;
      return {
        width: screenWidth,
        height: screenWidth / ratio,  // Adjust height based on aspect ratio
      };
    }
    return { width: screenWidth, height: screenHeight * 1.1 };  // Default height for fullscreen
  };

  return (
    <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={600}>
      <View style={styles.container}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={[styles.image, calculateAspectRatio()]} />
        ) : (
          <Button title="Open Gallery" onPress={() => openGallery(true)} />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
});
