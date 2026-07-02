import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg'

import { lightColors as p } from '../tokens/colors'

// Тёплые оттенки пламени (те же, что в иконке приложения)
const GOLD_L = '#D9B36B'
const GOLD_D = '#9A6E2E'
const FLAME_TIP = '#FFF7E4'
const FLAME_CORE = '#FCEAC0'

// Контуры пламени в системе 0..100 x 0..140 (кончик сверху)
const FLAME = 'M50,6 C64,38 79,50 79,80 C79,106 66,122 50,124 C34,122 21,106 21,80 C21,50 36,38 50,6 Z'
const CORE = 'M50,44 C60,62 67,70 67,90 C67,105 59,115 50,116 C41,115 33,105 33,90 C33,70 40,62 50,44 Z'

interface FlameLogoProps {
  /** Итоговый размер по большей стороне, px. */
  size?: number
  /** Показать лесное кольцо-обрамление вокруг пламени. */
  withRing?: boolean
}

/**
 * Фирменная эмблема «свеча памяти».
 * Векторная версия иконки приложения — для брендовых экранов внутри UI.
 */
export function FlameLogo({ size = 96, withRing = true }: FlameLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="fl-flame" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={GOLD_L} />
          <Stop offset="0.55" stopColor={p.gold} />
          <Stop offset="1" stopColor={GOLD_D} />
        </LinearGradient>
        <LinearGradient id="fl-core" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={FLAME_TIP} />
          <Stop offset="1" stopColor={FLAME_CORE} />
        </LinearGradient>
        <RadialGradient id="fl-glow" cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={GOLD_L} stopOpacity={0.35} />
          <Stop offset="0.6" stopColor={p.gold} stopOpacity={0.1} />
          <Stop offset="1" stopColor={p.gold} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {withRing ? (
        <>
          <Circle cx={100} cy={100} r={94} fill="none" stroke={p.forest} strokeWidth={5} opacity={0.92} />
          <Circle cx={100} cy={100} r={84} fill="none" stroke={p.sage} strokeWidth={1.4} opacity={0.5} />
        </>
      ) : null}

      <Circle cx={100} cy={100} r={70} fill="url(#fl-glow)" />

      <G transform={`translate(100,100) scale(${withRing ? 0.62 : 0.86}) translate(-50,-70)`}>
        <Path d={FLAME} fill="url(#fl-flame)" />
        <Path d={CORE} fill="url(#fl-core)" />
      </G>
    </Svg>
  )
}
