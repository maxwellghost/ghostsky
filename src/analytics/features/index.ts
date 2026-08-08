import {MMKV} from '@bsky.app/react-native-mmkv'
import {setPolyfills} from '@growthbook/growthbook'
import {GrowthBook} from '@growthbook/growthbook-react'

import {getNavigationMetadata, type Metadata} from '#/analytics/metadata'
import * as env from '#/env'

export {Features} from '#/analytics/features/types'

const CACHE = new MMKV({id: 'bsky_features_cache'})

setPolyfills({
  localStorage: {
    getItem: key => {
      return CACHE.getString(key) ?? null
    },
    // MMKV writes are synchronous, but GrowthBook's localStorage polyfill
    // expects a Promise-returning setItem.
    // eslint-disable-next-line @typescript-eslint/require-await
    setItem: async (key, value) => {
      CACHE.set(key, value)
    },
  },
})

/**
 * We vary the amount of time we wait for GrowthBook to fetch feature
 * gates based on the strategy specified.
 */
export type FeatureFetchStrategy = 'prefer-low-latency' | 'prefer-fresh-gates'

export const features = new GrowthBook({
  apiHost: env.GROWTHBOOK_API_HOST,
  clientKey: env.GROWTHBOOK_CLIENT_KEY,
})

/**
 * Initializer promise that must be awaited before using the GrowthBook
 * instance or rendering the `AnalyticsFeaturesContext`. Note: this may not be
 * fully initialized if it takes longer than `TIMEOUT_INIT` to initialize. In
 * that case, we may see a flash of uncustomized content until the
 * initialization completes.
 *
 * GHOST: the actual remote fetch (features.init()) is skipped — that call
 * hit Bluesky's real GrowthBook backend (env.GROWTHBOOK_API_HOST, which
 * defaults to events.bsky.app/gb) to pull experiment/feature-flag config.
 * A personal fork doesn't need Bluesky's A/B tests, so this resolves
 * immediately and every feature flag just falls back to its local default
 * (effectively "off"/base behavior) instead of ever calling out.
 */
export const init = Promise.resolve()

/**
 * Refresh feature gates from GrowthBook.
 *
 * GHOST: no-op — see note on `init` above, same reasoning.
 */
// The async signature is kept so callers keep their Promise contract.
// eslint-disable-next-line @typescript-eslint/require-await
export async function refresh(_args: {strategy: FeatureFetchStrategy}) {
  return
}

/**
 * Converts our metadata into GrowthBook attributes and sets them. GrowthBook
 * attributes are manually configured in the GrowthBook dashboard. So these
 * values need to match exactly. Therefore, let's add them here manually to and
 * not spread them to avoid mistakes.
 */
export function setAttributes({
  base,
  geolocation,
  session,
  preferences,
}: Metadata) {
  features.setAttributes({
    deviceId: base.deviceId,
    sessionId: base.sessionId,
    platform: base.platform,
    appVersion: base.appVersion,
    countryCode: geolocation.countryCode,
    regionCode: geolocation.regionCode,
    did: session?.did,
    isBskyPds: session?.isBskyPds,
    appLanguage: preferences?.appLanguage,
    contentLanguages: preferences?.contentLanguages,
    currentScreen: getNavigationMetadata()?.currentScreen,
  })
}
