# `cat-file`

## Description

Provides the content or the type of the object in the repository.

## Options

**`object`** - the sha1 hash of the object to show.

**`type`** - defines type of given <object>.

**`return-type`** - insead of content, show the object type identified by <object>.

**`size`** - instead od the content, show the object size identified by <object>.

**`pretty-print`** - preety-print contents of the <object>, based on its type.

## Usage

```bash
ccgit cat-file <object> [--type=<type>] [--return-type] [--size] [--pretty-print] 
```
