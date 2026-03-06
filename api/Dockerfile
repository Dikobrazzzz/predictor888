FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /server .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=build /server /server
COPY migrations/ /migrations/
WORKDIR /
EXPOSE 8082
CMD ["/server"]
