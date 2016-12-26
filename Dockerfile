FROM node:6.6
MAINTAINER John Eriksson <root@ranbogmord.com>

RUN npm install -g nodemon

ADD . /app
WORKDIR /app

CMD ["nodemon", "."]
