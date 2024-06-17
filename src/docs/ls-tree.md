# `ls-tree`

## Description

List the contents of a tree object.

## Options

**`hash`** - hash of a tree.

**`recursive`** - list the contents of the tree recursively. Defaults to false.

**`show-tree`** - show tree enries even if going to recures them. Has no effect if `recursive` is not set. Defualts to false.

## Usage

```bash
ccgit ls-tree <hash> [--recursive] [--show-tree]
```
