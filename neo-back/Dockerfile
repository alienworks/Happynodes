FROM node:carbon

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

RUN npm i npm@latest -g

COPY . .

EXPOSE 3001

CMD [ "npm", "start" ]
