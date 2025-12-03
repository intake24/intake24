# Development using Docker

The more preferred approach is to use OCL-compatible platform like Docker to deploy and run the database systems needed to run Intake24 development.

Using containers to deploy databases allow you to run Intake24 development environment in local using less resource. The `init` script run along with docker compose script will create the sample databases and schemas in PostgreSQL for you. However, here we also provide steps to import data of `foods` and `system` databaes by yourself.

## Installation

Intake24 provided `docker-compose.yml`. Once you have installed compatible container platform (Intake24 uses Docker), you can navigate to `/docker` folder and execute docker compose script by

```bash
docker compose up -d
```

After that, you should have PostgreSQL and Redis server set to bind with corresponding host ports (`5432` to PostgreSQL, `6379` to Redis)

::: warning

- The script may fail if you have existing services running on these ports
- The script will download database snapshot from remote storage. Make sure you have internet connection when you run the script for the first time.
  :::

Once it is completed, you can use the `redis-cli` to connect to and test the Redis server, e.g. using `PING` command. This should return `PONG` if the connection is successful.

#### Logs

The PostgreSQL server log can be found in:

```bash
docker logs <postgres-container-name>
```

Replace `<postgres-container-name>` by the postgreSQL container id.

### Docker tear down

To stop and remove the containers, networks, and volumes created by `docker-compose up`, you can run the following command in the same directory where your `docker-compose.yml` file is located:

```bash
docker compose down
```

If you want to remove the associated volumes (which will delete all data stored in the databases), you can add the `-v` flag:

```bash
docker compose down -v
```
