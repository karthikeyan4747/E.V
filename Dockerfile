FROM node:24-alpine AS frontend-build
WORKDIR /app/Frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend ./
RUN npm run build

FROM python:3.13-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV FRONTEND_DIST=/app/Frontend/dist
WORKDIR /app

COPY Backend/requirements.txt ./Backend/requirements.txt
RUN pip install --no-cache-dir -r Backend/requirements.txt

COPY Backend ./Backend
COPY --from=frontend-build /app/Frontend/dist ./Frontend/dist

EXPOSE 10000
CMD ["sh", "-c", "uvicorn Backend.main:app --host 0.0.0.0 --port ${PORT:-10000}"]
