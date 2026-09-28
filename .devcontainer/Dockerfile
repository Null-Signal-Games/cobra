# Pull official Playwright image matching your playwright version with all 3 browsers (chromium, webkit, firefox)
FROM mcr.microsoft.com/playwright:v1.63.0-noble AS playwright-browsers

FROM mcr.microsoft.com/devcontainers/ruby:3.4-bookworm

# Default value to allow debug server to serve content over GitHub Codespace's port forwarding service
# The value is a comma-separated list of allowed domains
ENV RAILS_DEVELOPMENT_HOSTS=".githubpreview.dev,.preview.app.github.dev,.app.github.dev"

# Install Playwright browser dependencies (Chromium, Firefox, WebKit) and other necessary packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
       libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
       libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 \
       libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
       libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
       libxrender1 libxss1 libxtst6 zlib1g libnss3 libxshmfence1 libegl1 libgles2 \
       libvpx7 libevent-2.1-7 libopus0 libgstreamer1.0-0 libgstreamer-plugins-base1.0-0 \
       libgstreamer-gl1.0-0 libflite1 libwoff1 libharfbuzz-icu0 libsecret-1-0 libhyphen0 \
       libmanette-0.2-0 libgles2-mesa \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Pre-install matching Bundler version and Ruby LSP
RUN gem install "bundler:>= 4.0.9" ruby-lsp

# Configure Playwright shared browsers path and copy pre-installed browsers
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
COPY --from=playwright-browsers /ms-playwright /ms-playwright
RUN chmod -R 777 /ms-playwright

# Ensure volume mount directories and RVM gem directories are writable by the vscode user
RUN mkdir -p /home/vscode/.bundle /commandhistory \
    && chown -R vscode:rvm /home/vscode/.bundle /commandhistory /usr/local/rvm \
    && chmod -R g+w /usr/local/rvm

# Configure RubyGems to install all user gems into the persistent .bundle volume
ENV GEM_HOME="/home/vscode/.bundle"
ENV GEM_PATH="/home/vscode/.bundle:/usr/local/rvm/gems/default:/usr/local/rvm/gems/default@global"
ENV PATH="/home/vscode/.bundle/bin:${PATH}"
