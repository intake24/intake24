# Initialize Intake24 Assets

The Intake24 CLI provides commands to download essential assets required for the proper functioning of the Intake24 system.

```sh
pnpm cli init:assets
```

Command can download following assets:

- System database snapshot
- Food database snapshot
- Food images archive

## System database

System database snapshot is structure-only and needs to be populated with `pnpm cli init:db:system` command.

:::info
If docker is used, docker init script will download and restore the system database automatically.
:::

## Food database

Food database snapshot contains both structure and data. It will be restored into the food database.

:::info
If docker is used, docker init script will download and restore the food database automatically.
:::

## Food images

If food images extraction is selected, the command will extract food images into the directory specified by the API environment variable `FS_IMAGES` (by default `apps/api/storage/public/images`).

:::warning
Note that this operation will overwrite any existing images in the target directory.

Note that currently the image archive is quite large (~18GB) and the download may take significant time and disk space.

To save space, the CLI will remove the download zip file once it is decompressed to the `FS_IMAGES`.
:::
