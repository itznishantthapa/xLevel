import { View, StyleSheet, Dimensions } from "react-native"
import { scaleWidth } from "../../../utils/scaling"

const { width } = Dimensions.get("window")
const CARD_WIDTH = width - 20
const IMAGE_HEIGHT = (CARD_WIDTH * 736) / 1600

const ProductCardSkeleton = ({ isLight = true }) => {
  const skeletonColor = isLight ? "#d9d9d9" : "#333333"
  const borderColor = isLight ? "#1a1a1a" : "#ffffff"

  return (
    <View style={[styles.card, { borderColor }]}>
      {/* Image placeholder */}
      <View style={[styles.imagePlaceholder, { backgroundColor: skeletonColor }]} />

      {/* Product info */}
      <View style={styles.info}>
        {/* Seller row + pills */}
        <View style={styles.sellerRow}>
          {/* Avatar + name */}
          <View style={styles.sellerLeft}>
            <View style={[styles.avatar, { backgroundColor: skeletonColor }]} />
            <View style={styles.sellerText}>
              <View style={[styles.box, styles.nameBox, { backgroundColor: skeletonColor }]} />
              <View style={[styles.box, styles.labelBox, { backgroundColor: skeletonColor }]} />
            </View>
          </View>
          {/* Pills */}
          <View style={styles.pillsRow}>
            <View style={[styles.box, styles.pill, { backgroundColor: skeletonColor }]} />
            <View style={[styles.box, styles.pill, { backgroundColor: skeletonColor }]} />
          </View>
        </View>

        {/* Chat bubble placeholder */}
        <View style={styles.bubbleWrapper}>
          <View style={[styles.box, styles.bubbleLine1, { backgroundColor: skeletonColor }]} />
          <View style={[styles.box, styles.bubbleLine2, { backgroundColor: skeletonColor }]} />
        </View>

        {/* Separator */}
        <View style={[styles.separator, { backgroundColor: skeletonColor }]} />

        {/* Buy button placeholder */}
        <View style={[styles.box, styles.button, { backgroundColor: skeletonColor }]} />
      </View>
    </View>
  )
}

export default ProductCardSkeleton

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderTopRightRadius: scaleWidth(25),
    borderTopLeftRadius: scaleWidth(25),
    borderBottomRightRadius: scaleWidth(25),
    borderBottomLeftRadius: scaleWidth(25),
    borderWidth: 1.5,
    overflow: "hidden",
  },
  imagePlaceholder: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
  },
  info: {
    padding: 12,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sellerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  sellerText: {
    justifyContent: "center",
  },
  box: {
    borderRadius: 4,
  },
  nameBox: {
    height: 12,
    width: 80,
    marginBottom: 4,
  },
  labelBox: {
    height: 10,
    width: 40,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  pill: {
    height: 32,
    width: 70,
    borderRadius: 20,
  },
  bubbleWrapper: {
    marginLeft: 8,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  bubbleLine1: {
    height: 10,
    width: "90%",
  },
  bubbleLine2: {
    height: 10,
    width: "60%",
  },
  separator: {
    height: 1,
    width: "100%",
    marginBottom: 12,
    opacity: 0.3,
  },
  button: {
    height: 44,
    width: "100%",
    borderRadius: 8,
  },
})
