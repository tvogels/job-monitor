FROM node
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

RUN yarn global add serve

ADD build .

EXPOSE 80

CMD ["serve", "-s", ".", "-p", "80"]
