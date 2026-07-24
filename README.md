# Cobra
- [Development Setup](#development-setup)
  - [Devcontainer with VS Code](#devcontainer-with-vs-code)
  - [Local dev with Docker Compose](#local-dev-with-docker-compose)
  - [Local Ruby installation](#local-ruby-installation)
  - [Important Commands](#important-commands)
  - [Feature flags](#feature-flags)

For local development, you can either use Docker, and potentially Devcontainers, or you can use your own installation of
Ruby and/or PostgreSQL. The included setup can deploy these in Docker containers rather than needing to install them.
Depending on your IDE or code editor, you may prefer to install Ruby locally.

## Development Setup
### Devcontainer with VS Code
The application has a Docker
[DevContainer](https://code.visualstudio.com/docs/devcontainers/containers)
setup. If you use VS Code, this is the easiest way to develop for Cobra.

If you open this folder in VS Code it will prompt you to re-open in the
devcontainer. From there, your terminal will be in the container and you will have a
self-contained, full-featured development environment.

### Local dev with Docker Compose
If you want to develop with docker outside of VS Code, these instructions are
for you. This set up is preferred over local environment dev to keep
development and deployed versions consistent.

Local changes are live refreshed for both ruby and svelte aside from server-startup configuration.

1. Set up config files
   ```sh
   $ cat config/database.example.app-in-docker.yml | sed s/localhost/db/ > config/database.yml
   $ echo "POSTGRES_PASSWORD=cobra" > .env
   $ echo "RAILS_ENV=development" >> .env
   ```
2. Start the application
   ```sh
   $ docker compose up -d
   ```

To interact with the application, enter the `app` shell and run your commands in there.
```sh
$ docker compose exec app /bin/sh
```

### Local Ruby installation
1. Get the project
   ```sh
   $ git clone https://github.com/Project-NISEI/cobra.git
   $ cd cobra
   ```
2. Install dependencies
   ```sh
   $ bundle
   ```
3. Set up config files
   ```sh
   $ cp config/database.example.app-in-host.yml config/database.yml
   ```
4. Set up database in Docker
   ```sh
   $ echo "POSTGRES_PASSWORD=cobra" > .env
   $ echo "RAILS_ENV=development" >> .env
   $ bin/init-db-from-host
   ```

This will create a Docker container running PostgreSQL and set up the database there.
If you prefer to install PostgreSQL locally instead, you can set up the database like this:
```sh
$ psql postgres
    # create user cobra with password 'cobra' CREATEDB;
    # \q
$ rails db:create db:migrate
```

Start local server in your IDE, or with the Rails CLI (this was installed when you ran `bundle`):
```sh
$ rails server
```

### Important commands
#### Update IDs from the NRDB API
```sh
$ bundle exec rails ids:update
```
This task queries the NRDB API and creates/updates identities as appropriate.
Identities not in the database are stripped out of ABR uploads to avoid errors.
This is run automatically by `bin/deploy` and `bin/init-db-*`.

#### Update Card Sets from the NRDB API
```sh
$ bundle exec rails card_sets:update
```

#### Seed Tournament Metadata
Formats, tournament types, and prize kits are seeded by this task.
```sh
$ bundle exec rails tournament_metadata:seed
```

#### Run tests
```sh
$ bundle exec rspec
```

Note that you will need to override the environment if you are running this in a Docker container:
```sh
$ RAILS_ENV=test bundle exec rspec
```

### Feature flags
[Flipper](https://github.com/jnunemaker/flipper) is included to give the option to hide or disable features which are
incomplete. This lets you make changes in smaller increments, while still being able to deploy to a production
environment with your feature hidden.

You can enable or disable a feature for all development environments by editing
[development.rb](config/environments/development.rb).

That file can include code similar to the following, which will enable the feature when the app starts up. The rescue
block handles cases where the database is not fully initialized, eg. in a Rails task.

```ruby
Rails.application.configure do

   # There should be other configuration here...

   config.after_initialize do
      begin
         Flipper.enable :nrdb_deck_registration
      rescue => e
         Rails.logger.warn "Failed setting Flipper features: #{e.class}"
      end
   end
end
```

