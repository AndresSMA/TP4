FROM node:latest

RUN mkdir /SERVIDOR
WORKDIR /SERVIDOR

COPY package.json /SERVIDOR/package.json
COPY package-lock.json /SERVIDOR/package-lock.json
RUN npm install

COPY server.js /SERVIDOR/server.js

CMD ["node", "server.js"]
