# docker build -t custom-nginx .
# docker run -d custom-nginx 

#FROM nginx
#RUN apt-get update
#RUN apt-get -f install
#RUN apt-get install wget -y
#RUN wget https://dl.eff.org/certbot-auto
#RUN chmod a+x ./certbot-auto

# climb inside this container and do...
# ./certbot-auto -n
# source ~/.local/share/letsencrypt/bin/activate
# pip install certbot-dns-nsone
# exit

# sudo docker commit CONTAINER_ID nginx-ns1
# docker commit -m "Basic setup" -a "NAME" b92ac4c06b05 kiyotocrypto/nginx-ns1:latest
#docker push kiyotocrypto/nginx-ns1

# -----------------------------------------------------------------

# Nginx base image
FROM docker.io/kiyotocrypto/nginx-ns1

RUN mkdir -p /data/nginx/cache /etc/nginx/sites-enabled/ /etc/nginx/sites-available/
RUN ln -s /etc/nginx/sites-available/site /etc/nginx/sites-enabled/
RUN ln -s /etc/nginx/sites-available/socket /etc/nginx/sites-enabled/
RUN openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
RUN chown -R www-data:www-data /data
# We are going to exclude cert generation from docker image
# So no need of following ...
#COPY nsone.ini nsone.ini
#COPY renew-cert /etc/cron.daily/renew-cert

#RUN /certbot-auto certonly --dns-nsone --dns-nsone-credentials /nsone.ini --dns-nsone-propagation-seconds 60 -d site2.swarmdev.city -d socket2.swarmdev.city --agree-tos --email email.will.in.china@gmail.com -q
# -d shoud work but for some reason its not generating the SSL cert for the 2nd docmain name
# removed -q to get information
#RUN /certbot-auto certonly --dns-nsone --dns-nsone-credentials /nsone.ini --dns-nsone-propagation-seconds 60 -d site2.swarmdev.city --agree-tos --email email.will.in.china@gmail.com
#RUN /certbot-auto certonly --dns-nsone --dns-nsone-credentials /nsone.ini --dns-nsone-propagation-seconds 60 -d socket2.swarmdev.city --agree-tos --email email.will.in.china@gmail.com

#RUN apt-get update && apt-get install fail2ban -y
#COPY nginx-limit-req.conf /etc/fail2ban/filter.d/nginx-limit-req.conf
#COPY jail.conf /etc/fail2ban/jail.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl-params.conf /etc/nginx/snippets/ssl-params.conf
COPY site /etc/nginx/sites-available/site
COPY socket /etc/nginx/sites-available/socket
COPY startup startup

VOLUME ["/etc/nginx/ssl"]

ENTRYPOINT /startup
EXPOSE 80 443
# https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-debian-8
# setup a cronjob that runs ./certbot-auto -q renew
# /etc/letsencrypt/live/swarmdev.city/
# cert.pem  chain.pem  fullchain.pem  privkey.pem
# docker build -t nginx-nsone .
# docker run -d nginx-nsone 
