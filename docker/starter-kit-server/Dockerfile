FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
ADD https://github.com/dcb9/simple-state-channel-starter-kit-server/releases/download/0.0.1/simple-state-channel-starter-kit-server-linux-amd64 ./starter-kit-server
RUN chmod 755 ./starter-kit-server

EXPOSE 8080

CMD ["./starter-kit-server"]
