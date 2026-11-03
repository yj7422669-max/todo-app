FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node server.js ./
USER node
EXPOSE 4000
CMD ["node", "server.js"]
