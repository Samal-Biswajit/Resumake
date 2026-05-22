FROM node:22-slim

# Install XeLaTeX, lightweight TeX Live collection, and system fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-xetex \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    texlive-latex-extra \
    texlive-plain-generic \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Install dependencies first for optimal build caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
