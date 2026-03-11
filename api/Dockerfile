FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /server .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates && \
    adduser -D -H appuser
COPY --from=build /server /server
COPY migrations/ /migrations/
WORKDIR /
USER appuser
EXPOSE 8082
CMD ["/server"]
