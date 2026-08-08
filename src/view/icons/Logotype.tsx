import {Text} from 'react-native'
import {type PathProps, type SvgProps} from 'react-native-svg'

import {usePalette} from '#/lib/hooks/usePalette'

// GHOST: the original wordmark was a hand-drawn SVG path spelling "Bluesky"
// in a custom typeface — there's no safe way to hand-edit vector path data
// to spell a different word, so this renders real text instead. Trade-off:
// text doesn't scale to an exact pixel width the way the old SVG did, so if
// you see any cramped/overflowing header spots, that's why — worth a look
// once you're running it locally.
const ratio = 17 / 64

export function Logotype({
  fill,
  width,
  style,
  ...rest
}: {fill?: PathProps['fill']} & SvgProps) {
  const pal = usePalette('default')
  // @ts-ignore it's fiiiiine
  const size = parseInt(width, 10) || 32
  const fontSize = Math.round(size * ratio * 2.2)

  return (
    <Text
      accessibilityLabel="Ghostsky"
      accessibilityHint=""
      // @ts-ignore SvgProps/TextProps overlap loosely here, matches original's looseness
      {...rest}
      style={[
        {
          fontSize,
          lineHeight: fontSize * 1.1,
          fontWeight: '800',
          letterSpacing: -0.5,
          color: fill || pal.text.color,
        },
        style,
      ]}>
      Ghostsky
    </Text>
  )
}
