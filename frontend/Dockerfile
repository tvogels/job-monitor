# To keep image size small, this dockerfile uses a multi-stage build
# First it builds the project in Docker
# Then it creates a second image with just the 'executable'

# Build stage:
FROM node:8-alpine
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

WORKDIR /code

# Install dependencies
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN yarn install

# Build the project
COPY public public
COPY src src

ARG GRAPHQL_HOST
ARG GRAPHQL_PORT

ENV REACT_APP_GRAPHQL_HOST=${GRAPHQL_HOST}
ENV REACT_APP_GRAPHQL_PORT=${GRAPHQL_PORT}

# RUN echo "GRAPHQL_HOST=${GRAPHQL_HOST}" > .env && echo "GRAPHQL_PORT=${GRAPHQL_PORT}" >> .env

# RUN cat .env

RUN yarn build


# Actual image
FROM node:8-alpine
LABEL maintainer "Thijs Vogels <thijs.vogels@epfl.ch>"

RUN yarn global add serve

COPY --from=0 /code/build /build

EXPOSE 80

CMD ["serve", "-s", "/build", "-p", "80"]
