# Download Intake24 database and image assets

## Food Database Snapshot

Intake24 provides database snapshots for `foods` databases that can be used to set up local development environment.

If you use Docker to run Intake24 development environment, the database snapshots will be downloaded automatically when you run the docker compose script.

To download the `foods` database snapshot manually, run:

```sh
curl https://storage.googleapis.com/intake24/foods_snapshot.pgcustom --output foods_snapshot.pgcustom
```

## Image Assets

To download the food image assets, run:

```sh
curl https://storage.googleapis.com/intake24/images.tgz --output images.tgz
```

Then extract the downloaded archive to the desired location:

```sh
tar -xvzf images.tgz -C intake24/apps/api/storage/images
```

Please notes that the images are very large (more than 18GB). Make sure you have enough disk space before downloading and extracting the archive.

Please refer to [Configuration->Filesystem](../config/api/filesystem#images-dir) for instructions on how to configure image assets to set up local development environment.
