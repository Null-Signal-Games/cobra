# Stage 1: Copy Node.js binaries from the official Node Alpine image
FROM node:24-alpine AS node-builder

# Stage 2: Create the final ruby & node image
FROM ruby:3.4-alpine3.24 AS base

# Copy Node.js binaries from the node-builder stage
COPY --from=node-builder /usr/lib /usr/lib
COPY --from=node-builder /usr/local/share /usr/local/share
COPY --from=node-builder /usr/local/lib /usr/local/lib
COPY --from=node-builder /usr/local/include /usr/local/include
COPY --from=node-builder /usr/local/bin /usr/local/bin

# Install essential Linux packages and nodejs
RUN apk -U upgrade && apk add --no-cache \
  gcompat \
  libffi-dev \
  npm \
  postgresql-client \
  tzdata \
  yaml-dev \
  && rm -rf /var/cache/apk/*

# Define where our application will live inside the image
ENV RAILS_ROOT=/var/www/cobra
ENV BUNDLE_ROOT=/var/www/bundle


#####################################################################
FROM base AS build

# Install build packages
RUN apk -U upgrade && apk add --no-cache \
  bash build-base libpq-dev ca-certificates \
  && rm -rf /var/cache/apk/*

# Create application home. App server will need the pids dir so just create everything in one shot
RUN mkdir -p $RAILS_ROOT/tmp/pids

# Set our working directory inside the image
WORKDIR $RAILS_ROOT

# Throw errors if Gemfile has been modified since Gemfile.lock
RUN bundle config --global frozen 1

COPY Gemfile Gemfile.lock package.json package-lock.json ./

# Prevent bundler warnings; ensure that the bundler version executed is >= that which created Gemfile.lock
RUN gem install bundler

# Finish establishing our Ruby environment
RUN bundle config set --local path $BUNDLE_ROOT && \
  bundle config set force_ruby_platform true && \
  bundle install --verbose
RUN npm install

COPY . $RAILS_ROOT/

# Precompile assets with dummy values for secret key base and database connection (these will not be used elsewhere)
ENV SECRET_KEY_BASE_DUMMY=precompile-assets-only
RUN cp $RAILS_ROOT/config/database.build.yml $RAILS_ROOT/config/database.yml \
    && RAILS_ENV=production bundle exec rake assets:precompile --trace \
    && rm $RAILS_ROOT/config/database.yml


#####################################################################
FROM base AS final

WORKDIR $RAILS_ROOT
RUN bundle config set --local path $BUNDLE_ROOT
COPY --from=build $RAILS_ROOT $RAILS_ROOT/
COPY --from=build $BUNDLE_ROOT $BUNDLE_ROOT/

EXPOSE 3000
RUN chmod +x ./entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

# Start the main process.
CMD ["/bin/sh", "-c", "bundle exec puma"]
