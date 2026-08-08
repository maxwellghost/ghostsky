import {View} from 'react-native'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'
import {useTheme} from '#/alf'
import * as Layout from '#/components/Layout'
import {ViewHeader} from '../com/util/ViewHeader'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>
export const TermsOfServiceScreen = (_props: Props) => {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Terms of Service`)} />
      <ScrollView style={[s.hContentRegion, t.atoms.bg]}>
        <View style={[s.p20]}>
          <Text
            style={[t.atoms.text, {fontWeight: 'bold', fontSize: 18}, s.pb10]}>
            Ghostsky is a personal, non-commercial fork of the open-source
            Bluesky client, self-hosted for private use by a single person.
          </Text>
          <Text style={[t.atoms.text, s.pb10]}>
            This software is provided as-is, with no guarantee of uptime,
            correctness, or fitness for any purpose. It's a personal project,
            not a maintained product.
          </Text>
          <Text style={[t.atoms.text, s.pb10]}>
            Ghostsky connects to the AT Protocol network using your existing
            Bluesky account credentials. Your account, its content, and its
            standing on the network are governed by the actual AT Protocol
            network and your PDS provider — not by this app.
          </Text>
          <Text style={t.atoms.text}>
            This is an independent, unofficial fork. It is not affiliated with,
            endorsed by, or officially connected to Bluesky PBC.
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
