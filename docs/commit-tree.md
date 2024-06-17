# `commit-tree`

## Description

Creates new commit object.

## Options

**`tree`** - tree object to create commit with.

**`message`** - message that describes the commit. If not provided the stdin will be read.

**`parent`** - parent commit hash.

## Usage

```bash
ccgit commit-tree <tree> [--message=<message>] [--parent=<parent>]
```
