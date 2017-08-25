FROM docker.io/kiyotocrypto/nginx-ns1

RUN apt-get update && apt-get install -y cron

COPY nsone.ini nsone.ini
COPY generate-certs.sh generate-certs.sh
COPY renew-certs renew-certs
COPY startup startup 
COPY renew-certs-cron /etc/cron.d/renew-certs-cron

RUN crontab /etc/cron.d/renew-certs-cron

ENTRYPOINT /startup

