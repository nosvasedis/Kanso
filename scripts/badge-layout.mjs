/** Reject accidental clipping before Sharp composites a badge layer. */
import sharp from 'sharp';
export async function containedComposite(base,layers,context='badge'){
 const canvas=sharp(base),bounds=await canvas.metadata();
 for(const layer of layers){
  const size=await sharp(layer.input).metadata();
  if(!Number.isInteger(layer.left)||!Number.isInteger(layer.top)||layer.left<0||layer.top<0||layer.left+size.width>bounds.width||layer.top+size.height>bounds.height){
   throw new RangeError(`${context}: layer ${size.width}x${size.height} at ${layer.left},${layer.top} exceeds ${bounds.width}x${bounds.height} canvas`);
  }
 }
 return canvas.composite(layers).png().toBuffer();
}
