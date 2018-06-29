# base image
FROM node:9.6.1

# set working directory
RUN mkdir /usr/src/app
WORKDIR /usr/src/app

# add `/usr/src/app/node_modules/.bin` to $PATH
ENV PATH /usr/src/app/node_modules/.bin:$PATH


# install and cache app dependencies 
# .package.json is old package file with lot of dependency
# for faster caching
COPY .package.json /usr/src/app/package.json
RUN npm install -g serve
RUN npm install --silent
RUN npm install react-scripts@1.1.1 -g --silent

# install and cache app dependencies
COPY package.json /usr/src/app/package.json
RUN npm install --silent

RUN echo "REACT_APP_GA_KEY=\"$REACT_APP_GA_KEY\" \nDANGEROUSLY_DISABLE_HOST_CHECK=$DANGEROUSLY_DISABLE_HOST_CHECK \nREACT_APP_API_URL=\"http://api.happynodes-integration.f27.ventures\"" > .env
COPY . .

EXPOSE 3000

RUN npm run build

# start app
CMD serve -s build -p 3000
