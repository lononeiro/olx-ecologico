import { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ImageIcon, X } from "lucide-react-native";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/Feedback";
import { colors, radius, spacing, typography } from "@/theme/tokens";

export type GalleryImage = { id: number | string; url: string };

const HERO_HEIGHT = 240;
const ZOOM_SCALE = 2.5;
const DOUBLE_TAP_MS = 260;

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [heroWidth, setHeroWidth] = useState(0);

  if (images.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="Sem fotos"
        description="Esta solicitação não possui imagens do material."
      />
    );
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!heroWidth) return;
    const index = Math.round(e.nativeEvent.contentOffset.x / heroWidth);
    setActiveIndex(index);
  };

  return (
    <View
      style={styles.heroWrap}
      onLayout={(e) => setHeroWidth(e.nativeEvent.layout.width)}
    >
      {heroWidth > 0 && (
        <FlatList
          data={images}
          keyExtractor={(item) => String(item.id)}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => setViewerIndex(index)}>
              <Image
                source={{ uri: item.url }}
                style={{ width: heroWidth, height: HERO_HEIGHT }}
                resizeMode="cover"
              />
            </Pressable>
          )}
        />
      )}

      <View style={styles.counterBadge}>
        <Icon icon={ImageIcon} size={13} color={colors.white} />
        <Text style={styles.counterText}>
          {activeIndex + 1}/{images.length}
        </Text>
      </View>

      {images.length > 1 && (
        <View style={styles.dotsRow}>
          {images.map((image, index) => (
            <View
              key={image.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}

      <Modal
        visible={viewerIndex !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setViewerIndex(null)}
        statusBarTranslucent
      >
        {viewerIndex !== null && (
          <FullscreenViewer
            images={images}
            initialIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </Modal>
    </View>
  );
}

function FullscreenViewer({
  images,
  initialIndex,
  onClose,
}: {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}) {
  const { width, height } = Dimensions.get("window");
  const [index, setIndex] = useState(initialIndex);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.viewerRoot}>
      <FlatList
        data={images}
        keyExtractor={(item) => String(item.id)}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => (
          <ZoomableImage url={item.url} width={width} height={height} />
        )}
      />

      <View style={styles.viewerHeader}>
        <View style={styles.viewerCounter}>
          <Text style={styles.viewerCounterText}>
            {index + 1} de {images.length}
          </Text>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Icon icon={X} size={20} color={colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

function ZoomableImage({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const zoomed = useRef(false);
  const lastTap = useRef(0);
  const offset = useRef({ x: 0, y: 0 });

  const resetZoom = () => {
    zoomed.current = false;
    offset.current = { x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  };

  const zoomIn = () => {
    zoomed.current = true;
    Animated.spring(scale, { toValue: ZOOM_SCALE, useNativeDriver: true }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        zoomed.current && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onPanResponderGrant: () => {
        translate.setOffset(offset.current);
        translate.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translate.x, dy: translate.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        offset.current = {
          x: offset.current.x + gesture.dx,
          y: offset.current.y + gesture.dy,
        };
        translate.flattenOffset();
      },
    })
  ).current;

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      zoomed.current ? resetZoom() : zoomIn();
    }
    lastTap.current = now;
  };

  return (
    <Pressable
      onPress={handleTap}
      style={{ width, height, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.Image
        source={{ uri: url }}
        resizeMode="contain"
        style={{
          width,
          height,
          transform: [
            { scale },
            { translateX: translate.x },
            { translateY: translate.y },
          ],
        }}
        {...panResponder.panHandlers}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceTint,
  },
  counterBadge: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  counterText: {
    ...typography.meta,
    color: colors.white,
  },
  dotsRow: {
    position: "absolute",
    bottom: spacing.sm,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.white,
  },
  viewerRoot: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.96)",
  },
  viewerHeader: {
    position: "absolute",
    top: 56,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viewerCounter: {
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  viewerCounterText: {
    ...typography.meta,
    color: colors.white,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
