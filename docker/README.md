# OrchStep Docker Image

## Usage

```bash
docker pull orchstep/orchstep:latest
docker run orchstep/orchstep version
docker run orchstep/orchstep run deploy --var env=prod
```

## Tags

- `orchstep/orchstep:latest` -- Latest stable release
- `orchstep/orchstep:v1.0.0` -- Specific version

## Building

The Docker image is built as part of the GoReleaser pipeline. The binary is copied into an Alpine base image.
