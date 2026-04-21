import pino from 'pino';

const transport =
  process.env.NODE_ENV === 'production' && process.env.GRAFANA_LOKI_URL
    ? pino.transport({
        targets: [
          { target: 'pino/file', level: 'info', options: { destination: 1 } },
          {
            target: 'pino-loki',
            level: 'info',
            options: {
              host: process.env.GRAFANA_LOKI_URL,
              basicAuth: {
                username: process.env.GRAFANA_LOKI_USER || '',
                password: process.env.GRAFANA_LOKI_PASSWORD || '',
              },
              labels: { app: 'zencash-api', env: process.env.NODE_ENV },
              propsToLabels: ['level'],
              silenceErrors: true,
              replaceTimestamp: true,
              timeout: 3000,
              batching: { interval: 5 },
            },
          },
        ],
      })
    : undefined;

export const logger = pino({ level: process.env.LOG_LEVEL || 'info' }, transport);
