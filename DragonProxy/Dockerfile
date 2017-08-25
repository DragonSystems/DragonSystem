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
COPY nginx.conf /etc/nginx/nginx.conf
COPY ssl-params.conf /etc/nginx/snippets/ssl-params.conf
COPY site /etc/nginx/sites-available/site
COPY socket /etc/nginx/sites-available/socket
COPY startup startup
VOLUME ["/etc/nginx/ssl"]
ENTRYPOINT /startup
EXPOSE 80 443

