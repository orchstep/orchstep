FROM alpine:3.19

RUN apk add --no-cache ca-certificates bash curl git

COPY orchstep /usr/local/bin/orchstep
RUN chmod +x /usr/local/bin/orchstep

ENTRYPOINT ["orchstep"]
