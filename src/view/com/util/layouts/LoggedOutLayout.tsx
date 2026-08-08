import {ScrollView, StyleSheet, View} from 'react-native'

import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {atoms as a, useTheme} from '#/alf'
import {IS_WEB} from '#/env'
import {Text} from '../text/Text'

export const LoggedOutLayout = ({
  leadin,
  title,
  description,
  children,
  scrollable,
}: React.PropsWithChildren<{
  leadin: string
  title: string
  description: string
  scrollable?: boolean
}>) => {
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
  const t = useTheme()
  const sideBg = t.atoms.bg_contrast_25
  const contentBg = [
    t.atoms.bg,
    t.atoms.border_contrast_low,
    {borderLeftWidth: 1},
  ]

  if (isMobile) {
    if (scrollable) {
      return (
        <ScrollView
          style={a.flex_1}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          contentContainerStyle={[a.flex_grow]}>
          <View style={[a.flex_1, a.pt_lg]}>{children}</View>
        </ScrollView>
      )
    } else {
      return <View style={a.pt_lg}>{children}</View>
    }
  }
  return (
    <View style={styles.container}>
      <View style={[styles.side, sideBg]}>
        <Text
          style={[
            t.atoms.text_contrast_medium,
            styles.leadinText,
            isTabletOrMobile && styles.leadinTextSmall,
          ]}>
          {leadin}
        </Text>
        <Text
          style={[
            {color: t.palette.primary_500},
            styles.titleText,
            isTabletOrMobile && styles.titleTextSmall,
          ]}>
          {title}
        </Text>
        <Text
          type="2xl-medium"
          style={[t.atoms.text_contrast_medium, styles.descriptionText]}>
          {description}
        </Text>
      </View>
      {scrollable ? (
        <View style={[styles.scrollableContent, contentBg]}>
          <ScrollView
            style={a.flex_1}
            contentContainerStyle={styles.scrollViewContentContainer}
            keyboardShouldPersistTaps="handled"
            /*
             * RNW implements `on-drag` by blurring the focused element on ANY
             * scroll event - including the one Firefox fires when swapping
             * splash -> login content resizes the scroller - which kills the
             * login form's autofocus. It doesn't appear to do anything anyways
             * on web (judging by iOS safari, which keeps the keyboard open
             * regardless of scrolling) -sfn
             */
            keyboardDismissMode={IS_WEB ? 'none' : 'on-drag'}>
            <View style={[styles.contentWrapper, IS_WEB && a.my_auto]}>
              {children}
            </View>
          </ScrollView>
        </View>
      ) : (
        <View style={[styles.content, contentBg]}>
          <View style={styles.contentWrapper}>{children}</View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    // @ts-ignore web only
    height: '100vh',
  },
  side: {
    flex: 1,
    paddingHorizontal: 40,
    paddingBottom: 80,
    justifyContent: 'center',
  },
  content: {
    flex: 2,
    paddingHorizontal: 40,
    justifyContent: 'center',
  },
  scrollableContent: {
    flex: 2,
  },
  scrollViewContentContainer: {
    flex: 1,
    paddingHorizontal: 40,
  },
  leadinText: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'right',
  },
  leadinTextSmall: {
    fontSize: 24,
  },
  titleText: {
    fontSize: 58,
    fontWeight: '800',
    textAlign: 'right',
  },
  titleTextSmall: {
    fontSize: 36,
  },
  descriptionText: {
    maxWidth: 400,
    marginTop: 10,
    marginLeft: 'auto',
    textAlign: 'right',
  },
  contentWrapper: {
    maxWidth: 600,
  },
})
