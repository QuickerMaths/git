export enum Stage {
  ZERO = 0,
  MERGED = 1,
  OUR_MODE = 2,
  THEIR_MODE = 3
}

export enum EntryType {
  REGULAR = 0b1000,
  SYMBOLIC_LINK = 0b1010,
  GITLINK = 0b1110
}

export enum FileMode {
  EMPTY = 0,
  DIR = 0o0040000,
  REGULAR = 0o0100644,
  DEPRECATED = 0o0100664,
  EXECUTABLE = 0o0100755,
  SYMLINK = 0o0120000,
  SUBMODULE = 0o0160000
}

export enum FileStatusCode {
  UNTRACKED = 'U',
  MODIFIED = 'M',
  DELETED = 'D',
  ADDED = 'A',
  UNMODIFIED = ' '
}
