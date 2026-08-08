import {onAppStateChange} from '#/lib/appState'
import {MetricsClient} from './client'

jest.mock('#/lib/appState', () => ({
  onAppStateChange: jest.fn(() => ({remove: jest.fn()})),
}))

jest.mock('#/logger', () => ({
  Logger: {
    create: () => ({
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    }),
    Context: {Metric: 'metric'},
  },
}))

jest.mock('#/env', () => ({
  METRICS_API_HOST: 'https://test.metrics.api',
  IS_WEB: false,
}))

type TestEvents = {
  click: {button: string}
  view: {screen: string}
}

/**
 * GHOST: telemetry is disabled in this fork — `track()` and `start()` are
 * deliberate no-ops (see client.ts). These tests assert that nothing is
 * queued, scheduled, subscribed, or sent, so a future upstream merge can't
 * silently reinstate the reporting to Bluesky's endpoint.
 */
describe('MetricsClient', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers({advanceTimers: true})
    fetchMock = jest.fn().mockResolvedValue({ok: true, status: 200})
    global.fetch = fetchMock
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('track() queues nothing, so flush() sends no request', async () => {
    const client = new MetricsClient<TestEvents>()
    client.track('click', {button: 'submit'})
    client.track('view', {screen: 'home'})

    client.flush()
    await jest.advanceTimersByTimeAsync(0)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('start() schedules no flush interval', async () => {
    const client = new MetricsClient<TestEvents>()
    client.start()
    client.track('click', {button: 'submit'})

    // Well past the 10 second interval the original client used.
    await jest.advanceTimersByTimeAsync(60_000)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('start() subscribes to no app-state changes', () => {
    const client = new MetricsClient<TestEvents>()
    client.start()

    expect(jest.mocked(onAppStateChange)).not.toHaveBeenCalled()
  })

  it('exceeding maxBatchSize still sends nothing', async () => {
    const client = new MetricsClient<TestEvents>()
    client.maxBatchSize = 5

    for (let i = 0; i < 10; i++) {
      client.track('click', {button: `btn-${i}`})
    }

    await jest.advanceTimersByTimeAsync(60_000)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
