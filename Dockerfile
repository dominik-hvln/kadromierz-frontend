FROM node:20-alpine AS builder

WORKDIR /app

# Kopiowanie plików package
COPY package*.json ./

# Instalacja wszystkich zależności (potrzebne do buildu)
ENV NODE_ENV=development
RUN npm ci

# Kopiowanie kodu źródłowego
COPY . .

# Zmienne środowiskowe build-time (Next.js potrzebuje ich podczas npm run build)
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_KEY=$NEXT_PUBLIC_SUPABASE_KEY

# Build aplikacji Next.js
# Wymuszamy NODE_ENV=production dla buildu (Next.js tego wymaga)
ENV NODE_ENV=production
RUN npm run build

# === PRODUCTION STAGE ===
FROM node:20-alpine AS production

WORKDIR /app

# Dodajemy curl dla healthchecku
RUN apk add --no-cache curl

# Zalecane dla bezpieczeństwa
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Kopiowanie public i statycznych plików
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Kopiowanie standalone (zawiera node_modules i serwer)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

USER nextjs

# Expose port (Next.js standalone domyślnie używa 3000)
ENV PORT 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start aplikacji (w trybie standalone startujemy server.js)
CMD ["node", "server.js"]
