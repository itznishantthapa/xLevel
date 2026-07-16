import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const AuthAmbientDecor = ({ stroke }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice">
      <Path
        d="M-30 120 C120 40, 220 180, 390 90"
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        opacity={0.1}
        strokeLinecap="round"
      />
      <Path
        d="M-40 138 C110 58, 210 198, 400 108"
        stroke={stroke}
        strokeWidth={1}
        fill="none"
        opacity={0.06}
        strokeLinecap="round"
      />
      <Path
        d="M320 520 C220 420, 120 560, -20 470"
        stroke={stroke}
        strokeWidth={2.5}
        fill="none"
        opacity={0.12}
        strokeLinecap="round"
      />
      <Path
        d="M30 580 C90 500, 170 610, 250 540"
        stroke={stroke}
        strokeWidth={1.5}
        fill="none"
        opacity={0.08}
        strokeLinecap="round"
      />
      <Path
        d="M280 180 C240 260, 300 340, 360 300"
        stroke={stroke}
        strokeWidth={1.25}
        fill="none"
        opacity={0.07}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

const AuthButtonFrameDecor = ({ stroke, children }) => (
  <View style={styles.frame}>
    <Svg width={300} height={36} viewBox="0 0 300 36" style={styles.frameTop}>
      <Path
        d="M8 28 C78 6, 222 6, 292 28"
        stroke={stroke}
        strokeWidth={2.25}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M24 32 C88 14, 212 14, 276 32"
        stroke={stroke}
        strokeWidth={1}
        fill="none"
        opacity={0.35}
        strokeLinecap="round"
      />
      <Path
        d="M40 34 C96 20, 204 20, 260 34"
        stroke={stroke}
        strokeWidth={0.75}
        fill="none"
        opacity={0.2}
        strokeLinecap="round"
      />
    </Svg>

    <View style={styles.frameBody}>{children}</View>

    <Svg width={300} height={36} viewBox="0 0 300 36" style={styles.frameBottom}>
      <Path
        d="M8 8 C78 30, 222 30, 292 8"
        stroke={stroke}
        strokeWidth={2.25}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d="M24 4 C88 22, 212 22, 276 4"
        stroke={stroke}
        strokeWidth={1}
        fill="none"
        opacity={0.35}
        strokeLinecap="round"
      />
      <Path
        d="M40 2 C96 16, 204 16, 260 2"
        stroke={stroke}
        strokeWidth={0.75}
        fill="none"
        opacity={0.2}
        strokeLinecap="round"
      />
    </Svg>
  </View>
);

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  frameTop: {
    marginBottom: 2,
  },
  frameBottom: {
    marginTop: 2,
  },
  frameBody: {
    width: '100%',
  },
});

export { AuthAmbientDecor, AuthButtonFrameDecor };
