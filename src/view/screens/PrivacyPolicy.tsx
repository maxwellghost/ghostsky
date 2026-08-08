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

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PrivacyPolicy'>
export const PrivacyPolicyScreen = (_props: Props) => {
  const t = useTheme()
  const {_} = useLingui()

  return (
    <Layout.Screen>
      <ViewHeader title={_(msg`Privacy Policy`)} />
      <ScrollView style={[s.hContentRegion, t.atoms.bg]}>
        <View style={[s.p20]}>
          <Text
            style={[t.atoms.text, {fontWeight: 'bold', fontSize: 18}, s.pb10]}>
            Ghostsky is a personal, single-user client — not a company or
            product offered to the public.
          </Text>
          <Text style={[t.atoms.text, s.pb10]}>
            This deployment does not run analytics, error tracking, telemetry,
            or any third-party tracking of any kind. No usage data, device
            information, or behavioral data is collected, stored, or sent
            anywhere by this app itself.
          </Text>
          <Text style={[t.atoms.text, s.pb10]}>
            When you use it, your posts, likes, follows, and other actions go
            directly to your Personal Data Server and the wider AT Protocol
            network — the same as they would through any AT Protocol client.
            That data is governed by the network and your PDS provider, not by
            this app.
          </Text>
          <Text style={[t.atoms.text, s.pb10]}>
            Your session and preferences are stored locally in your
            browser/device. Nothing here is transmitted to a server operated by
            this app.
          </Text>
          <Text style={t.atoms.text}>
            This is a private, self-hosted fork of the open-source Bluesky
            client, operated by one person for personal use. It is not
            affiliated with or endorsed by Bluesky PBC.
          </Text>
        </View>
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
