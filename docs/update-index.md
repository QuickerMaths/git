# `update-index`

## Description

Register files in the working directory to the index file, if it does not exists it is created.

## Options

**`files`** - files to update index with.

**`add`** - if specified it checks if file isn't in the index and then adds. If file is in the index already it igrnoes it. Defaults to false.

## Usage

```bash
ccgit update-index [files...] [--add]
```
