import sharp from 'sharp';

/** Identical geometry to legacy Cloudinary grid delivery, stored as files. */
export async function createGridCellBuffers(source: Buffer, gridSize: 2 | 3) {
  const oriented = await sharp(source, { limitInputPixels: 80_000_000 }).rotate().toBuffer({ resolveWithObject: true });
  const { width, height } = oriented.info;
  if (width < gridSize * 4 || height < gridSize * 4) throw new Error('分镜母图尺寸无效');
  const cellWidth = Math.floor(width / gridSize), cellHeight = Math.floor(height / gridSize);
  const inset = Math.round(Math.min(cellWidth, cellHeight) * 0.045);
  const cells: Buffer[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let column = 0; column < gridSize; column++) {
      cells.push(await sharp(oriented.data).extract({ left: column * cellWidth + inset, top: row * cellHeight + inset, width: cellWidth - inset * 2, height: cellHeight - inset * 2 })
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 95, effort: 4 }).toBuffer());
    }
  }
  return { width, height, cells };
}
