/**
 * Minimal ZIP builder (STORED, no compression).
 * Pure JS, no dependencies. Supports files with directory paths in names.
 * Produces a valid ZIP that can be opened by all major OS zip tools.
 */

const CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ buf[i]) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function dosDateTime() {
  const d = new Date()
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2)
  return { date: date & 0xffff, time: time & 0xffff }
}

function u16(view, pos, val) { view.setUint16(pos, val, true) }
function u32(view, pos, val) { view.setUint32(pos, val, true) }

/**
 * Build a ZIP Uint8Array from an array of { name, content } entries.
 * @param {Array<{ name: string, content: string }>} files
 * @returns {Uint8Array}
 */
export function buildZip(files) {
  const enc = new TextEncoder()
  const { date, time } = dosDateTime()

  const entries = files.map(({ name, content }) => {
    const nameBytes = enc.encode(name)
    const dataBytes = enc.encode(content)
    return { nameBytes, dataBytes, crc: crc32(dataBytes) }
  })

  // Compute local header offsets
  const localOffsets = []
  let offset = 0
  for (const e of entries) {
    localOffsets.push(offset)
    offset += 30 + e.nameBytes.length + e.dataBytes.length
  }

  const cdOffset = offset
  let cdSize = 0
  for (const e of entries) cdSize += 46 + e.nameBytes.length

  const totalSize = cdOffset + cdSize + 22
  const buf = new Uint8Array(totalSize)
  const view = new DataView(buf.buffer)
  let pos = 0

  // Local file entries
  for (let i = 0; i < entries.length; i++) {
    const { nameBytes, dataBytes, crc } = entries[i]
    const sz = dataBytes.length

    u32(view, pos, 0x04034b50); pos += 4
    u16(view, pos, 20);         pos += 2  // version needed: 2.0
    u16(view, pos, 0);          pos += 2  // flags
    u16(view, pos, 0);          pos += 2  // compression: STORED
    u16(view, pos, time);       pos += 2
    u16(view, pos, date);       pos += 2
    u32(view, pos, crc);        pos += 4
    u32(view, pos, sz);         pos += 4  // compressed size
    u32(view, pos, sz);         pos += 4  // uncompressed size
    u16(view, pos, nameBytes.length); pos += 2
    u16(view, pos, 0);          pos += 2  // extra field length
    buf.set(nameBytes, pos);    pos += nameBytes.length
    buf.set(dataBytes, pos);    pos += dataBytes.length
  }

  // Central directory
  for (let i = 0; i < entries.length; i++) {
    const { nameBytes, dataBytes, crc } = entries[i]
    const sz = dataBytes.length

    u32(view, pos, 0x02014b50); pos += 4
    u16(view, pos, 20);         pos += 2  // version made by
    u16(view, pos, 20);         pos += 2  // version needed
    u16(view, pos, 0);          pos += 2  // flags
    u16(view, pos, 0);          pos += 2  // compression
    u16(view, pos, time);       pos += 2
    u16(view, pos, date);       pos += 2
    u32(view, pos, crc);        pos += 4
    u32(view, pos, sz);         pos += 4
    u32(view, pos, sz);         pos += 4
    u16(view, pos, nameBytes.length); pos += 2
    u16(view, pos, 0);          pos += 2  // extra field length
    u16(view, pos, 0);          pos += 2  // comment length
    u16(view, pos, 0);          pos += 2  // disk number start
    u16(view, pos, 0);          pos += 2  // internal attrs
    u32(view, pos, 0);          pos += 4  // external attrs
    u32(view, pos, localOffsets[i]); pos += 4
    buf.set(nameBytes, pos);    pos += nameBytes.length
  }

  // End of central directory record
  u32(view, pos, 0x06054b50);  pos += 4
  u16(view, pos, 0);           pos += 2  // disk number
  u16(view, pos, 0);           pos += 2  // disk with CD start
  u16(view, pos, entries.length); pos += 2
  u16(view, pos, entries.length); pos += 2
  u32(view, pos, cdSize);      pos += 4
  u32(view, pos, cdOffset);    pos += 4
  u16(view, pos, 0);           pos += 2  // comment length

  return buf
}
