# `hash-object`

## Description

Computes the object ID value for an object with specified type with contents of the named files or stdin if --stdin option is invoked, and optionally writes the resulting objects into database.

## Options

**`files`** - list of files to hash.

**`type`** - type of the object to hash. Possible values are `blob`, `commit`, `tag`, `tree`. Defaults to blob.

**`write`** - writes the object into the database. Defaults to false.

**`stdin`** - reads the object from stdin. Defaults to false.

## Usage

```bash
ccgit hash-object [files...] [--type=<type>] [--write] [--stdin]
```

