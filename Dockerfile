# Kredal on Cloud Run.
#
# Three stages so the runtime image carries only Next's standalone output:
# no source, no dev dependencies, no build cache. Built by Cloud Build
# (`gcloud run deploy --source`), so no local Docker daemon is needed.

FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# The lockfile is generated on macOS. npm 11 records some WebAssembly fallback
# packages (@emnapi/*) only for the platform that resolved them, so on Linux
# `npm ci` can reject an otherwise-valid lockfile. Prefer the exact install;
# fall back loudly rather than fail the build.
RUN npm ci --no-audit --no-fund \
 || (echo ">>> npm ci rejected the lockfile on linux; falling back to npm install" \
     && npm install --no-audit --no-fund)

FROM node:24-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=8080
# Standalone output omits public/ and .next/static by design; server.js serves
# them once they are copied alongside it.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
USER node
EXPOSE 8080
CMD ["node", "server.js"]
