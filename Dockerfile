FROM node:24-alpine

LABEL org.opencontainers.image.source="https://github.com/heisernbergg0942/Devops-project"

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY server.js ./

USER node

EXPOSE 3000

CMD ["node", "server.js"]
