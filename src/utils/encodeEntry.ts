import { CTIME_NANO_OFFSET, CTIME_OFFSET, DEV_OFFSET, FILES_SIZE_OFFSET, GID_OFFSET, SHA_OFFSET, INO_OFFSET, MODE_OFFSET, MTIME_NANO_OFFSET, MTIME_OFFSET, PREFIX_SIZE, UID_OFFSET, FLAGS_OFFSET } from '../constants/constants';
import { IGitEntry } from '../types/types';

export function encodeEntry(entry: IGitEntry): Buffer {
    const prefix = Buffer.alloc(PREFIX_SIZE);

    prefix.writeUInt32BE(entry.ctimeSec, CTIME_OFFSET);
    prefix.writeUInt32BE(entry.ctimeNano, CTIME_NANO_OFFSET);

    prefix.writeUInt32BE(entry.mtimeSec, MTIME_OFFSET);
    prefix.writeUInt32BE(entry.mtimeNano, MTIME_NANO_OFFSET);

    prefix.writeUInt32BE(entry.dev, DEV_OFFSET);
    prefix.writeUInt32BE((entry.ino << 32), INO_OFFSET);

    prefix.writeUInt32BE(entry.modeType, MODE_OFFSET);

    prefix.writeUInt32BE(entry.uid, UID_OFFSET);

    prefix.writeUInt32BE(entry.gid, GID_OFFSET);

    prefix.writeUInt32BE(entry.fileSize, FILES_SIZE_OFFSET);

    prefix.set(Buffer.from(entry.sha, 'hex'), SHA_OFFSET);

    const nameLength = entry.name.length < 0xfff ? entry.name.length : 0xfff;
    prefix.writeUInt16BE(entry.assumeValid | entry.stage | nameLength , FLAGS_OFFSET);

    const pathName = Buffer.from(entry.name, 'ascii');

    const paddingSize = 8 - ((PREFIX_SIZE + pathName.byteLength) % 8);

    const padding = Buffer.alloc(paddingSize, '\0');

    return Buffer.concat([prefix, pathName, padding]);
}
