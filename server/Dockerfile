FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src
# Create an empty shared directory or copy shared if present
# Wait, shared is in the root, so we can copy it or handle relative imports.
# In a monorepo setup, we can copy shared types. Let's copy shared types if needed,
# or we can import them in src. Let's copy shared/ to the server folder or make sure it's compiled.
# Let's copy ../shared to server/src/shared, or we can copy it locally.
# Wait! In standard TS project, importing outside rootDir causes issues if they are not in the project root.
# Let's copy shared types directly into server/src/shared/types.ts and client/src/shared/types.ts!
# That way, both server and client are self-contained and run cleanly without relative root directory issues (e.g. outDir including shared/ or client/).
# Yes! Copying `shared/types.ts` locally to `server/src/shared/types.ts` and `client/src/shared/types.ts` is EXTREMELY clean, avoids import paths outside rootDir, and makes compilation trivial.
# Let's write `server/src/shared/types.ts` now so it matches, and client will have its own as well.
# This prevents relative import breaks when compiling in Docker or dev modes.
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /usr/src/app/dist ./dist

# Create uploads directory for local file attachments fallback
RUN mkdir -p uploads

EXPOSE 5000

CMD ["node", "dist/index.js"]
