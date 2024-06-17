# `status`

## Description

Displays paths that differences between the index file and curretn HEAD commit, path that diffirenced between the working tree and and index file, and the paths that are not being tracked by CCGit.

## Options

**`paths`** - files paths that satus command will display. If no paths are specified it will display all paths.

**`untracked-files`** - show individual file in utracked directores. Defaults to false.

## Usage

```bash
ccgit status [paths...] [--utracked-files]
```
