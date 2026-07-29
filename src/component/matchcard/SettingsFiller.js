import { View, StyleSheet } from "react-native"
import { spacing } from "../../theme/typography"

const FILLER_LINES = [
  { width: "100%", height: 2 },
  { width: "72%", height: 1 },
  { width: "88%", height: 1.5 },
  { width: "48%", height: 1 },
  { width: "94%", height: 2 },
  { width: "60%", height: 1 },
  { width: "80%", height: 1.5 },
  { width: "36%", height: 1 },
]

const SettingsFiller = ({ isLight }) => {
  const lineColor = isLight ? "rgba(0, 0, 0, 0.24)" : "rgba(255, 255, 255, 0.24)"

  return (
    <View style={styles.container}>
      {FILLER_LINES.map((line, index) => (
        <View
          key={`settings-filler-${index}`}
          style={[
            styles.line,
            {
              width: line.width,
              height: line.height,
              backgroundColor: lineColor,
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    justifyContent: "space-evenly",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxs,
  },
  line: {
    borderRadius: 1,
    alignSelf: "flex-start",
  },
})

export default SettingsFiller
