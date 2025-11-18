# Multi-stage build for smaller, more secure production image
FROM python:3.11-slim as builder

# Install UV package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies
RUN uv sync --frozen --no-dev

# Production stage
FROM python:3.11-slim as production

# Install security updates and required packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user with specific UID/GID
RUN groupadd -r -g 1000 appuser && \
    useradd -r -g appuser -u 1000 -m -d /app -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy UV from builder
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# Copy virtual environment from builder
COPY --from=builder --chown=appuser:appuser /app/.venv /app/.venv

# Copy application code
COPY --chown=appuser:appuser . .

# Create logs directory
RUN mkdir -p logs && chown appuser:appuser logs

# Switch to non-root user
USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Security environment variables
ENV APP_ENV=production
ENV LOG_LEVEL=INFO
ENV FORCE_HTTPS=true

# Expose port (non-privileged)
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application with security-focused settings
CMD ["uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "1", \
     "--access-log", \
     "--no-server-header"] 