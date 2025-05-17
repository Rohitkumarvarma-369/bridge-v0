import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Colors from '../constants/Colors';

interface ProductImagesCarouselProps {
  images: string[];
  onSelectImage?: (image: string) => void;
}

const { width } = Dimensions.get('window');

export default function ProductImagesCarousel({ images, onSelectImage }: ProductImagesCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  
  const handleViewableItemsChanged = ({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  };

  const renderItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.imageContainer}
      onPress={() => onSelectImage && onSelectImage(item)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: item }}
        style={styles.image}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {images.length > 0 ? (
        <>
          <FlatList
            data={images}
            renderItem={renderItem}
            keyExtractor={(item, index) => `product-image-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          />
          
          {images.length > 1 && (
            <View style={styles.pagination}>
              {images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    index === activeIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="image-not-supported" size={40} color={Colors.gray} />
          <Text style={styles.emptyText}>No product images found</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 300,
    backgroundColor: Colors.white,
    marginVertical: 10,
  },
  imageContainer: {
    width,
    height: 270,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width - 40,
    height: 250,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.lightGray,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: Colors.yellow,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: Colors.gray,
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
  }
}); 