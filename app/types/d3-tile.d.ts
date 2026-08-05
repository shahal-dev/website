/** d3-tile ships no type definitions; this covers the surface PhotoMap uses. */
declare module 'd3-tile' {
  /** [x, y, z] plus the scale/translate that place it on screen. */
  export type Tile = [number, number, number]

  export interface Tiles extends Array<Tile> {
    scale: number
    translate: [number, number]
  }

  export interface TileGenerator {
    (): Tiles
    size(size: [number, number]): this
    extent(extent: [[number, number], [number, number]]): this
    scale(scale: number): this
    translate(translate: [number, number]): this
    tileSize(size: number): this
    clampX(clamp: boolean): this
    zoomDelta(delta: number): this
  }

  export function tile(): TileGenerator
}
