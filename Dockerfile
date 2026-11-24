FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/heisernbergg0942/Devops-project"

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev \
  && npm cache clean --force \
  && npm uninstall --global npm

COPY src/ ./src/

USER 1000:1000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/health', { signal: AbortSignal.timeout(2000) }).then(response => process.exit(response.status === 200 ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "src/server.js"]
