FROM oven/bun AS build

WORKDIR /app

# Cache packages installation
COPY package.json package.json
COPY apps/api/package.json ./apps/api/package.json

# Copy workspace packages that api depends on
COPY packages/ ./packages/

RUN bun install

COPY apps/api/src ./apps/api/src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
	./apps/api/src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

CMD ["./server"]

EXPOSE 4000