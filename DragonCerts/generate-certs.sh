#!/bin/bash

set -e

generate_certs() {
  echo -e "Generating cert for domain: $1 ... " 
  if [ -z ${DEBUG} ]; then
    /certbot-auto certonly --dns-nsone \
      --dns-nsone-credentials /nsone.ini \
      --dns-nsone-propagation-seconds 60 \
      --agree-tos \
      --email email@drageth.com \
      -d $1
  else
    echo -e "Debug is enabled ... " 
    /certbot-auto certonly --dns-nsone \
      --dns-nsone-credentials /nsone.ini \
      --dns-nsone-propagation-seconds 60 \
      --agree-tos \
      --email email@drageth.com \
      --server https://acme-staging.api.letsencrypt.org/directory \
      -d $1
  fi
  mkdir -p /etc/letsencrypt/nginx-certs
  cp -Lr /etc/letsencrypt/live/$1 /etc/letsencrypt/nginx-certs/ 
}

if [[ -f "/etc/letsencrypt/live/${SITE_HOSTNAME}/fullchain.pem" 
      && -f "/etc/letsencrypt/live/${SITE_HOSTNAME}/privkey.pem" ]]; then
  echo -e "Certs already exist for domain : ${SITE_HOSTNAME}"
else
  generate_certs ${SITE_HOSTNAME}
fi

if [[ -f "/etc/letsencrypt/live/${SOCKET_HOSTNAME}/fullchain.pem" 
      && -f "/etc/letsencrypt/live/${SOCKET_HOSTNAME}/privkey.pem" ]]; then
  echo -e "Certs already exist for domain : ${SOCKET_HOSTNAME}"
else
  generate_certs ${SOCKET_HOSTNAME}
fi

