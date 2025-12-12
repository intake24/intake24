# Download food images

This command downloads the official Intake24 food images archive and extracts it into the images directory used by the API. The target directory is taken from the API environment variable `FS_IMAGES` (by default `apps/api/storage/public/images`).

:::warning
Note that this operation will overwrite any existing images in the target directory.
:::

The food images archive is located at:

https://storage.googleapis.com/intake24/images/intake24-images-MRC-LIVE-19112025.zip

Run the following command to download and extract the images:

```sh
pnpm cli init:food-images --url https://storage.googleapis.com/intake24/images/intake24-images-MRC-LIVE-19112025.zip
```

:::warning
Note that currently the image arcihive is quite large (~18GB) and the download may take significant time and disk space.

And to save space, the CLI will remove the download zip file once it is decompressed to the `FS_IMAGES`.
:::
