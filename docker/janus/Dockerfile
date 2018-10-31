FROM alpine:latest
RUN apk --no-cache add ca-certificates

WORKDIR /root/
ADD https://github.com/dcb9/janus/releases/download/0.0.6/janus-linux-amd64 ./janus
RUN chmod 755 ./janus

EXPOSE 23889

CMD ["./janus", "--qtum-rpc=http://qtum:test@insightapi:18332", "--bind=0.0.0.0", "--port=23889", "--dev"]
