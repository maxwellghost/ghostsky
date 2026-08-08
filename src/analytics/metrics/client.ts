import {isNetworkError} from '#/lib/strings/errors'
import {Logger} from '#/logger'
import * as env from '#/env'

type Event<M extends Record<string, any>> = {
  source: 'app'
  time: number
  event: keyof M
  payload: M[keyof M]
  metadata: Record<string, any>
}

const TRACKING_ENDPOINT = env.METRICS_API_HOST + '/t'
const logger = Logger.create(Logger.Context.Metric, {})

export class MetricsClient<M extends Record<string, any>> {
  maxBatchSize = 100

  private started: boolean = false
  private queue: Event<M>[] = []
  private failedQueue: Event<M>[] = []
  private flushInterval: NodeJS.Timeout | null = null

  start() {
    // GHOST: disabled. This used to start a 10s flush interval and an
    // app-state listener that would push queued events to Bluesky's real
    // events.bsky.app endpoint. No-op now — nothing is ever queued (see
    // track() below) so this wouldn't have anything to send anyway, but
    // keeping it a clean no-op rather than deleting it means nothing that
    // calls .start() elsewhere breaks.
    return
  }

  track<E extends keyof M>(
    _event: E,
    _payload: M[E],
    _metadata: Record<string, any> = {},
  ) {
    // GHOST: disabled — intentionally does nothing. No events are queued,
    // batched, or sent anywhere. Left the method signature intact so every
    // ax.metric(...) call site elsewhere in the app keeps compiling.
    return
  }

  flush() {
    if (!this.queue.length) return
    const events = this.queue.splice(0, this.queue.length)
    this.sendBatch(events)
  }

  private async sendBatch(events: Event<M>[], isRetry: boolean = false) {
    try {
      const body = JSON.stringify({events})
      if (env.IS_WEB && 'navigator' in globalThis && navigator.sendBeacon) {
        const success = navigator.sendBeacon(
          TRACKING_ENDPOINT,
          new Blob([body], {type: 'application/json'}),
        )
        if (!success) {
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`Failed to fetch: sendBeacon returned false`)
        }
      } else {
        const res = await fetch(TRACKING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({events}),
          keepalive: true,
        })

        if (!res.ok) {
          const error = await res.text().catch(() => 'Unknown error')
          // construct a "network error" for `isNetworkError` to work
          throw new Error(`${res.status} Failed to fetch — ${error}`)
        }
      }
    } catch (e: any) {
      if (isNetworkError(e)) {
        if (isRetry) return // retry once
        this.failedQueue.push(...events)
        return
      }
      logger.error(`Failed to send metrics`, {
        safeMessage: e.toString(),
      })
    }
  }

  private retryFailedLogs() {
    if (!this.failedQueue.length) return
    const events = this.failedQueue.splice(0, this.failedQueue.length)
    this.sendBatch(events, true)
  }
}
