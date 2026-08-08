import {Text, View} from 'react-native'
import {type PathProps, type SvgProps} from 'react-native-svg'

import {Logomark} from '#/view/icons/Logomark'
import {useTheme} from '#/alf'

// GHOST: same situation as Logotype.tsx — the original was a hand-drawn
// vector wordmark ("Bluesky" spelled out as bezier letterforms) that can't
// be safely hand-edited into a different word. This composites the
// already-fixed Logomark with real text instead.
const ratio = 31 / 136

export function LogomarkWithType({
  fill,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const t = useTheme()
  const size = parseInt(`${rest.width || 32}`, 10)
  const markSize = Math.round(size * ratio * 1.6)
  const fontSize = Math.round(size * ratio * 1.15)

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: Math.round(size * 0.04),
        height: size * ratio,
      }}>
      <Logomark width={markSize} fill={fill || t.atoms.text.color} />
      <Text
        accessibilityLabel="Ghostsky"
        accessibilityHint=""
        style={{
          fontSize,
          fontWeight: '800',
          letterSpacing: -0.5,
          color: fill || t.atoms.text.color,
        }}>
        Ghostsky
      </Text>
    </View>
  )
}
