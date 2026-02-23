FROM node:22-bookworm

WORKDIR /app

RUN corepack enable
RUN apt-get update && apt-get install -y python3 node-gyp make g++

COPY package.json package.json
COPY pnpm-lock.yaml pnpm-lock.yaml 
COPY . .
RUN pnpm install --frozen-lockfile

RUN cd node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3 && npx node-gyp configure && npx node-gyp build
RUN cd ../../../../../

# Build apps
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=4000
ENV WEB_PORT=5153

EXPOSE 4000 5153
CMD ["pnpm", "start"]
