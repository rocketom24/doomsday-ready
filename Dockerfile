FROM node:22-bookworm-slim

# Prisma's query engine needs OpenSSL
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# DATABASE_URL is only needed at runtime; generate and build do not open the database
RUN npx prisma generate && npm run build

# SQLite lives in /data so it can be a volume; owned by the unprivileged node user
RUN mkdir /data && chown node:node /data
USER node

ENV NODE_ENV=production \
    DATABASE_URL=file:/data/doomsday.db
EXPOSE 3000

# Apply migrations on every start. Seed only the first time (marker file in the volume),
# so restarts never overwrite prerequisites the user has edited.
CMD ["sh", "-c", "npx prisma migrate deploy && { [ -f /data/.seeded ] || { npx prisma db seed && touch /data/.seeded; }; } && exec npx next start -H 0.0.0.0 -p 3000"]
